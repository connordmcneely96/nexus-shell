"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { workbench } from "@/mock/workbench";

// Viewport — a Three.js render of the parametric document. The geometry is
// built PROCEDURALLY from workbench.nodes as a solid of revolution: each node is
// one axial section (axialStart..axialEnd, radius), and the sections are adjacent
// end-to-end, so they read as ONE continuous stepped shaft. Nothing is fetched,
// no asset is loaded, no loader is used. It is a REPRESENTATION, not a
// dimensioned model — the caption says so.
//
// The scene-colour hex literals below are WebGL material/helper colours, not UI
// styling; there are no design tokens for 3D materials, so hex is the only way
// to express them. The token/no-hex rule governs the Tailwind layer, not this.

export type ViewKind = "front" | "top" | "right" | "iso" | "fit";
// A camera command lifted from the toolbar. `seq` changes on every click so the
// same view re-fires (a fresh object identity re-runs the apply effect).
export type CamCommand = { kind: ViewKind; seq: number };

// Canonical view directions and up-vectors. `fit` keeps the current direction.
const VIEW: Record<Exclude<ViewKind, "fit">, { dir: [number, number, number]; up?: [number, number, number] }> = {
  front: { dir: [0, 0, 1] },
  top: { dir: [0, 1, 0], up: [0, 0, -1] },
  right: { dir: [1, 0, 0] },
  iso: { dir: [1, 0.6, 1] },
};

// Frame the camera so the whole model fits, deriving the pull-back distance from
// the vertical FOV rather than guessing a constant — the model fits at any extent.
// A null `dir` keeps the current viewing direction (a Fit). The OrbitControls
// target is always re-centred on the model, so orbit stays coherent after a view.
function frameCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
  dir?: THREE.Vector3,
  up?: THREE.Vector3,
) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (camera.fov * Math.PI) / 180;
  const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.6; // 1.6 = framing margin
  const direction = (dir ?? camera.position.clone().sub(controls.target)).normalize();
  camera.up.copy(up ?? new THREE.Vector3(0, 1, 0));
  camera.position.copy(center).addScaledVector(direction, dist);
  camera.near = Math.max(dist / 100, 0.01);
  camera.far = dist * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

