# Test plan

0.1.21：Node63/JVM14、lint与两APK通过，构建62s；签名/完整原版Ruffle及6个兼容文件包内一致性通过。新原创零字形设备字体中文Flash样例在真实Gecko/Ruffle生成六个非空、至少4种不同摘要的中文字形，5.660s、OK(1test)；未截图，未导出字形图像。原shortcut/Flash/session回归5.447s、OK(1test)，其他6个未改样例未重跑。CI加入第8个独立进程用例。设备字体选项边界及错误1009/1010/2032、缺字体数字分类/遥测隐私测试通过；已覆盖安装0.1.21/code22。真实战斗文字、首次IOError/活动错误/音乐仍待验收，详见handoff.md。

0.1.20：Node61（新增5项活动HTTP桥，含外realm Request、URL遮蔽拒绝、Response/流字节/403/abort/拒绝敏感端点/不重发）、JVM14、lint及两APK通过，首轮65s、最终增量37s。签名、完整原版Ruffle及包内兼容脚本一致性校验通过。新增本地HTTP两真实Gecko realm用例首轮5.686s、最终外realm Request输入5.343s，原快捷入口/Flash/session回归5.962s，均OK(1test)；HTTP样例验证游戏realm Response、原流内容和403保持，使用本地scope，不证明官方同源请求/礼包业务成功。本轮其余5个未改样例未重跑；CI增加此Node文件及第7个独立进程用例。已覆盖安装0.1.20/code21，最终兼容1.4.1；实际活动、404缺文件、音乐继续待验收，详见handoff.md。

0.1.19：Node56/JVM14、lint及两APK最终构建48s通过（首轮75s），签名/完整原版Ruffle/包内兼容脚本一致性通过。新增两项视口回归先RED再GREEN：同目标无resize时重算，visualViewport尺寸/偏移与事件清理；IO/HTTP分类测试验证只保留限额数字。新本地真实Gecko布局用例7.176s、原快捷入口/Flash/session用例6.446s，均OK(1test)，CI增加至6项独立进程。新用例先因loadProbe第二处路径表漏加/view.html崩溃，修复并重跑通过；本轮其余4项未改样例不重跑。实际官网黑屏/触控仍待用户验收，活动IOError仍失败；详见handoff.md。

0.1.18：Node53/JVM14通过，覆盖登录前仅展示mainiframe而非隐藏preloader、main就绪/重载目标切换、父链失败回退、无容器拒绝、子帧不竞争展示与首页不可刷新。JVM新增首页展示许可与web2刷新许可分离测试；首轮完整构建56s、最终增量构建42s，lint/主包及测试包通过。签名/完整Ruffle资源校验通过，包内兼容脚本与工作区一致。隔离模拟器仅重跑shortcut保留session/返回恢复用例，6.699s、OK(1test)，其余4个未改的本地样例本轮未重跑。真机已覆盖升级0.1.18/code19；官网裁切/触控/登录切换仍需用户验收，不能以模型测试替代。包SHA与设备结果见handoff.md。

0.1.17：Node47项通过，新增game-view的还原/缩放/幂等/父链拒绝/失败回滚及game-control的等待/命令校验/不导航。JVM13、lint及主包/测试包最后构建50s通过；APK签名和完整原版Ruffle核对通过。新增landscapeShortcutKeepsSessionAndBackRestoresBrowsing用例，在原始本地Flash执行后获取真实动态shortcut Intent启动，检查横屏、同一GeckoSession、无新增page-start、返回恢复方向；CI改为5项独立进程。隔离API37/x86_64模拟器5项OK(1test)：shortcut6.653s、Flash/窗口8.882s、seed8.543s、重启Cookie4.973s、声音7.01s。首轮shortcut仅在ActivityScenario.close生命周期追踪失败；测试恢复原fixture Intent后5项完整重跑通过。额外RDP展示注入探针被自动审批拒绝、未执行，未尝试绕过；官方画面缩放/触控及礼包仍需用户验收。APK SHA256 `e5338cfaba2a3d4afcdf64e3bbd8cb3d0c58a89bb4ed29a82a46697798464f78`。


