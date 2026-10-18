# Architecture

## 0.1.13官方帧回环授权

loopback-delegation.js仅在精确HTTPS17roco来源运行，document_start观察iframe插入；不读取或修改认证src，只在没有显式loopback-network指令时追加两个官方来源的有限allowlist，清理pagehide观察器。跨域OAuth帧只有导航到被列出的官方来源后才获得该委派；不向graph等第三方来源或任意局域网授权。PlaybackPolicy新增独立allowsLoopback入口，只接收LOCAL_DEVICE_ACCESS并复用原有严格官方文档边界；NativeDelegate记录loopback-allowed/denied数字分类。已有浏览器自动播放规则不变，LOCAL_NETWORK_ACCESS仍不处理，桥的固定主机/端口/能力/DNS边界不变。

## 0.1.12私有日志与连接观测

Debug下DiagnosticLog的独立观察器只收到校验后的类别和数字，不接收URL。DiagnosticFileStore异步单线程写入私有files/diagnostics/events.jsonl，单文件128KiB，轮换events.previous.jsonl，队列512、繁忙时可丢弃；写入失败不阻断游戏。每条只有at/kind/number，覆盖安装保留文件。原内存诊断仍保留既有脱敏URL，但这些URL不会进入新文件或固定TimeCasket logcat标签。读取工具再次验证字段类型，不输出未通过校验的行。

MAIN只观察精确ws://127.0.0.1能力路径的dir/stat WebSocket生命周期并保留计数，不改变请求或任何其他WebSocket；native port按既有来源/session校验接收固定整数。原生桥只增加连接/错误/首次字节/结束总量，不采集载荷。声音测试脚本迁到固定本地audio.js；冷启动有界等待、仅真实点击恢复挂起上下文，原创PCM样例产生非零混音缓冲后才报告started。样例波形只在本地短暂检查，不导出数据；只记录首个非零标志，避免持续混音日志刷屏。官网音频/网络策略与上游Ruffle字节保持原样。

## 0.1.11游戏刷新与声音诊断

GameFrameController按GeckoSession保存兼容扩展content port；消息来源必须为固定扩展、同一session、content环境与精确HTTPS web2来源，最多8个port。内置扩展新增nativeMessagingFromContent，仅ISOLATED game-control脚本连此通道；MAIN脚本不接收native端口。Firefox Xray waiver只用于调用页面自己的无参Ruffle API；核实就绪且loadedConfig.url为官方/main.swf后，顶栏刷新仅调用reload()，不复制parameters或URL、不导航父页面。重复加载期间不重复发请求，关闭窗口/Activity断开端口。Ruffle保留现有配置不等于官方登录一定仍有效。

声音测试仅Debug顶栏手动打开独立本地子窗口；不改变原游戏文档。回环LocalProbeServer提供固定audio.html和原创audio.swf：浏览器振荡器/Flash 44.1kHz单声道PCM各半秒，无外部资源请求，页面离开关闭WebAudio。此测试区分声音链路，不能证明官网背景音乐已修复。engine-signals仅对官方main的loadedmetadata附加traceObserver，保存有界数字阶段计数，丢弃原始trace及其中认证参数。

## 0.1.10 WebAudio recovery and directory transport

The fixed Gecko158 source revision `eb9a6e3a736802c8e080a76c44dc81f409d99d54`, `dom/media/autoplay/AutoplayPolicy.cpp`, checks AudioContext through site permission/global policy/top-level activation. It does not use the same GV audible-media request status as HTMLMediaElement. The0.1.9 PermissionDelegate alone therefore does not establish WebAudio permission. `audio-unlock.js` wraps the native AudioContext constructor on exact official homepage/game documents, tracks at most16 contexts privately, preserves prototype/constructor behavior, and retries suspended contexts after trusted pointer/touch/click/key input. Later-created contexts also resume if the document has already been activated. Rejected resumes remain retryable; there is no synthetic click, browser-policy bypass or forced overlay hiding. Public audio diagnostics contain only bounded numeric counters, never contexts/errors/URLs.

`GameSocketBridge` uses Java-WebSocket1.6.0 on127.0.0.1 with an ephemeral port and192-bit process-local capability. Upgrade requires an exact official Origin, exact loopback Host and capability path; destinations are only `dir.17roco.qq.com` and `stat.17roco.qq.com`, port443, as declared in public Global.xml. DNS results must all be public addresses, and connect uses an already-validated address. No arbitrary host/IP/port, private-address fallback, TLS bypass, HTTP proxy, TUN or VPS is involved. This is plain TCP after the local WebSocket hop;443 does not imply TLS. Existing OS network routing still applies.