export default function Viewport({
  command,
  selected,
  onSelect,
  glbArrayBuffer,
}: {
  command?: CamCommand | null;
  selected?: string | null;
  onSelect?: (nodeId: string) => void;
  // When present, render this GLB (a concept solid extruded from the sketch)
  // INSTEAD of the procedural fixture. Parsed with GLTFLoader; see S5.
  glbArrayBuffer?: ArrayBuffer | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  // Keep the latest onSelect reachable from the pointerdown listener that is
  // registered once at mount, without re-registering it on every render.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    // Fill the container defensively so the canvas cannot collapse to the
    // 300x150 default before the first setSize lands.
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.GridHelper(400, 20, 0x444444, 0x2a2a2a));
    scene.add(new THREE.AxesHelper(40));
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(1, 1, 1);
    scene.add(key);

    const model = new THREE.Group();
    scene.add(model);

    // Guards the async GLB parse against unmount: if the effect tears down before
    // parse finishes, dispose the orphaned scene rather than adding it to a
    // disposed graph.
    let cancelled = false;

    if (glbArrayBuffer) {
      // Render the extruded concept solid from its GLB instead of the fixture.
      const loader = new GLTFLoader();
      loader.parse(
        glbArrayBuffer,
        "",
        (gltf) => {
          if (cancelled) {
            gltf.scene.traverse((o) => {
              const m = o as THREE.Mesh;
              m.geometry?.dispose();
              const mat = m.material;
              if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose());
            });
            return;
          }
          model.add(gltf.scene);
          frameCamera(camera, controls, model, new THREE.Vector3(1, 0.6, 1));
        },
        () => {
          /* parse errors surface via the route/UI; nothing to render here */
        },
      );
    } else {
      // Procedural stepped-shaft geometry — one cylinder per axial section, sized
      // from the section's radius and length (axialEnd - axialStart) and centred
      // at its midpoint along X. Adjacent sections abut, forming one continuous
      // shaft. Each mesh owns its material so selection and teardown stay per-mesh.
      for (const node of workbench.nodes) {
        const length = node.axialEnd - node.axialStart;
        const geom = new THREE.CylinderGeometry(node.radius, node.radius, length, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.1, roughness: 0.7 });
        const mesh = new THREE.Mesh(geom, material);
        mesh.rotation.z = Math.PI / 2; // default Y-up cylinder -> lie along X
        mesh.position.x = (node.axialStart + node.axialEnd) / 2;
        mesh.userData.nodeId = node.nodeId;
        model.add(mesh);
      }
      frameCamera(camera, controls, model, new THREE.Vector3(1, 0.6, 1));
    }

    cameraRef.current = camera;
    controlsRef.current = controls;
    modelRef.current = model;

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize from the container, not the window — the pane can change size
    // without the window doing so. Returns true once a valid (non-zero) size has
    // been applied. The FIRST valid measurement reframes the camera against the
    // real aspect (the mount-time frameCamera ran against aspect 1); later
    // resizes only resize the buffer and update aspect, so they never fight the
    // user's orbit.
    let sizedOnce = false;
    const resize = (): boolean => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return false;
      renderer.setSize(w, h); // updateStyle=true (default): canvas gets an explicit CSS size
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (!sizedOnce) {
        sizedOnce = true;
        frameCamera(camera, controls, model, new THREE.Vector3(1, 0.6, 1));
      }
      return true;
    };
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    // Kick an immediate measure. If the layout has not settled (0-sized), retry
    // on a bounded rAF loop until the first valid size lands, then stop — some
    // flex/panel layouts settle a frame or two after mount and the observer's
    // first delivery is not useful. Bounded (~30 frames), never a forever-poll.
    let retryRaf = 0;
    if (!resize()) {
      let tries = 0;
      const tick = () => {
        if (resize() || tries++ > 30) return;
        retryRaf = requestAnimationFrame(tick);
      };
      retryRaf = requestAnimationFrame(tick);
    }

    // Pick a mesh on pointerdown and select its tree row. Raycast against the
    // model's meshes; the first hit carries the node id in userData.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const onPointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(model.children, false);
      const id = hits[0]?.object.userData.nodeId;
      if (typeof id === "string") onSelectRef.current?.(id);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    return () => {
      cancelled = true; // stop a late GLB parse from touching a disposed graph
      cameraRef.current = null;
      controlsRef.current = null;
      modelRef.current = null;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(retryRaf); // stop the bounded size-retry loop if still pending
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      ro.disconnect();
      controls.dispose();
      // Dispose every geometry AND every material; collect texture slots into a
      // Set so a texture shared across slots or materials is disposed exactly
      // once. These are the three leak classes from the prior viewer.
      const textures = new Set<THREE.Texture>();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (!mat) return;
        const mats = Array.isArray(mat) ? mat : [mat];
        for (const m of mats) {
          for (const slot of Object.values(m as unknown as Record<string, unknown>)) {
            if (slot && (slot as THREE.Texture).isTexture) textures.add(slot as THREE.Texture);
          }
          m.dispose();
        }
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // Re-init when the GLB changes so a freshly extruded solid replaces the scene.
  }, [glbArrayBuffer]);

  // Reflect the selected tree node onto its mesh. The highlight is an emissive
  // tint (a colour channel) reinforced by a subtle uniform scale (a shape
  // channel), so the selection survives greyscale — the same rule the tree
  // glyphs follow. This is a tint, never a base-colour swap.
  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;
    for (const child of model.children) {
      // A GLB adds a nested Group child (no per-node mesh); only tint fixture meshes.
      if (!(child instanceof THREE.Mesh)) continue;
      const mat = child.material as THREE.MeshStandardMaterial;
      const on = child.userData.nodeId === selected;
      mat.emissive.set(on ? 0x3a5f8a : 0x000000);
      child.scale.setScalar(on ? 1.08 : 1);
    }
  }, [selected]);

  // Apply a camera command from the toolbar. Re-runs on every new command object.
  useEffect(() => {
    if (!command) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const model = modelRef.current;
    if (!camera || !controls || !model) return;
    if (command.kind === "fit") {
      frameCamera(camera, controls, model); // keep current direction
      return;
    }
    const v = VIEW[command.kind];
    frameCamera(
      camera,
      controls,
      model,
      new THREE.Vector3(...v.dir),
      v.up ? new THREE.Vector3(...v.up) : undefined,
    );
  }, [command]);

  // Honest empty state: gated on ACTUAL emptiness (zero geometry nodes), never on
  // render failure — a blank canvas with data present is a bug (commit 1), not an
  // empty state, and must never be masked as "nothing to show". The fixture is
  // the source this slice, so read its length directly.
  if (workbench.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-faint">
        No model yet — awaiting a converged run.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="h-full w-full" />
        {glbArrayBuffer && (
          // Persistent, NON-DISMISSIBLE ungrounded watermark over the solid.
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full border border-pending px-3 py-1 font-mono text-xs text-pending">
            <span>◇</span> CONCEPT · UNGROUNDED
          </div>
        )}
      </div>
      {/* UNGROUNDED PROVENANCE RULE (non-negotiable): a solid extruded from a
          hand-drawn sketch is ungrounded geometry — Concept / Tier-3. It carries
          NO checks, NO citations, and NO PE-seal affordance, and must NEVER be
          presented as grounded, sized, or checked. This is the S5 analogue of the
          CONCEPT-MODE wall. */}
      <div className="border-t border-border-subtle px-5 py-3 text-sm">
        {glbArrayBuffer ? (
          <span className="flex items-center gap-2 text-pending">
            <span>◇</span> Concept solid — ungrounded · not sized · not for fabrication
          </span>
        ) : (
          <span className="text-text-faint">
            Representative geometry from the document — not dimensioned.
          </span>
        )}
      </div>
    </div>
  );
}