0.1.16：活动exbn用例先RED（旧规则返回undefined）再GREEN；Node41项通过。覆盖三份观察到的活动脚本二进制200、错误MIME/404/其他来源/其他目录/已存在ACAO的拒绝。JVM13/lint/主包和测试包构建49s、签名和完整官方Ruffle资源核对均通过；APK SHA256 `e339515553d0e947941c23c3d9f015fc4df48d349f73841070b8a4c06c75f962`。本轮未重复模拟器固定样例，活动效果由用户复测。0.1.15用户已确认实际进入游戏，礼包IOError仍失败，不能把模拟器样例代替活动验收。


0.1.15：Node40项通过。新增lazy展开65537项精确映射的边界、同根能力/配置拒绝与生成后缓存；本地Node单次约9ms不能代替手机Wasm性能。JVM新增zone1/5/7/65535真实本地100000字节往返和固定诊断ID/总量，外部官方网络不用于单测。JVM13/lint/主包及测试包构建49s通过；签名和完整原版Ruffle校验通过，APK SHA256 `579e2dab06b232f7b321b8439ba21b13317fbe1adfc894550afd32b38f5a50a4`。隔离API37/x86_64模拟器在原创Flash先执行后，使用当前socket-config产生的65537条表重载同一原创SWF，loadedCount65537、FSCommand执行成功；生成11ms、至回调403ms。此为预热独立样例，未新增CI用例，不能代替官网冷启动/区服/地图验收。临时读取脚本首轮漏导入Path失败，补齐后完整重跑通过；均无截图，转发清理。


0.1.14：Node38项通过，精确能力URL/官方顶层范围/不可访问回退和跨realm原始字节回归替换已撤回委派测试。真机临时独立4字节本地WS测试确认原始数据foreign ArrayBuffer、capture复制后为游戏realm ArrayBuffer且内容相同；未触发官方游戏流量。临时USB reverse/forward与服务均清理。JVM12项、lint及主包/测试包构建53s通过，签名/完整Ruffle资源核对通过；APK SHA256 `04d06b3f8b48cf1508820a09547b80bc6bb64a6cea7fed81d120dc1062591d82`。未重复上版模拟器固定样例；真实选服仍需用户验收。

0.1.13：Node38项、JVM12项、lint及主包/测试包完整构建通过（54s）；签名和完整官方Ruffle资源核对通过。新增测试覆盖官方iframe的精确回环委派、动态插入、显式拒绝策略保留，以及原生仅允许官方LOCAL_DEVICE_ACCESS、拒绝局域网/其他来源。APK SHA256 `03623c61af4833d4fa64ce44dc186077a4633171f6bc6e6d1cf8eb317b17b84e`。本轮未重复模拟器四项：上版固定本地样例通过，但不能覆盖官网跨域帧权限；本次针对该变更的单元测试已通过，真实权限回调与选服由用户操作后只读检查。

0.1.12本地四项模拟器用例均OK(1test)：声音非零混音6.71s、Flash/关联窗口6.815s、seed7.016s、重启Cookie3.865s；应用私有日志已直接读回验证。

0.1.12: Node命令再增加 `tools/audio-probe.test.cjs`（当前35项），覆盖冷启动等待、只有metadata或静音混音缓冲不算提示音、错误日志不保存原文；WebSocket与native计数保留固定字段。JVM11项含私有日志轮换/无自由文本、观察器隔离及二进制桥首次收发/总字节核对。强化音频模拟器用例必须实际产生非零混音缓冲；这仍不代替手机听音。

0.1.11本地验证：Node29/JVM9/lint/主包及测试包通过；签名和完整Ruffle资源校验通过。隔离API37/x86_64 AVD四项均OK(1test)：声音手势/PCM加载6.525s、Flash/关联窗口8.756s、seed8.391s、重启Cookie4.924s。不截图，不自动操作官网；新刷新端口/真机声音/服务器列表和阶段诊断仍需用户操作验收。

Current Node command: `node --test tools/diagnostics.test.cjs tools/compatibility.test.cjs tools/player-options.test.cjs tools/engine-signals.test.cjs tools/audio-unlock.test.cjs tools/socket-config.test.cjs tools/game-control.test.cjs tools/game-view.test.cjs tools/audio-probe.test.cjs`.0.1.10 passes25 Node tests, including trusted-vs-synthetic gesture handling, resume retry/late context creation, bounded diagnostics, exact bridge configuration and native-startup retry with JSON-text responses. JVM8 tests include actual local binary forwarding (100000bytes), handshake rejection and destination/address policy. These do not establish real sound, website login or server/map compatibility. User performs actual game verification without repeated authentication requests.

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