The bridge forwards opaque binary bytes in memory. The official Flash supplies all game handshake/auth/protocol bytes; the app neither generates nor interprets them. Binary frame and per-direction pending data are bounded at1MiB (outgoing may include one extra16KiB chunk),8 concurrent pipes,16 workers with a16-task queue, fixed connect timeout and64 queued messages per pipe. Text messages are rejected. Page/WebSocket close closes TCP and drops queued data. Native diagnostics record fixed connection/error categories and endpoint index only, never payloads, IPs, capability paths or exception text.

The built-in compatibility background obtains this process's two proxy entries through native messaging as explicit JSON text (direct nested JSONObject responses did not complete in local Gecko158 tests), parses it, registers a MAIN-world/document_start/all_frames script only for exactHTTPS web2, then acknowledges readiness. Native requests have bounded timeouts/retry. Initial navigation waits for registration; failed initialization is visible rather than silently loading an unconfigured game. Registration is process-local. Official Ruffle bytes remain unchanged. `socket-config.js` validates the two entries, preserves other options, and sets `logLevel=warn` so missing mappings are visible to bounded engine classification. The app does not export or persist raw warning text; normal webpage console behavior is retained. Public page counters remain untrusted diagnostics.

Scope: this version repairs the evidenced directory/stat transport gap. It does not speculate about numbered zone targets or accept server-provided arbitrary IPs. Actual directory connection, server list, zone/map flow, loopback browser policy and audible output require runtime/user evidence. A native-engine replacement was not selected because it would replace browser/renderer integration as well; the local bridge preserves existing page/auth/rendering behavior. See networking.md.

## 0.1.9 audio and diagnostic additions

Actual0.1.8 player state confirms autoplay:on/isPlayingtrue/volume1 and hidden Play/Unmute overlays in the current game. Browser PageErrors still report AudioContext blocked pending gesture; hidden overlay does not prove sound resumed. Pinned Ruffle hides its overlay without awaiting resume success. App previously lacked PermissionDelegate; pinnedGecko158 sources expose audible/inaudible autoplay and default VALUE_PROMPT.0.1.9 supplies only these permission types for exactHTTPS official homepage/default and web2 via PlaybackPolicy. Other sites denied for autoplay, other permissions unchanged; no microphone/camera access or global media-policy change. Only decision/type metadata is logged. Actual callback/audio recovery require user test.

Outer homepage preloader separately may read exact preloadlist.xml (XML MIME) and ver.config (octet-stream); existing source/method/status/server-policy guards remain. This repairs observed homepage failures, not Socket support.

New engine-signals.js, only exactHTTPS web2 MAIN-world frames, forwards console log/warn/error unchanged while deriving bounded classifications and up to8 numeric error codes/official Socket hosts. It never stringifies objects or persists raw text/arguments/URLs/cookies/tickets; transient strings are size limited. Frame-local state has no native/network telemetry and is page controlled, so probes must validate its schema and never trust it for permission/login decisions. See networking.md; real collection coverage is not proven by Node tests.

## Current shared resource policy (0.1.7)

This section supersedes the older per-file exception descriptions below. `adaptPublicAssetHeaders` in compatibility/public-swf.js is the common response wrapper, with `allowedAssetTypes` as the single resource/source/MIME policy. It operates at the extension response hook, not by replacing webpage fetch/XHR, and covers eligible Ruffle/Wasm fetches through the same browser request pipeline.

Resource origin is exactHTTPS res.17roco.qq.com. Official public Global.xml identifies swf, libs, conf and res resource roots; the XML file inside public ver.config additionally lists plugins, activity, apps and video resources. These eight directories have typed rules rather than an ever-growing file list. A single directoryTypes table supplies extension restrictions and generates listener patterns; manifest coverage is tested. Game source must be exactHTTPS web2.17roco.qq.com. Root main.swf, ver.config and Global.xml remain explicit. Homepage source remains 17roco.qq.com / or /default.html, with only preloader, ROCO-Z8 and its numbered Ceil animation family. Executable policy makes the final decision.

| Resource family | Accepted response MIME |
|---|---|
| swf/libs `.swf`, res `.swf` | application/x-shockwave-flash |
| conf/res `.config`, `.bin`, `.dat`; ver.config | application/octet-stream |
| conf/res `.xml`; Global.xml | text/xml or application/xml |
| res `.png`, `.jpg`/`.jpeg`, `.gif`, `.webp`, `.mp3` | Corresponding image/audio MIME only |
| plugins `.swf`, `.xml`, `.txt`, `.fint`, `.config`, `.png` | Flash, XML, text/plain, octet-stream for fint/config, or image/png respectively |
| activity `.swf`, `.png`, `.xml`; apps additionally `.jpg` | Corresponding Flash/image/XML MIME only |
| video `.swf`, `.mp4` | Flash or video/mp4 respectively |

