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

## Baseline

Repository empty; no AGENTS.md in checkout or D:\workspace / D:\. Windows PATH Java 8, default SDK absent. Authorized Meizu 21 is Android 15 / arm64, Firefox 158.0. No phone writes or login interactions performed for this project.

Ruling: use cloud JDK/SDK and test on API 35 x86_64; build includes arm64-v8a too. Native Rust/NDK and TCP bridge deferred pending evidence. Existing Firefox cases remain historical, not reproduced.
