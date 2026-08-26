import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { closedLoops } from "@/components/frame/cad/model/sketch/topology";
import { buildExtrudeScript } from "@/lib/extrude/scriptgen";
import type { Sketch } from "@/components/frame/cad/model/sketch/types";

// POST /api/sketch/extrude — sketch → build123d → nexus-exec /run → GLB.
//
// SERVER-SIDE ONLY. The exec secret never reaches the browser: it is read from
// the Cloudflare env (a runtime secret on the worker, NOT a wrangler.toml
// binding) and used only to call /run. The client response carries the GLB and,
// on failure, stderr for diagnosis — never the secret, the script, or full stdout.
export const runtime = "nodejs";

const RUN_URL = "https://nexus-exec.connorpattern.workers.dev/run";
const RUN_TIMEOUT_MS = 60000;

type RunArtifact = { name: string; size_bytes: number; base64?: string };
type RunResponse = {
  status: "ok" | "error";
  exit_code?: number;
  stdout?: string;
  stderr?: string;
  artifacts?: RunArtifact[];
  duration_ms?: number;
};

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
    }

    const { sketch, depth } = (body ?? {}) as { sketch?: Sketch; depth?: unknown };

    // Validate depth: a finite user dimension in a sane range.
    if (typeof depth !== "number" || !Number.isFinite(depth) || depth < 0.1 || depth > 1000) {
      return NextResponse.json({ ok: false, error: "bad-depth" }, { status: 400 });
    }
    // Validate sketch presence/shape minimally.
    if (!sketch || !Array.isArray(sketch.pts) || !Array.isArray(sketch.segs)) {
      return NextResponse.json({ ok: false, error: "bad-sketch" }, { status: 400 });
    }

    // The server does NOT trust the client's gate: re-check the profile is a real
    // single closed loop. An open profile must NEVER reach /run.
    if (!closedLoops(sketch).isClosedProfile) {
      return NextResponse.json({ ok: false, error: "profile-not-closed" }, { status: 422 });
    }

    // Read the secret from the Cloudflare env via OpenNext — never process.env.
    const env = getCloudflareContext().env as unknown as { EXEC_SECRET?: string };
    const secret = env.EXEC_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "exec-not-configured" }, { status: 500 });
    }

    const script = buildExtrudeScript(sketch, depth);

    let runRes: Response;
    try {
      runRes = await fetch(RUN_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-exec-secret": secret },
        body: JSON.stringify({ script, timeout_ms: RUN_TIMEOUT_MS }),
      });
    } catch {
      // Network / reachability failure — a determinate failure, not a swallow.
      return NextResponse.json({ ok: false, error: "exec-unreachable" }, { status: 502 });
    }

    if (!runRes.ok) {
      // TEMPORARY diagnostic surface (S5.1): the direct curl to /run returns 200,
      // but our Worker->Worker subrequest comes back non-ok. Expose what actually
      // arrived so a redirect/normalization is visible. Never the secret. Trimmed
      // in commit 3 once a real extrude is confirmed.
      const bodyText = await runRes.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: "extrude-failed",
          exitCode: runRes.status,
          debug: {
            status: runRes.status,
            statusText: runRes.statusText,
            location: runRes.headers.get("location"),
            redirected: runRes.redirected,
            finalUrl: runRes.url,
            bodyPreview: bodyText.slice(0, 500),
          },
        },
        { status: 502 },
      );
    }

    const run = (await runRes.json()) as RunResponse;

    if (run.status === "error") {
      return NextResponse.json(
        { ok: false, error: "extrude-failed", stderr: run.stderr, exitCode: run.exit_code },
        { status: 502 },
      );
    }

    const glb = run.artifacts?.find((a) => a.name === "model.glb");
    if (!glb?.base64) {
      // Ran clean but produced no GLB — surface stderr for diagnosis.
      return NextResponse.json({ ok: false, error: "no-glb", stderr: run.stderr }, { status: 500 });
    }

    return NextResponse.json({ ok: true, glbBase64: glb.base64, durationMs: run.duration_ms });
  } catch (e) {
    // Never leak the secret or script; the message is safe generic diagnosis.
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, error: "route-exception", message }, { status: 500 });
  }
}