Only GET/XHR, HTTP200, valid trusted origins, clean static paths and matching MIME receive the missing ACAO header, set to the initiating trusted origin. Existing ACAO or ACAC policy is never replaced. Percent-encoded/hidden paths, CGI/FastCGI segments, crossdomain.xml, unknown extensions, HTML/errors, different domains/ports, credentials and unrelated homepage paths fail closed. Request bodies/headers, cookies, tickets and response bodies are neither collected nor changed. Login responses and third-party ads are outside scope. Do not treat these rules as globally disabling CORS or as proof every game resource is supported.

Reason for widening: actual0.1.5 PageError shows Global.xml blocked after ver.config succeeds. Independently fetched public Global.xml explicitly names bb.swf, AngelClientLibs_s.swf, AngelProtocal.swf and Angel.config, as well as resource directories. Public HEAD checks confirm all four bootstrap dependencies return200 with expected MIME and noACAO. This supplies an evidence-based directory boundary; the full future resource set has not been exercised. Other hosts (including the configured avatar CDN), unsupported types, Flash Socket and engine gaps still need separate evidence.

0.1.6 real-browser follow-up verifies Global.xml, Angel.config and both base libraries now return200; EffectPluginLib.swf is the next missing-ACAO dependency. This plugin directory was omitted from the original public-directory policy. Public ver.config is a ZIP containing XML with13216 file entries, explicitly including that exact plugin. Its declared plugin/activity/apps/video paths and suffixes support extending the shared table in0.1.7, not inventing game/auth parameters. The current file list is evidence, not a permanent exhaustive API. h5 scripts/pages, unknown types, backups and undeclared origins remain outside scope; no promise that every future resource is covered.

Session constraint: user asks to minimize repeated QR authentication. Keep the same profile, package, key and normal persistent browser state; no password/Cookie extraction or authenticated-URL replay. Updates end the live page process; whether the website restores that login is not guaranteed. User performs any required authentication or game verification; no automated retry loop.

## Player startup preference (0.1.8)

The user confirmed the extra Play step is Ruffle's own startup overlay. A small compatibility/player-options.js content script runs at document_start in MAIN world and all matching frames. It only changes `window.RufflePlayer.config.autoplay` to `on`, before movie loading; existing renderer, parameters, script access and unmute overlay are preserved. Allowed pages are exact HTTPS17roco homepage/default and web2 origin. It has no extension APIs/native bridge, does not inspect Cookie/auth/form data and does not simulate clicks or skip a game's own controls. Immutable page configuration fails quietly.

