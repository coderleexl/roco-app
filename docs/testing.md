# Test plan

0.1.12本地四项模拟器用例均OK(1test)：声音非零混音6.71s、Flash/关联窗口6.815s、seed7.016s、重启Cookie3.865s；应用私有日志已直接读回验证。

0.1.12: Node命令再增加 `tools/audio-probe.test.cjs`（当前35项），覆盖冷启动等待、只有metadata或静音混音缓冲不算提示音、错误日志不保存原文；WebSocket与native计数保留固定字段。JVM11项含私有日志轮换/无自由文本、观察器隔离及二进制桥首次收发/总字节核对。强化音频模拟器用例必须实际产生非零混音缓冲；这仍不代替手机听音。

0.1.11本地验证：Node29/JVM9/lint/主包及测试包通过；签名和完整Ruffle资源校验通过。隔离API37/x86_64 AVD四项均OK(1test)：声音手势/PCM加载6.525s、Flash/关联窗口8.756s、seed8.391s、重启Cookie4.924s。不截图，不自动操作官网；新刷新端口/真机声音/服务器列表和阶段诊断仍需用户操作验收。

Current Node command: `node --test tools/diagnostics.test.cjs tools/compatibility.test.cjs tools/player-options.test.cjs tools/engine-signals.test.cjs tools/audio-unlock.test.cjs tools/socket-config.test.cjs tools/game-control.test.cjs tools/audio-probe.test.cjs`.0.1.10 passes25 Node tests, including trusted-vs-synthetic gesture handling, resume retry/late context creation, bounded diagnostics, exact bridge configuration and native-startup retry with JSON-text responses. JVM8 tests include actual local binary forwarding (100000bytes), handshake rejection and destination/address policy. These do not establish real sound, website login or server/map compatibility. User performs actual game verification without repeated authentication requests.

2026-10-18 local0.1.10: lint/app+test APK builds, signature and full upstream Ruffle asset verification pass. Three separate-process fixed-fixture instrumentation methods on an isolated API37.0/x86_64 AVD returnOK(1test):7.058s/6.751s/3.728s. This also verifies compatibility background/native startup registration. Two earlier smoke attempts timed out before navigation because direct JSONObject native replies did not complete; JSON-text replies plus bounded retry pass the final run. The user's existing AVD was not modified; its insufficient C-disk space was avoided with a workspace-cache fixture AVD. No screenshot or official-game automation occurred.

## Automated

- 0.1.11: Node命令增加 `tools/game-control.test.cjs`，覆盖仅主电影刷新、无参数导出/整页导航、错误后重试与并发抑制；加载trace测试只保留固定阶段计数。JVM补充官方刷新来源边界。
- 新增 `audioFixtureStartsAfterUserGesture` 独立模拟器用例：真实测试触摸启动浏览器AudioContext并确认running，再加载原创Flash PCM样例并确认ready。CI共4项独立进程用例；无音频输出的模拟器不能证明物理可听声音。

- `node --test tools/diagnostics.test.cjs tools/compatibility.test.cjs`: strip credentials, token queries/fragments and opaque paths; ignore headers and bodies.
- `./gradlew testDebugUnitTest lintDebug assembleDebug assembleDebugAndroidTest`: Kotlin sanitizer/ring-buffer tests, static Android checks, arm64/x86_64 Debug APK and instrumentation APK.
- GitHub API 35 x86_64 emulator uses actual GeckoView and bundled official Ruffle, without screenshots:
  1. Original Flash uses the upstream legacy `webgl` renderer in the local fixture (emulator default-wgpu limitation recorded in compatibility.md) and executes `fscommand("roco-probe", "executed")`; only its callback passes the gate.
  2. A real synthetic touch opens a child, checks shared HttpOnly fixture cookie and opener callback, then window.close returns to main.
  3. Cookie seeded with Max-Age; process force-stopped; separate instrumentation run checks persistence without first setting a cookie.
- Instrumentation stdout must contain `OK (1 test)`; adb exit code alone is insufficient. Build/emulator reports are artifacts.
- Public entry probe records status/elapsed time and sanitized redirect metadata only. Network failure is recorded as failure/unknown, not interpreted as game incompatibility.

## 0.1.11人工复测

用户先点顶栏“声音测试”，分别试听浏览器和Flash，反馈两种是否能听见；点“关闭子窗口”返回原游戏。主游戏就绪时点“刷新游戏”，检查是否仍在游戏层、服务器列表是否出现；无主游戏时只显示提示。官方认证/扫码及选服均由用户操作，不自动重放认证地址。真实音乐、实际选服和地图分别验收，不以测试音或资源HTTP200替代。

## Manual game acceptance

User completes normal login, server selection, map load, movement, interface opening and a basic battle. Run 15 minutes, record crashes/disconnects/stalls; restart App and check recovery or normal re-login. Record version, commit and failure gate, not credentials or screenshots.

No local SDK or NDK is required to download an Actions APK. Meizu arm64 is a separate acceptance target from the CI emulator.

## Additional diagnostic observation

2026-10-18: a one-off isolated Windows Chrome headless test loaded the same original SWF through the pinned Ruffle browser/Wasm code and reached ROCO:flash-executed. This establishes that the SWF and FSCommand callback can execute; it does not pass the Android/GeckoView gate or prove official game compatibility. No screenshots, accounts, or existing browser profiles were used.

## Confirmed Android result

2026-10-18 / ec114ef / [run39090465122](https://github.com/coderleexl/roco-app/actions/runs/39090465122): build, lint, JVM tests, packaged extension integrity and all three separate-process instrumentation tests passed on API35 x86_64. Original Flash FSCommand callback, opener focus, shared HttpOnly fixture cookie, close callback and restart persistence passed. Fixture requests legacy WebGL to avoid the documented default-wgpu shader limit. APK bundle: [download](https://github.com/coderleexl/roco-app/actions/runs/39090465122/artifacts/12121968252); app path inside bundle `debug/app-debug.apk`. Meizu/official-game acceptance remains unverified.

2026-10-18 follow-up: [run39091368510](https://github.com/coderleexl/roco-app/actions/runs/39091368510) / ba84be2 passes build and three smoke methods after focus readiness guard. Windows JBR25 + SDK37.2 build also passes4 JVM tests, lint and both APK tasks; local APK signature and full upstream extension asset checks pass. User-approved Meizu installation returned Success; user-operated official-game validation still pending.

0.1.1: adapter tests cover the valid public-asset case and fail-closed host/path/port/scheme/initiator/method/type/status/MIME boundaries, retention of existing server CORS policy, no credentialed CORS header, and input immutability. Node suite5 passes after initial missing-module failure. Instrumentation additionally requires compatibility extension registration before the original Flash fixture. Device updater retest must be user operated and separately authorized.
