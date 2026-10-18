# Implementation ledger

Approved scope: Kotlin + GeckoView + bundled Ruffle; GitHub build and emulator smoke tests first. User performs official authentication/gameplay. No local SDK required, no network/proxy changes, no screenshots.

Workspace: dedicated fresh clone at `D:\workspace\roco-app`; user explicitly requested git.exe and direct main pushes. No additional worktree needed.

## Tasks

- [ ] Build bootstrap, pinned assets, CI.
- [ ] Main/associated windows, prompts, persistence, diagnostics.
- [ ] Deterministic emulator tests including executed Flash, popup relationship, cookie persistence.
- [ ] GitHub build/test results and artifacts; final review.

First cloud run failed during setup-android, before compilation. Public job logs require GitHub login; annotations contain no SDK error. Replaced that action with explicit hosted SDK command plus build-failure annotations, using Java 21 only for sdkmanager and Java 17 for Gradle. Pinned ubuntu-24.04 to avoid upcoming ubuntu-latest migration.

Fresh reviewer identified window focus/command-target mismatch. Added WindowRegistry plus regression tests: opener focus changes selected session without changing lifetime order; closing active popup returns to its opener. Node privacy RED (missing module) then GREEN 2/2 recorded locally; Kotlin tests will run in cloud (SDK unavailable locally).

Second cloud run: SDK installation passes; prepareRuffle fails "Unexpected extension identity/version". Upstream webpack explicitly uses VERSION4 for extension manifest, separate from release tag. Fixed validation to rely on exact pinned archive SHA256 and required ID/version; record release and manifest versions separately. No checksum bypass.

Third run reached APK checksum but APK absent. Found workflow shell default did not enforce pipefail around tee; explicitly select bash (GitHub uses -eo pipefail) so Gradle failures are gated and annotated before checksum. Emulator job uses Java 21 for its SDK tooling, independent from Gradle's Java 17.

Fourth run correctly gates on checkDebugAarMetadata (13 dependency compatibility issues). Upgrade compile SDK to 36, AGP 8.13.2, Gradle 8.13, leaving target SDK 35/min SDK 26 unchanged. Record exact observed upstream manifest version 0.7.1.65535 and extension ID in lock, restoring strict identity validation separate from release version. Expand error excerpts to include AAR requirements, not just failure headings.

Fifth run's full AAR report establishes exact requirements: GeckoView 158 and transitive AndroidX core 1.19 require API 37; AndroidX requires AGP >=9.1. Use official API-37-compatible AGP 9.2.0 + Gradle 9.4.1 + SDK37/Build Tools36; adopt AGP's built-in Kotlin (remove obsolete kotlin-android/kotlinOptions), retaining Java bytecode17, target35/min26. Confirmed against official AGP9.2 release notes and built-in Kotlin migration docs. Added real opener-focus regression to fixture smoke, in addition to pure window-selection tests.

SDK37 packaging uses explicit minor levels: Google repository2-3.xml lists platforms;android-37.0, not android-37. Set compileSdk release(37) minorApiLevel=0 and exact sdkmanager package. No local SDK installation needed.

AGP9 rejects Provider values in legacy Android sourceSets. Migrated generated Ruffle assets to variant.sources.assets.addGeneratedSourceDirectory with typed task OutputDirectory, so asset generation carries its task dependency automatically.

Full minor-level metadata check then established GeckoView158 needs API37.2 (not merely major37). Google stable repository contains android-37.2; pin compileSdk minorApiLevel=2 and that exact package. min/target SDK stay unchanged.

Kotlin compilation then found resolved stdlib2.4.20 metadata exceeds AGP9.2 default compiler2.2 reader. Following AGP's documented higher-KGP override, explicitly pin kotlin-gradle-plugin2.4.20 on buildscript classpath, without applying the incompatible kotlin-android module plugin.

With toolchain aligned, Kotlin compilation reported one nullable WebExtension result. Handle null for both bundled-extension registrations; never mark null installation results ready. API37.2/AGP9.2 recommended-version warning is retained (not suppressed); actual AAR validation now passes.

