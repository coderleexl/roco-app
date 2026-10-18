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

Final-docs run39090845259: Flash execution passes but Instrumentation.sendPointerSync ACTION_DOWN fails with targeted event not directed to app UID. Prior complete run passed; add explicit Activity/GeckoView window-focus gate and waitForIdleSync before computing/tapping coordinates, and use real elapsed80ms between DOWN/UP. Do not bypass target UID checks or dismiss system dialogs.

Run39091368510 / ba84be2: build and all three smoke methods pass after focus readiness fix. User authorized SDK37.2 installation and primary APK installation; official SDK ZIP checksum verified, installed alongside37.0. Local Windows build succeeds with JBR25/Gradle9.4.1,4 JVM tests/lint/bothAPK tasks. Local APK SHA2560ade4f212765791a2b25c748bb48cdd6a6ac6361200c03fca0bcdc9333a501f1; signaturev2 and complete Ruffle files verified. ADB461QYGDN225SM install-r returnsSuccess, package0.1.0/code1 confirmed read-only. No screenshots, app launch/account interactions or system network modifications. Add AGENTS.md and docs/handoff.md per user request to update docs and push every change. User/IDE Java25 criteria file preserved untracked.

0.1.1 investigation: read-only MeizuRDP confirms root publicSWF CORS missingACAO atHTTP200, while native process remains alive. PublicHEAD corroborates missingheader with Flash MIME/92627bytes. Add separate tightly scoped MV2 response adapter, gate initial navigation on its installation, bumpcode2/version0.1.1. Node boundary/privacy5 tests GREEN after observed missingmodule RED. No phone modification beyond prior authorized0.1.0 installation; update retest awaits approval.

0.1.1 local Kotlin/JVM tests, lint, app and instrumentation APK build pass. Read-only reviewer finds no important scope/init defect and confirms remaining real-request validation gap. Add fail-closed ACAC-header guard with observed RED/GREEN regression so the shim cannot enable an existing credentialed-CORS response. Ignore generated local .kotlin cache; preserve user JVM criteria file. CI/phone retest pending.

0.1.1 was authorized and installed in place successfully; user then reported incomplete homepage animation and a repeated Flash error after QR scanning. Read-only frame/player inspection plus PageError identifies public res-host `/preloader.swf` and `/main.swf` missingACAO atHTTP200. Independent publicHEAD confirms Flash MIME/9721 and54455 bytes. No authenticated game acceptance inferred. Add these exact asset/source pairs in0.1.2/code3 and compatibility1.0.1; preloader restricted to official homepage, main to exactHTTPS officialweb2 origin without guessing callback paths. New boundary regression RED then GREEN; combined Node6 pass, JVM4/lint/bothAPK build successful42s. Official Ruffle assets and signature verified; APK SHA2566a72102c3652316a27b8cafe79ce3812878484469bdf894a2263ba8433ed64bd. Phone update awaits specific approval; user performs website retest. Cloud checks are not a prerequisite during this local-debug phase.

0.1.2 installed under ongoing APK upgrade authorization. Real read-only inspection now confirms preloader/main readyState2 with metadata and no overlay/panic. User reports version-file failure; PageError identifies res-host `/ver.config` missingACAO atHTTP200 in web2 game frame; public HEAD corroborates octet-stream/217494bytes. Add exact config path/source/MIME rule in0.1.3/code4 and compatibility1.0.2, with RED/GREEN boundary regression; Node7/JVM4/lint/bothAPK build pass43s, signature and full Ruffle assets verified. SHA2567163fdefdfa7d56bf78405da7a26be9638cca1d6c1b881655a0d31164fe661d3. In-place phone install returnsSuccess; package confirms0.1.3/code4. Await user retest; no automatic webpage/account operation. Password-free request recorded as official persistent-session restoration investigation, not password storage or ticket replay.

0.1.3 user reports homepage black except Start. Read-only root/preloader players execute without panic; PageError identifies dynamic `/swf/ceils/ROCO-Z8_Ceil_3.swf` missingACAO/HTTP200, corroborated by publicHEAD Flash MIME/164312bytes. Add exact homepage-only resource in0.1.4/code5 and compatibility1.0.3; sibling files remain blocked. Regression RED/GREEN, Node8/JVM4/lint/bothAPK build pass41s, signature and official Ruffle assets verified. SHA2561d1e5f0570ed088a51b57fd28e056c4e8a0103e6965297ee1eae2845fbf4f695. Authorized in-place install returnsSuccess; package confirms0.1.4/code5. Await user visual check; no game main frame in this snapshot, so version-file adaptation remains unverified. No renderer/auth/system-network changes.

0.1.5/code6 brand update: user selected 时光匣 after the earlier 拾帧 candidate. Replace launcher label with string resource, add original open-box/pixel-light vector, adaptive icon and Android33 monochrome variant; editable SVG and branding notes retained. No package/profile/game compatibility changes. Local lintDebug/assembleDebug pass47s; aapt confirms label时光匣, version0.1.5/code6 and packaged launcher XML. Signature and complete Ruffle verification pass; APK SHA2561dba29a2eb2b244acb161aec39e12dfaa63dd1b27fa684b3ec3e2737c9eafaed. No new unit tests for reversible resource-only branding change. Name clearance and root open-source license remain release tasks, not implied by the rename.

0.1.5 user reports loading/reload message. Read-only main/preloader execute and ver.config200/62ms; PageError identifies Global.xml missingACAO/200. Public XML/HEAD establish swf/libs/conf/res roots plus four upcoming bootstrap files. User requests common wrapper and reuse of current login rather than per-file iterations. Consolidate into adaptPublicAssetHeaders/allowedAssetTypes, typed public directories and explicit root resources; restrict origins/method/status/MIME/existing server policy and deny hidden/encoded/CGI/policy-file paths. Compatibility1.1.0, App0.1.6/code7. Public-directory/bootstrap regressions RED then GREEN; hook/manifest integration and privacy total11Node tests pass,4JVM/lint/bothAPK builds pass41s. Signature and full Ruffle asset checks pass; APK SHA25688d36004d681f34aac446578b1db0c0028ce45b57d02e9672ee60d021d634c69. Keep profile/package/signature, do not extract/replay auth or automate QR; real browser bootstrap and session restoration still require user verification. Current live-page upgrade outcome recorded in handoff.

0.1.6 follow-up: actual Global.xml/Angel.config/base libraries200; EffectPluginLib.swf blockedmissingACAO/200 (four game-triggered attempts). Public version ZIP/XML inventory13216 entries explicitly declares plugins/activity/apps/video resources. Expand shared directoryTypes and generated listener patterns with typed suffix boundaries in0.1.7/code8, compatibility1.1.1; excludeh5/backup/script/HTML/unknown types. New boundary regression RED/GREEN; Node12/JVM4/lint/bothAPK build pass43s, signature and full Ruffle assets pass. APK SHA25663fa075692069755243649c44c19d8845c48fd793559bd369dbcc2124c2b9a82. Authorized in-place installSuccess; package confirms0.1.7/code8. User confirms next UX issue is Ruffle start overlay and reports full refresh returns login; configuration/navigation investigation continues without authentication replay.