[Ruffle autoplay docs](https://ruffle.rs/js-docs/master/enums/Config.AutoPlay.html) specify immediate start with muted playback when automatic audio is blocked; real device may still require touch to enable sound. [Mozilla MAIN-world support](https://blog.mozilla.org/addons/2024/07/10/manifest-v3-updates-landed-in-firefox-128/) is available sinceFirefox128, below our pinned158 engine. The separate compatibility manifest1.2.0 declares the scoped script; the official Ruffle XPI remains byte-for-byte unmodified. VM tests establish config preservation/scope/declaration, not real Gecko injection timing or visual outcome. Those await user verification.

Refresh investigation: existing Android toolbar calls GeckoSession.reload on the entire current session. Public official root-page code initializes the iframe entry again and conditionally invokes LogoutPage; its public LayerLogin.js implementation invokes logout handling. This is an evidenced reason a full reload may return to authentication, not proof Cookie persistence failed. Current version does not alter this website logic, persist authenticated URLs or promise refresh without login. A narrowly scoped game reload/navigation design remains separate pending work.

- Kotlin Android View app, one process-level GeckoRuntime with normal persistent profile. A main GeckoSession and at most four associated sessions share that runtime. No cross-app Firefox cookie access.
- `onNewSession` returns a **new unopened** session. Gecko opens it and establishes its opener; app retains it and attaches the view only after open. Do not manually navigate that child using the informational URI.
- JavaScript alert/confirm/prompt have native presentation and user responses. Authentication stays on official pages; unsupported external-app schemes are blocked with an explanation, not silently launched.
- Official Firefox Ruffle extension is downloaded at build time with fixed version and SHA256, unpacked into generated assets, and registered via GeckoView `ensureBuiltIn`. Runtime renderer is browser/Wasm, not native Ruffle.
- A separate bundled metadata-only diagnostics extension uses `webRequest` plus GeckoView native messaging. Scope is 17roco.qq.com and its subdomains. Other CDNs/auth hosts are not recorded in v1. No raw JS/Ruffle error text is persisted; debug inspection remains manual.
- Main website is never replaced with a standalone game SWF. App does not invent FlashVars or rewrite login endpoints. Browser CORS and certificate validation stay enabled. A separate compatibility extension applies one explicit public-asset response exception described below.
- Debug self-test server binds **127.0.0.1 only**, ephemeral port, fixed fixture routes, no proxy or arbitrary-file access. Original tiny ActionScript SWF emits FSCommand to prove actual execution. It never simulates successful game authentication.
- A local TCP bridge/native Ruffle route is not implemented. It requires observed game calls and an explicit architecture decision.

References: [GeckoView extensions](https://firefox-source-docs.mozilla.org/mobile/android/geckoview/consumer/web-extensions.html), [Ruffle upstream](https://github.com/ruffle-rs/ruffle), [Ruffle JS API](https://ruffle.rs/js-docs/master/interfaces/Player.PlayerV1.html).

## Public SWF response compatibility (0.1.1)

Real Meizu0.1.0 evidence identifies the root movie fetch as CORS-blocked, not a login error: official SWF HTTP200 lacks Access-Control-Allow-Origin. `compatibility/public-swf.js` uses Firefox webRequest.onHeadersReceived with blocking/responseHeaders; its separate built-in MV2 manifest declares only the official document host and resource host. App waits for both compatibility extension installation and Ruffle installation before initial navigation; compatibility installation failure prevents automatic game entry and is visible in diagnostics.

The exception requires all of: HTTPS exact resource origin `https://res.17roco.qq.com`, path `/swf/ROCO-Z8.swf`, GET/XHR, HTTP200 and Flash MIME; trusted initiating `https://17roco.qq.com/` or `/default.html`; no existing ACAO or credentialed-CORS policy header. It adds only `Access-Control-Allow-Origin: https://17roco.qq.com`, preserving all other headers and the body. It never enables credentialed cross-origin reads, changes request cookies, touches authentication endpoints, logs response headers/bodies, grants arbitrary-origin access or disables browser security globally. Missing initiator or unexpected MIME/status fails closed. Source query strings are used only by the browser request, not persisted by the adapter. Normal login, parent window and iframe environment remain intact.

This is a deliberate, narrowly scoped app response-policy exception for an already publicly downloadable resource. It is not proof of login, other resources, rendering, or full game compatibility. Changes to other assets require new observed evidence and boundary tests.

### Observed additional movies (0.1.2)

After user-operated QR authentication on0.1.1, read-only frame/player inspection identifies homepage `/preloader.swf` and post-scan `/main.swf` from res.17roco.qq.com. Both are CORS-blocked atHTTP200 with Flash MIME; independent unauthenticated HEAD confirms noACAO. Version0.1.2 adds exactly those two public paths, retaining every method/status/MIME/existing-policy restriction above. Preloader is allowed only from the same homepage paths as ROCO-Z8; main is allowed only from exact HTTPS web2.17roco.qq.com origin. Its document path is deliberately not guessed or persisted because authenticated navigation can vary. ACAO equals the corresponding trusted initiating origin, never wildcard. Separate manifest permissions cover web2 and the two exact resource path patterns; code rejects suffix lookalikes. Authentication endpoints, third-party advertising SWFs and all other assets remain untouched. Compatibility extension version1.0.1 ensures the bundled update is distinguishable. Real-device effect awaits approved installation and user retest.

### Public version configuration (0.1.3)

On0.1.2 both preloader and main reach readyState2 with metadata and no error overlay. The next observed failure is exact public `/ver.config` on the same res host, requested by the web2 game frame: two missingACAO PageErrors atHTTP200. Independent unauthenticated HEAD confirms application/octet-stream and217494 bytes. Compatibility1.0.2 adds only this path, only exactHTTPS web2 initiating origin and octet-stream MIME; Flash resources still require Flash MIME. Existing GET/XHR/200 and fail-closed server-policy rules remain. No arbitrary config paths, authentication headers or credentialed-CORS access are enabled.

### Login persistence boundary

The shared normal GeckoRuntime profile already persists browser state; a separate-process fixture proved ordinary persistent Cookie retention, not official login retention. No password vault, extracted auth tickets, callback URL replay or custom authentication is implemented. User should verify a normal close/reopen after game loading is repaired. Successful restoration depends on the official session remaining valid; if it expires, the user completes official authentication again. Do not store authenticated page URLs as a shortcut.

### Homepage animation dependency (0.1.4)

Real0.1.3 PageError confirms exact `/swf/ceils/ROCO-Z8_Ceil_3.swf` missingACAO atHTTP200 while root player remains executable. Compatibility1.0.3 adds this public Flash dependency only for the same official homepage sources as ROCO-Z8. Manifest/listener include its precise pattern and code rejects suffix lookalikes and other numbered siblings. PublicHEAD confirms Flash MIME/164312 bytes; no renderer change is justified by current evidence. Visual recovery and any further dynamic dependencies require user retest. Each preceding adaptation has revealed a separately fetched dependency; this does not prove all resources or the game protocol are compatible.
