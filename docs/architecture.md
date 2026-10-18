# Architecture

## 0.1.27：取消图片加载后的旧回调

用户纠正PP现象：战斗里实际有药，**图标变成生命药水**。公共HP/PP PNG均200、60×60且SHA256不同；不是已证实服务器返回同图。公开CombatImage/AImage复用任务，ResVIPChannel复用NormalLoader；其NewLoader使用URLStream及同一ByteArray调用Loader.loadBytes，取消时unload，再把COMPLETE交给当前任务。晚到旧图片可能被当成新任务结果。这是公开实现与本地复现的联系，尚无用户游戏内对应回调证据。

原创红蓝fixture复用Loader/ByteArray，正常红→蓝正确，随后`load(red); unload(); load(blue)`，原版0.7.1交回红图。[上游图片完成回调](https://github.com/ruffle-rs/ruffle/blob/v0.7.1/core/src/loader.rs)延迟两帧，卸载/换图后仍调用movie_loader_complete。补丁在此核对LoaderInfo当前DisplayObject与捕获图片是否同一对象；失效时仅移除旧load handle并退出，阻止串图和旧COMPLETE。顺序加载、SWF载入、游戏代码、网络、库存和PP均不修改。

0.1.27首次源码重建Ruffle核心。继续校验完整原版包，新增源码/补丁锁；仅页面runtime/chunks/两种Wasm替换，其余文件逐字节保留。manifest只增加版本至0.7.2.1，ID/权限不变。来源清单进入包内，Gradle输入包含修复包，APK校验完整文件集合和字节。CI先验证原版准确失败序列、补丁正确序列，再构建APK、跑原有8项Gecko样例。云端与真机结果见handoff；本地复现不证明实际PP图标或恢复已修好。官网自动渲染器保留。

## 0.1.24：撤回传统WebGL默认选择

用户0.1.23实际验收失败：选择服务器后一直加载。真机main ready2、实际renderer=webgl，目录endpoint0与区服endpoint7均connected/first-send/first-receive，目录最终139/216B；不是没有连上区服。cache一条AVM2脚本错误，通过固定字面匹配确认RustError中的`Render backend does not support BitmapData.draw`，与[Ruffle0.7.1 BitmapData.draw错误分支](https://github.com/ruffle-rs/ruffle/blob/v0.7.1/core/src/avm2/globals/flash/display/bitmap_data.rs)一致；不保存原文/堆栈/查询。不能用本地文字样例成功来覆盖真实游戏依赖的位图绘制能力。

0.1.24删除0.1.23的默认/null→webgl设置，恢复Ruffle自动选择，并完整保留页面显式后端。字体canvas、11个游戏GET适配和退出原因日志保留；新增bitmapDrawErrors固定数字，经主游戏受限端口写phase-bitmap-draw-errors。它是观测计数，不是任意控制或原始消息导出。SwiftShader本地中文样例恢复显式webgl，仅为自身已知模拟器限制，不能当游戏渲染后端验收。

本次卡住时GPU PSS482.5MiB、内容进程745.0MiB，总1717.9MiB，阶段与上次不同，且功能失败，不能据更低GPU数值认定优化有效。高内存/卡顿/潜在泄漏仍待用有完整游戏能力的后端定位。

## 0.1.23：显卡内存与渲染后端试验

用户报告卡顿和闪退后，只读系统快照显示本包各进程PSS合计2260.4MiB，其中GPU进程1404811KiB（约1371.9MiB），主进程272123KiB；不能用主进程约266MiB代表整个应用，也不能简单累加RSS。最近15:48:42为PACKAGE UPDATED；15:44:02一后台子进程importance400因LOW_MEMORY退出；crash buffer另有15:25:50旧子进程SIGSEGV，栈为libGLESv2_adreno.so，早于canvas字体版本。这些不是“本次闪退一定OOM”的证明。

只读官网首页播放器日志实际Used renderer=wgpu-webgl。0.1.23只在原有官方首页/游戏范围，preferredRenderer缺失或null（自动）时试用webgl，显式指定后端保留；字体canvas、quality、协议、资源规则均不变。依据原版[Ruffle0.7.1后端说明](https://github.com/ruffle-rs/ruffle/blob/v0.7.1/web/packages/core/src/public/config/load-options.ts#L125)：传统webgl初始化较快、功能较少。它仍使用GPU，不能承诺绕开同一驱动或降低真机内存；位图/混合等视觉兼容性和真实卡顿仍待验收。首页同样覆盖，因为仅首页阶段GPU已高占用；没有全局改浏览器/系统图形设置。

主进程startBrowser在启动Gecko前读取本包最近8条ApplicationExitInfo元数据，Debug/API30+；只记退出相对秒数、固定进程角色0主/1GPU/2内容/3其他、reason、importance、RSS MiB，不读trace/description/processStateSummary，不保存进程名字。用于区分覆盖升级、后台回收和崩溃；历史RSS是采样值，不是完整峰值。使用[Android退出原因API](https://developer.android.com/reference/android/app/ApplicationExitInfo)，失败仅固定枚举、不阻止启动。

## 0.1.22：活动端点补充与网页alert数字诊断

基于当前真机CORS路径和无认证公开HEAD，原game-http端点表追加discovery/mend_shape/dawn_hymn，总11项；方法、来源、同源owner、Response realm、重定向拒绝及失败不重发行为不变，warehouse_security_code继续拒绝转发。

原主电影trace/console没有观察到用户报告的2032，不能把计数0当成没有弹窗。原生onAlertPrompt新增page-alert（仅1009/1010/2032或0）和page-alert-io（固定1），不记录title/message；扫描前4096字符，不把验证码/未知编号存入文件。弹窗仍原样由用户确认。该路径仅覆盖网页JS alert，不宣称覆盖Flash自己绘制的消息框；后者仍依靠引擎trace与对应网络元数据。

## 0.1.21设备字体与细分错误诊断

公开CombatPluginLib的AttackSkillCell将skillDes.name赋给skillNameText；SWF放置字符700，useOutlines=false，引用字体299且该字体glyph数为0，属于设备字体文本。当前[Ruffle0.7.1设备字体配置](https://github.com/ruffle-rs/ruffle/blob/v0.7.1/web/packages/core/src/public/config/load-options.ts#L289)默认embedded，不能读取设备字体；canvas可通过OffscreenCanvas使用系统字体，但上游标为实验性。0.1.21只对精确官方web2游戏来源、未显式选择deviceFontRenderer且真实2D上下文可用时设置canvas；首页/其他来源/显式选项保留，GPU preferredRenderer不变。没有注入外部字体、替换游戏文字或改Ruffle二进制。真机技能文字仍须验收，不能仅据字体结构断定全部空白都同因。

本地原创text.swf用零字形SimSun设备字体及六个固定中文字，独立样例在真实Gecko/Ruffle运行。观察样例自身OffscreenCanvas的字形调用和非空、不同的字形缓冲摘要，确认实际走系统字体路径；不截图、不导出图像、无官方内容。production配置函数由本地scope替身复用，不放宽官方来源。

主电影trace与console进一步分类Error#1009/#1010/#2032、缺字体，console脚本错误/未支持计数也进入既有只接收0..1000数字的原生文件端口。保留原游戏弹窗/请求失败；这些是观测次数，trace和console可能重复，不能当独立弹窗数量。未知Error仍进入总分类，不保存原文/堆栈/查询。不能声称已hook游戏内部所有Flash弹窗。

## 0.1.20活动HTTP同源传输

活动CGI虽然HTTP200，却固定允许https://res.17roco.qq.com，而实际JS/Wasm运行页面是web2，导致跨域失败。静态适配器原先只处理res资源，不能解决该层；不覆盖官网已有ACAO/ACAC。MAIN game-http对固定8个活动GET使用已经可访问的官网首页fetch。源必须HTTPSweb2；目标必须HTTPS17roco默认443、无userinfo、精确/cgi-bin/端点；父页面必须HTTPS17roco首页/default。未知目标或无法访问父页面保留原fetch。登录/防沉迷/隐私接口不在表内，POST不转发。

用首页Request(URL字符串, init)构造请求，获得首页环境的同源来源，保留原headers/credentials/cache/signal与未经解析的游戏查询；mode=same-origin、redirect=error限定本次传输，防止活动转到认证后自动跟随。原生Request getter做跨realm品牌检查，忽略可伪造的自有url；构造后再次验证端点和GET。绝不在失败后再用另一通道发同一请求。此实现没有生成新票据或记录URL参数。实际官网请求结果仍需用户验收。

原版[Ruffle0.7.1 navigator](https://github.com/ruffle-rs/ruffle/blob/v0.7.1/web/src/navigator.rs#L293)构造Request后fetch，并对返回值做游戏realm的Response检查。桥用游戏的Response构造器包装外realm ReadableStream，保留状态、头及url/redirected/type，避免foreign Response类型失败；不读body、不解析XML、不把403变200。仅四项限额数字落原生文件，Complete指传输包装完成，不表示服务器业务成功。固定本地HTTP样例在两个真实Gecko realm验证这些语义，测试scope不会放宽生产来源检查。

## 0.1.19移动端可见区域适配

真机0.1.18黑屏不是main未执行：窗口inline top884.958对应早期1435×2607计算，实际可见区域随后变为1435×662；同target幂等分支直接return，漏掉旋转/原生隐藏工具栏后的异步尺寸变化。现在幂等分支也fit，优先顶层visualViewport的width/height和offsetLeft/offsetTop，无该API时才用innerWidth/innerHeight；监听Window resize与visualViewport resize/scroll并在exit全部移除。窗口轮询提供遗漏事件的恢复路径，不重建DOM或重载游戏。依据[MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)的可见区域/固定定位偏移与事件定义。

固定本地view.html用真实Gecko CSS测量舞台bbox，scope仅为模拟官方来源和早期错误尺寸的测试替身，生产校验不变。主电影trace/console新增IOError和loader HTTP错误数字分类，经原有主游戏端口写文件；只保存计数，不保存trace文本、地址或凭据。活动404没有被适配成200，也没有未经入口验证以ui电影替换s电影。

## 0.1.18入口即显示游戏窗口

0.1.17将展示绑定到web2 main.swf ready，导致首页登录阶段只有横屏，没有裁切。只读真机几何确认可见区域是顶层mainiframe（960×560），首页ready preloader仅1×1。现在ISOLATED game-control也在官方首页顶层运行，只有顶层拥有展示适配器；子web2继续负责主电影刷新和计数，不操作父层样式。原生在端口连接时发送已有模式请求，不再只等main ready发送，展示ack与movie ready解耦。

game-view.enterGame先取顶层mainiframe，可立即按默认舞台尺寸铺满。只在该窗口内递归检查可访问的精确官方文档（最多5层、每层8个iframe），main就绪后用原播放器/frameElement链；不可访问登录帧保持原样，不读取src/登录DOM。主播放器父链验证失败会回滚并显示外层游戏窗口。退出/重载/换目标都恢复旧样式；祖先的overflow/contain/filter/clip等约束临时清除，以免fixed游戏区域被网页布局裁掉。首页和子帧不会各持有一套父层CSS。

原生homepage展示许可仅HTTPS17roco、默认443、无userinfo、路径/或/default.html；web2刷新许可不变。首页ready消息不能令其成为reload目标，signals不从首页接收；没有扩展到认证域或改变网络策略。“游戏全屏”复用原shortcut ID/session，返回恢复浏览。真机效果需用户验收。

## 0.1.17横屏游戏入口与页面呈现

顶栏“横屏游戏”与动态launcher shortcut landscape_game发送同一game_mode请求；ShortcutInfo使用NEW_TASK/CLEAR_TOP/SINGLE_TOP且Activity为singleTop，onNewIntent只改变模式，不导航。动态入口避免静态shortcut默认CLEAR_TASK破坏当前页面（见[Android快捷方式Intent规则](https://developer.android.com/develop/ui/compose/system/shortcuts/managing-shortcuts)）。Activity仅为自身请求SENSOR_LANDSCAPE；游戏尚未就绪/需要官方验证时保留浏览UI，真正收到受限content port的game-view-state才隐藏Chrome和系统栏。返回键先退出模式并恢复UNSPECIFIED，不进行网页后退。切换关联窗口按当前session的状态显示UI；销毁时沿原端口清理。

ISOLATED的game-view.js只在原有官方web2入口被game-control调用，先找就绪官方main.swf，再预先验证最多6层参与文档均为精确HTTPS17roco/web2且无userinfo。使用当前播放器及其frameElement链，保留DOM/会话，只在参与文档加入临时样式及自有属性；隐藏其他节点，主舞台按metadata尺寸（合法100～4096，默认960×560）居中等比缩放，顶层resize重算。保存并恢复旧属性/顶层inline style，退出/播放器替换/pagehide/端口断开回滚；访问父文档失败时不隐藏原浏览UI。不读取iframe src、不导出电影参数、不调用reload或认证接口。

README现面向使用者，历史过程归档readme-history.md，构建/安装/调试迁到development.md；后续版本验证记录只写docs。


## 0.1.16活动二进制脚本

activity目录在原公共资源表中增加exbn，MIME仅application/octet-stream；仍只处理精确HTTPS资源源、官方web2发起、GET/XHR/HTTP200、无既有ACAO/ACAC的响应。来源/路径/方法/状态/MIME与其他目录限制不变；不扩大到apps/libs/res的exbn，不处理404/HTML，不覆盖网站已有跨域策略。依据为真机缺ACAO错误及三个公开HEAD200响应，不声称ver.config清单列出这类脚本（本地清单检索为0）。


## 0.1.15统一编号区服

公开LoginPlugin的connectSvr按roomZoneID拼接zone{0}.17roco.qq.com，真机缺桥日志已确认zone5/zone7:443。用户要求统一覆盖，原生allowsHost接受规范zone1～zone65535.17roco.qq.com，拒绝0/前导零/通配符字面量/超范围/尾缀域/任意IP；所有连接仍固定443，DNS全部地址须公网，连接已核实IP。不是无限编号授权；65535是兼容层映射容量上限，公开roomZoneID实际为uint32，不把该上限称为官方协议限制。

原版Ruffle0.7.1将socketProxy转换为Rust Vec并严格匹配host+port，不识别zone*。原生握手仅返回两个bootstrap能力URL和maxZone=65535，扩展注册前注入；游戏第一次读取config.socketProxy才生成65537条精确映射并缓存，未使用的跟踪帧无需立即分配。生成表没有DNS/连接；只有Flash选择其中一项才用既有本地桥，沿用0.1.14官方顶层构造器和二进制realm转换。能力前缀不落日志；其他WebSocket原样保留。上游Ruffle不修改。

诊断保持dir0/stat1，zoneN为endpointN+1（最大65536）；总量类别用固定socket-zone-sent/received，避免将数字混入只接受字母的日志类别。多个并发zone的汇总缺少独立连接ID，不能单凭相邻总量日志推断同一连接。浏览器dir/stat WS计数可能因顶层构造器路由绕过旧观察器而为0，本轮连接以原生socket-open/connected/first-send/receive为准。


## 0.1.14由官方首页创建固定连接

socket-config.js在验证原有两项配置后，以Proxy保留原WebSocket构造器；只对逐字匹配这两条配置URL的调用，且可读取顶层为精确HTTPS17roco首页/default、无userinfo时，用顶层原生构造器和原newTarget创建原生Socket。其余URL/来源/访问失败均走原构造器。并不重放或生成任何认证/游戏请求；由官方Flash照常发送数据，原生桥的Origin/能力路径/固定目标/DNS及队列限制不变。

不同realm的原生MessageEvent.data是顶层ArrayBuffer；Ruffle所用gloo-net会在游戏realm做instanceof检查。因此先注册capture消息监听器，仅对ArrayBuffer执行逐字节复制，并覆盖该事件自身data供既有监听器读取，不解析或记录数据；字符串等类型不动。保留原生事件、readyState、发送/关闭和监听器行为。真机独立本地固定字节探针证明foreignBefore=true/localAfter=true/bytesMatch=true；尚不代表真实目录协议成功。0.1.13委派脚本已移除，保留原生受限LOCAL_DEVICE_ACCESS处理。


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
