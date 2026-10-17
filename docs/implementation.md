# Implementation ledger

Approved scope: Kotlin + GeckoView + bundled Ruffle; GitHub build and emulator smoke tests first. User performs official authentication/gameplay. No local SDK required, no network/proxy changes, no screenshots.

Workspace: dedicated fresh clone at `D:\workspace\roco-app`; user explicitly requested git.exe and direct main pushes. No additional worktree needed.

## Tasks

- [ ] Build bootstrap, pinned assets, CI.
- [ ] Main/associated windows, prompts, persistence, diagnostics.
- [ ] Deterministic emulator tests including executed Flash, popup relationship, cookie persistence.
- [ ] GitHub build/test results and artifacts; final review.

## Baseline

Repository empty; no AGENTS.md in checkout or D:\workspace / D:\. Windows PATH Java 8, default SDK absent. Authorized Meizu 21 is Android 15 / arm64, Firefox 158.0. No phone writes or login interactions performed for this project.

Ruling: use cloud JDK/SDK and test on API 35 x86_64; build includes arm64-v8a too. Native Rust/NDK and TCP bridge deferred pending evidence. Existing Firefox cases remain historical, not reproduced.
