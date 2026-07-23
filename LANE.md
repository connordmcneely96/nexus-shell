# Lane 5

This repository is **Lane 5** (`nexus-shell`). Through Phase 1 it is
**mock-data-only**: every engineering value — dimensions, tolerances, stresses,
deflections, loads, margins, and check results — is a `PendingValue` placeholder
because no pipeline produces real values yet; a surface never renders a value
the pipeline did not produce. It holds **zero Cloudflare bindings** (no D1, KV,
R2, Vectorize, Queues, services, or vars — only the OpenNext `ASSETS`
static-assets binding needed to serve the built site). This repo **never writes
to `ll-cockpit`, `engineering-calcs`, or `nexus-exec`**; those are separate
lanes and are read-only references at most.

## Phase 1 status

Phase 1 is **complete**: sprints S1–S6 have shipped. S1 established the
PendingValue type + fail-closed invariant; S2 the static token system; S3 the
app frame and command palette; S4 the mission list and CAD center stage; S5 the
async surface (scripted run engine, confirm gate, gate drawer, live Brain); and
S6 brought infeasible to full fidelity (early-termination fixture + a single
StatusChip source of truth). **S7 is the promotion plan document** — the written
plan for turning this mock shell into the live product. The shell is deployed at
**nexus-shell.connorpattern.workers.dev**.
