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