GitHub truncates long individual build annotations; split error excerpts into <=3000-character chunks so final exceptions remain readable without authenticated log access. Stop the original fixture SWF after its FSCommand so repeated frame execution cannot overwrite popup callback markers.

Run39041589848: Kotlin/Java compilation, JVM tests, assembleDebug and assembleDebugAndroidTest completed. Lint fails only on two missing includeSubdomains attributes for loopback domains. Explicit false narrows cleartext scope; no Lint baseline/suppression added.

Run39041784394: BUILD job success, APK artifact12104277928 (194521044 bytes); emulator first instrumentation reports "Process crashed" (not a pass). Added clean-emulator AndroidRuntime crash capture/chunked annotations. Static lifecycle check found parent runtime initialization in Application.onCreate would also run in Gecko child services; move initialization to an idempotent method invoked only by MainActivity. Preserve an existing RufflePlayer object in fixture config instead of replacing extension-injected API.

## Baseline

Repository empty; no AGENTS.md in checkout or D:\workspace / D:\. Windows PATH Java 8, default SDK absent. Authorized Meizu 21 is Android 15 / arm64, Firefox 158.0. No phone writes or login interactions performed for this project.

Ruling: use cloud JDK/SDK and test on API 35 x86_64; build includes arm64-v8a too. Native Rust/NDK and TCP bridge deferred pending evidence. Existing Firefox cases remain historical, not reproduced.

Run39042167412: BUILD succeeds; emulator no longer reports the initial process crash, but first fixture times out with ruffle-install-failed. Preserve the exact built-in install error code and DEBUG-only fixed-extension exception in emulator failure reports before changing compatibility behavior. Extend instrumentation timeout to cover cumulative fixture waits and retain partial output on timeout.

Run39042672989: exact error is "Extension is invalid" (generic exception, not InstallException). Upstream archive now downloaded locally in full and SHA256 verified; it requires _locales/en/messages.json. Android AAPT defaults exclude <dir>_* (same failure documented in Mozilla bug1898002). Remove that directory filter while keeping VCS/junk exclusions. Add post-build verification comparing every packaged extension file byte-for-byte with the checksum-verified upstream XPI. Checker regression: missing locale fixture fails, complete fixture passes. Engine/API behavior remains unmodified.

Run39043167729: build, lint, JVM tests and every packaged Ruffle file verification pass. Emulator now reports ruffle-installed and loads loopback fixture; ActionScript callback times out with probe-loading. Enable browser console output only for explicitly launched DEBUG fixture mode, add fixed fixture-stage/error markers, and collect these logs only from fresh unauthenticated CI emulator. Normal official browsing keeps console output disabled.

Run39089159173: build passes; fixture now reports javascript-error, proving inline scripts execute. Expected GeckoConsole output absent from logcat. Add bounded exception-text return from fixed loopback fixture to LocalProbeServer and include it in test failure; this script is never injected into official pages. No speculative player/engine changes.

Run39089592007: exact fixture error is RuntimeError: unreachable executed at9015556:1, a Wasm trap. Same fixture/SWF executes successfully in a clean Windows Chrome headless browser through pinned Ruffle/Wasm code. Preserve bounded pre-trap console.error panic messages and JS stack in a fixture-only ring; do not change renderer/security/engine before obtaining the panic reason.

Run39090025900: panic capture identifies wgpu30.0.1 pipeline shader validation exceeding emulator GL_MAX_VERTEX_UNIFORM_VECTORS(256). Apply only the upstream preferredRenderer:webgl option to the fixed self-test before both automatic and explicit loads. Keep official-page renderer defaults unchanged; document lower renderer coverage and default-wgpu failure. No engine/security/version change.

Run39090465122 / ec114ef: BUILD and SMOKE both completed success. All three required separate-process instrumentation methods passed; artifact12121968252 contains Debug app and test APKs,194578602 bytes (bundle digest8602febafdf539969859217e23bac67297d4bc4704dd0e4db9b309c11ef01d55). Final read-only reviewer found no important workaround-scope/claims defect. Local Node privacy tests2/2 passed again. Update delivered docs with actual evidence; official-game gates remain manual/unverified.
