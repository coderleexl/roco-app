# Troubleshooting

0.1.13真机仍失败，不能仅看iframe allow已写入就判定权限通过。0.1.14撤掉委派，改为两个精确能力URL由可访问官方首页创建连接；仍按原生socket-open/connect/首收发定位。新增首页声音浮窗反馈已记录，官网音乐仍未验收，先处理用户指定的选服问题。

0.1.12 Debug日志自动保存于应用私有 `files/diagnostics/events.jsonl` 及 `events.previous.jsonl`，各最多128KiB。无需打开诊断弹窗或截图，使用：

```powershell
python tools/read_device_diagnostics.py --adb 'D:\workspace\platform-tools-latest-windows\platform-tools\adb.exe' --serial 461QYGDN225SM
```

输出仅at/kind/number。0.1.14先确认app-version15，再看content-permission9/loopback-allowed9、phase-login/phase-dir-requests、dir-ws-attempt/open/error、socket-open/connect-start/连接结果/first-send/first-receive。文件尚未产生或轮换前一份不存在会显示available:false；高频队列可能丢日志，缺一条不能单独证明某阶段从未执行。保留原文件以跨覆盖升级核对版本；不要收集原始HAR、全量logcat、网页trace或Cookie。用户0.1.11已确认浏览器/Flash两种试听可听，选服排障不要求重复试听。

- **0.1.12本地桥监听但浏览器WS失败**：本轮真机游戏帧loopback-network权限denied、顶层prompt，原生无9号权限回调，游戏未到socket-open。0.1.13补官方精确来源iframe委派与原生LOCAL_DEVICE_ACCESS授权。先查新版权限与连接日志；若仍denied，检查iframe的allow及父子来源，不凭构建通过宣告已恢复选服。不授予local-network、不改代理/TUN/系统设置。

- **0.1.10 startup stays at preparing connection**: inspect fixed socket-config-request/socket-init-failed/socket-bridge-ready categories. Native configuration uses JSON text rather than a nested JSONObject response, which failed on the local Gecko158 run. Background request timeouts/retries are bounded. Never dump the capability/proxyUrl or fall back to an unconfigured official game silently.
- **0.1.10 unmute still silent**: after the user's real tap, validate only numeric fields of __timeCasketAudioState (created/running/suspended/closed/attempts/rejected). Do not dump contexts or change system audio routing. WebAudio and native HTML-media autoplay decisions are separate; running state still does not prove audible physical output.
- **0.1.10 directory connection still fails**: game loadedConfig should have2 proxy entries; do not output proxyUrl. Read bounded engine classifications and fixed native socket-connected/socket-connect-failed/socket-read-failed/socket-write-failed categories. Endpoint index0=dir,1=stat. Browser loopback policy, DNS/TCP failure, invalid official login, missing numbered-zone mappings and later game logic are separate possibilities. Only dir/stat443 are implemented; extend a zone only after verifying actual official host/port. Preserve existing user proxy/VPN/TUN settings.

- **Autoplay runs but Unmute click remains silent**: inspect actual overlay display, player volume and AudioContext warnings separately.0.1.9 adds scoped Gecko autoplay permission responses; inspect safe autoplay-allowed/denied metadata after user load. Do not hide the overlay or force volume as proof of sound, and do not change system audio routing automatically.
- **No server list after resources200**: compare networking.md, inspect bounded child-frame engine signals after user load. Socket/TCP differs from HTTP CORS. Counter0 or reference Python code alone does not prove current Socket failure/success; no bridge without actual evidence and stated architecture scope.

- **Ruffle installation fails**: confirm build metadata and pinned digest. Inspect extension manifest/API compatibility through authorized remote debugging. App must show the failure, not label it game success.
- **Website opens but Flash does not**: inspect resource status, Ruffle execution errors and content scripts. Do not substitute a standalone SWF as evidence that official login works.
- **Login click does nothing**: distinguish touch dispatch, ExternalInterface/parent callbacks, new-window callback and blocked external scheme. Native JavaScript confirmation dialogs require a user decision.
- **404 on `/cgi-bin/login`**: record the calling page and redirect evidence. Do not guess a replacement endpoint or authentication parameters.
- **Login window opens but cannot return**: inspect opener relationship, focus/close callbacks and shared runtime/profile. Do not extract skey/uin cookies to manufacture a login.
- **Server selection hangs**: look for actual Socket/XMLSocket calls, HTTP errors or unimplemented Ruffle functionality before proposing a restricted local TCP bridge.
- **CI fails**: read build annotations, job logs and reports. Reproduce exact pinned versions. Tool-policy rejection is a blocker to report, not a reason to change command spelling to evade it.
- **APK update signature conflict**: different ephemeral CI keys can conflict. Stop and ask before uninstalling or clearing data.
- **Session expires**: official browser cookies can expire; authenticate again normally. Browser persistence does not guarantee unlimited game login.

Do not change VPS, proxy, TUN, IPv6, certificates or global browser safety settings to work around unexplained game failures.

## Emulator Wasm unreachable / shader validation

On the API35 SwiftShader emulator, default Ruffle0.7.1 wgpu initialization panicked in create_shape_pipeline with `GL_MAX_VERTEX_UNIFORM_VECTORS (256)` exceeded. The original SWF executed in isolated Windows Chrome; Android self-test passed after requesting upstream legacy `webgl`. The override is limited to the fixed local fixture, with reduced feature coverage. It does not fix or prove official game rendering on a phone. See compatibility.md for exact failed and passing runs. Do not treat this message as a login/network failure or change system proxies.
