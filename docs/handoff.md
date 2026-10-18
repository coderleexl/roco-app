# 开发交接（2026-10-18）

## 最新持续授权

用户明确“安装可以允许你，不要问我了，结果我帮你验证”：后续本项目APK覆盖升级可直接执行，保留数据，不再逐次询问。系统设置、root、卸载/清数据不在此授权内。仍不截图、不自动代办网站验证；本地调试不等待云端检查。下文历史待授权描述以本条为准。

## 最新0.1.12：私有文件日志与选服连接分层诊断（2026-10-18）

- 用户0.1.11先报告浏览器试听有声/Flash未加载，随后再次点击确认Flash也有声音。只读本地样例readyState2/metadata/playing、无panic。因此基础浏览器/Flash声音已有人耳证据；**官网音乐、服务器列表/地图仍未通过**，不再一概按全局静音处理。用户要求继续加日志，并明确希望自动写目录，避免反复读弹窗。
- 主游戏只读阶段：traceAttached1/traceMessages16/configsLoaded1/loginInitialized1/directoryRequests3/traceErrors0；资源与主播放器继续正常。用户手动打开诊断后用UI文字树读取固定原生类别（无截图/无文件保存原始UI），有socket-bridge-ready、compatibility-installed、game-frame-ready1，保留日志未见TCP成功/失败。首次无PTY读取未取得XML，改强制PTY后成功；后续改私有日志，不要求用户再打开弹窗。不能据GUI请求计数认定已发出TCP数据。
- 0.1.12/code13、兼容扩展1.3.2：Debug自动写files/diagnostics/events.jsonl，单份128KiB+前一份128KiB，异步512队列，满时丢弃。字段仅at/kind/number；不含URL/票据/错误正文/数据包，原有浏览器数据不清理。新增tools/read_device_diagnostics.py，通过adb run-as读取并再次验证结构，不导出原始logcat或UI。
- 浏览器仅观察两个既有精确回环能力路径的WebSocket attempt/open/error/close；加载阶段与WS计数经原有受限content port落到原生日志。TCP桥新增open/connect-start、DNS/地址拒绝/超时/拒绝连接分类、首次发送/接收和结束总字节。content-permission仅记编号，未增加权限授权，未修改任何VPS/代理/TUN/系统网络/目标策略。
- 本地声音测试新增audio.js和固定枚举日志端点，等待播放器冷启动且有超时/重试；检测原创PCM的非零混音缓冲后才显示已启动，不把metadata或静音循环缓冲当声音证明。仅本地样例检查短暂样本，不导出波形，只记录首个非零标志；官网音频不改。User已确认0.1.11两种可听，无需为本轮选服重复试听。
- 已验证：Node35/JVM11/lint/主包及测试包，最后构建39s；签名及完整官方Ruffle资源校验通过。APK SHA256 `ec81e37aebcad37320e2b1747474d692bc58449405c06810fd086042f4f67a3c`。隔离模拟器四项均OK(1test)：强化声音6.71s、Flash/关联窗口6.815s、seed7.016s、重启Cookie3.865s。原生私有文件读回含audio-buffer-nonzero1和audio-flash-started，无URL/自由文本。已adb install -r覆盖安装Success，包查询确认0.1.12/code13，保留数据；选服新日志待用户进入后读取。
- 下一步：覆盖升级后由用户进入原来不能选服的位置，直接读取私有日志，按dir-ws-attempt→socket-open→connect结果→首次收发分层定位，不再要求打开诊断或截图。真实列表/区服/地图与官方音乐仍待验收，禁止仅凭构建或连接成立宣告兼容完成。

## 历史0.1.11：游戏层刷新、声音分层试听与加载阶段诊断（2026-10-18）

- 用户最新反馈：0.1.10进入后连接弹窗消失，但不能选服务器；声音仍不确定是否是首页本身没有背景音乐；要求刷新停留游戏/选服层。**服务器列表、真实声音、地图均未验收通过**。
- 刷新后的只读证据：main就绪、音量1、socketProxy数量2、无panic/AVM2错误分类；AutoExec和Login插件也HTTP200。首页3个和主游戏1个AudioContext均running、无可见unmute遮罩；系统媒体流未静音且走speaker。这只能排除本次快照的挂起/零音量，不能证明音频样本实际播放或可听。旧audio-policy警告是缓存累计，不当成当前仍被阻止的证明。
- 缺桥告警唯一目标为非公网IPv4:9000（不输出IP）。静态阅读公开main.swf确认SocketLogger含对应目标与stat:9000握手，故更可能是日志连接，**不能认定这是目录服失败，也不放开内网9000**。公开Login插件的初始化在创建UI后才调用目录连接；当前不知是否走到这一步，不把全部问题归于CORS或用户代理。临时公开文件/反编译仅留.cache，不入库或分发。
- 0.1.11/code12、兼容扩展1.3.1：新增GameFrameController及ISOLATED game-control.js，扩展content native port按固定扩展/同一session/精确HTTPS web2/环境校验，最多8端口。顶栏“刷新游戏”只对就绪官方/main.swf调用无参Ruffle reload()，保留外层文档、使用Ruffle内存中的原配置；不复制参数/认证地址、不做整页reload回退。无游戏时提示；窗口/Activity关闭清理。**仍需用户验证是否留在游戏层及官方会话是否有效，不能承诺一定直接到选服**。
- Debug顶栏新增“声音测试”，独立本地子窗口提供浏览器振荡器与原创Flash PCM两种半秒提示音；关闭子窗口返回原游戏。无外部资源/游戏包，无自动试听或设置改动。用户分别报告两种是否可听，以区分Gecko输出/Ruffle声音与官网当前无音乐；请求播放和样例ready不能证明实际可听。
- engine-signals对官方main的loadedmetadata附加公共traceObserver，仅保存有界数字：traceAttached/traceMessages/configsLoaded/loginInitialized/directoryRequests/traceErrors。继续warn级别，不保留trace原文/参数/错误文本，不调用认证或游戏接口；刷新后的阶段增量用于下轮定位。
- 本地验证：Node29项、JVM9项、lint、主包和测试包完整构建通过（最后46s）；签名与完整官方Ruffle资源校验通过。APK SHA256 `8080c3baba6cbc70ae4e50934d5aa157ebb048f526f789813b544aedd1efbfbe`。独立API37/x86_64模拟器4项均OK(1test)：新声音手势/PCM加载6.525s、原Flash/关联窗口8.756s、seed8.391s、进程重启Cookie4.924s。模拟器禁用输出，不证明可听；游戏刷新端口/Xray及trace阶段仍需真机用户操作后检查。
- 最终APK已adb install -r覆盖安装Success，包查询确认0.1.11/code12，保留数据；未自动打开/刷新/登录或点击真机页面。下一步：用户先试听两种声音，再关闭测试窗口进入游戏、点“刷新游戏”；只读检查新阶段计数和native game-frame-ready/game-reload分类，确认是否到达Login.initialize/目录连接后再修服务器。保留本地/IDE生成配置，不改代理/TUN/VPS/系统设置，不截图。

## 历史0.1.10：WebAudio恢复与应用内目录服桥（2026-10-18）

- 用户明确要求修复声音和连接。固定Gecko158源码revision `eb9a6e3a736802c8e080a76c44dc81f409d99d54` 的AutoplayPolicy.cpp确认：WebAudio与HTML媒体的GV权限回调路径不同。新增audio-unlock.js，仅官网首页/default和web2，在真实触摸/点击/按键后恢复挂起的AudioContext；也处理先点击、后创建音频上下文的时序。最多追踪16个上下文，失败可重试，不模拟点击、不隐藏遮罩、不改音量/系统策略；仅公开固定数字诊断。
- 新增GameSocketBridge/Policy，Java-WebSocket1.6.0，只监听127.0.0.1随机端口，192位进程内能力路径、精确官方Origin/Host校验。目标仅公开Global.xml的dir/stat两个域名及443端口；DNS私网/回环等地址拒绝，连接使用已校验IP。双向透传官方Flash原始二进制，不解析/生成认证或游戏包、不落盘；8连接、16工作线程/16排队任务、1MiB待发/帧上限、64消息队列，关闭时释放连接。上游Ruffle逐字节未改。现有代理/TUN/VPS/系统网络设置未改，TCP仍走系统既有路由。
- 兼容扩展1.3.0的背景脚本通过native messaging取得配置，在首次官网导航前注册web2限定的MAIN/document_start脚本，再回传ready。**范围只解决目录/统计服能力缺口，未知zone区服未接入，不宣布能进地图**。游戏帧logLevel改warn以补上0.1.9漏报缺桥的盲区；不保存原始警告/认证URL，探针仍只输出经过验证的固定数字/官方域名。
- 验证通过：Node25项、JVM8项（含来源/令牌拒绝及100000字节本地二进制完整往返）、lint、主APK与androidTest包。最后完整构建38s。APK签名和完整官方Ruffle逐文件校验通过；SHA256 `41c384d729dd0d6868f0cfb766fdddd8349d08136cef4fce4ab3cd64756cef06`，路径app/build/outputs/apk/debug/app-debug.apk。
- 本地API37.0/x86_64模拟器最终三项分别返回OK(1test)：Flash FSCommand＋关联窗口/测试Cookie共享（7.058s）、seed（6.751s）、跨进程Cookie保留（3.728s）。覆盖了扩展初始化握手，仍不代表官网有声/目录登录通过。只使用固定本地样例，未打开官网或截图。用户已有AVD因C盘不足无法启动；改在工作区.cache/avds创建独立临时AVD，不改原AVD配置。
- 已解决的失败证据：首轮编译引用库不存在的bufferedAmount，改为库公开输出队列统计后通过；模拟器首两轮初始化卡住，日志确认config请求到达但嵌套JSONObject回传未完成。改用显式JSON文本回传/解析并加入有界请求超时和重试，最终同一自检通过。此前成功构建不能覆盖这些运行失败；当前以最后三项成功为准。
- 手机已adb install -r覆盖安装Success，只读包查询确认0.1.10/code11。用户负责新版声音/服务器列表/地图验收；保留同一applicationId/签名/profile，未自动打开、刷新、登录或点击游戏。下次先看__timeCasketAudioState（created/running/suspended/closed/attempts/rejected只读数字）、加载后的socketProxy数量（应为2，不输出proxyUrl/能力路径）、固定native socket连接分类、web2的脱敏引擎信号。若缺zone映射，先记录实际官方目标/端口证据再扩展；不接受任意服务器IP，不反复要求扫码。整页刷新退登本轮仍未修改。

## 历史0.1.9真机复测与诊断盲区（2026-10-18）

- 用户确认安装后仍无声音，进入时“取消静音”浮窗点击无效；随后报告服务器弹出“咒语连接失败”（按用户原话记录，未截屏核对文本），询问是否与代理有关。声音修复验收失败，服务器连接仍失败，地图未验证。
- 当前页面只读检查：首页 `/preloadlist.xml`、`/ver.config` 均200（38/165ms）；深层web2主播放器的ver.config、Global.xml、Angel.config、两份基础类库、Effect均200（133/52/32/44/44/41ms）。首页这一对跨域修复已有真机证据；这不代表所有资源或游戏流程通过。
- 主游戏播放器readyState2、metadata存在、playingtrue、volume1、autoplayon、无panic；主游戏取消静音遮罩隐藏，而首页另一播放器的取消静音遮罩仍可见。遮罩隐藏和playing不能证明AudioContext运行或有声。开启调试器PageError监听后才能取得缓存：本次26条PageError中12条匹配音频自动播放阻止，另6条匹配跨域但未提取到允许输出的res域静态路径；不能将其认定为剩余游戏资源失败。未输出原始错误文本。
- 两个web2帧均有脱敏引擎状态，四项计数均0、官方Socket域名/错误码为空。但主播放器实际logLevel为error、socketProxy数组为空。固定Ruffle0.7.1上游 `web/src/navigator.rs` 的connect_socket在没有匹配桥时以 **warn** 记录Missing WebSocket proxy，并立即返回连接失败。因此当前日志级别会屏蔽这条关键证据，零计数不能排除Socket失败；空桥配置证明现有网页运行时存在TCP能力缺口，但尚未直接捕获本次游戏的具体Socket调用/目标。
- 用户所说的网络代理与Ruffle配置中的WebSocket→TCP桥是不同层。没有对用户代理进行对照实验，不能把弹窗归因于代理，也不能承诺关闭代理即可恢复。未修改VPS/代理/TUN/系统网络设置，未试探游戏端口或发送协议/认证数据；未刷新、点击、登录、安装或截图。每次临时ADB调试转发均已移除。
- 下一步先修正诊断可见性（注意warn级别原始日志的隐私边界），取得真实Socket调用/失败分类；再按networking.md比较受限本地桥与原生路线。音频另查固定Gecko158的WebAudio判定路径与实际AudioContext状态；0.1.9的媒体自动播放权限回调不能直接视为WebAudio已放行。本次仅补证据文档，未发新APK。

## 最新0.1.9：声音权限、首页预加载和选服诊断

- 0.1.8真机只读证据：主播放器autoplayon/isPlayingtrue/volume1、Play和Unmute均隐藏，证明配置已生效但不是声音证明；PageError多次提示AudioContext被自动播放策略阻止。现有App没有PermissionDelegate；固定Gecko158源码确认自动播放权限/defaultPROMPT。0.1.9/code10新增PlaybackPolicy及session权限回调，仅处理两种autoplay权限，允许官网首页/default及web2精确HTTPS来源；不授权其他能力、不改系统设置。真实callback与声音仍待用户验证。
- web2主播放器ver.config/Global.xml/Angel.config/两个基础类库/Effect插件均200。首页隐藏预加载器另外请求preloadlist.xml及ver.config仍失败missingACAO/200；已补官网首页的这两份配置对，MIME/方法/来源/已有服务器策略保护不变。compatibility1.2.1，公共目录规则保留。
- 用户要求对照Python接口，见docs/networking.md：参考实现原生TCP连dir:443取房间、zone连接/心跳，不等于HTTP跨域。现有缓存Socket信号不足，**不能据此断言只差TCP或全部只是资源问题**，更不能宣布登录/选服已通过。只读使用原有临时缓存，不再拉取/运行参考项目。
- 为下一次用户加载补game-frame engine-signals.js：MAIN世界只在web2，保留console原行为，仅计数Socket/缺代理/脚本错误/未实现功能，最多8个静态官方Socket域名/数字错误码，计数1000上限；不保存原文/对象/票据，字符串处理有长度限制，状态只在页面内。探针必须逐字段验证数字/域名后输出，不能dump整份page-controlled对象。
- 新增preloader/PlaybackPolicy/engine privacy测试均有RED→GREEN证据；Node18项/JVM6项通过，lint/主包/测试包完整构建通过42s；最终诊断长度限制改动后Node18项再次通过，lint/主包重建通过33s。最终签名/完整Ruffle资源核对通过，APK SHA256 `86e1191e605a18d2b82ba6e9add7aba0c1a46f3600bee76159626cb315309656`，路径app/build/outputs/apk/debug/app-debug.apk。已覆盖安装Success，包查询确认0.1.9/code10。保持profile和数据，未自动刷新/认证/点击或截图；用户尚未验证本版声音/服务器列表，完整刷新退登仍未修。
- 下一工具接手优先：用户打开0.1.9并保持当前会话后，只读检查autoplay权限决策、首页两份配置HTTP结果及每个web2游戏帧的__timeCasketEngineSignals（仅验证后输出固定数字计数/官方域名/错误码）；根据实际失败区分AVM2/缺Socket代理/资源，禁止把参考Python的TCP流程当成已确认根因。若需桥接先给出证据及架构比较，当前没有任何桥接实现。

## 历史0.1.8：省去Ruffle启动遮罩

- 用户明确额外播放按钮为Ruffle自带遮罩。新增compatibility/player-options.js，manifest1.2.0以MAIN世界/document_start/all_frames仅注入官网HTTPS范围；在具体页面范围检查后仅设置RufflePlayer.config.autoplay=on，保留已有渲染器/参数/脚本交互/声音遮罩，不模拟点击、不接触认证信息。上游Ruffle保持原版。
- Node新增3项配置保留/来源边界/manifest测试先RED再GREEN，合计15项通过；JVM4项、lint、主包/测试包本地构建通过43s；签名和官方Ruffle逐文件校验通过。APK SHA256 `780e80c7a2a6465c60324c31bd3b0c0a20a275c40d07e798af7ab47dd9e8f2ef`，输出app/build/outputs/apk/debug/app-debug.apk。覆盖安装Success，包查询确认0.1.8/code9。没有自动打开/刷新/登录或截图；用户验证自动启动、插件加载和选服。
- 刷新退回登录：工具栏当前reload整页；公开官网代码重建iframe入口并在部分状态调用LogoutPage，其公开实现执行退出处理。有网页代码依据，不能据此认定Cookie丢失。**本次未修改整页刷新逻辑，真正官方会话恢复和避免退登的游戏级重载仍未完成**，不存认证URL、不重放票据，不反复要求用户扫码。
- 用户提供roco-autobank供未来辅助参考，最终要求仅文档记录、无需继续拉取。见docs/references.md：当前不移植、不执行、不接入。初步检查时已临时克隆进忽略的.cache，未提交源码；后续不默认克隆/安装。不要把它的Python协议客户端当成我们的Flash兼容实现，参考不是架构切换授权。

## 历史0.1.7：版本清单补齐静态目录

- 用户0.1.6仍加载中，无游戏画面/无选服。只读检查确认ver.config、Global.xml、Angel.config和两个基础类库均200，之前适配已推进。当前EffectPluginLib.swf四次页面自身请求均被CORS拦截，PageError明确missingACAO/HTTP200；无播放器panic。公开HEAD证实Flash MIME/190572bytes。
- 公开ver.config为ZIP，内含13216条文件路径的XML，明确包含该插件，并提供plugins/activity/apps/video目录证据。0.1.7/code8、兼容扩展1.1.1补入公共directoryTypes表并由该表生成监听模式；manifest同步范围，限制每目录后缀及对应MIME。不是按单插件文件补丁，不放开h5脚本/HTML/备份、CGI、其他域或既有服务器CORS策略。
- 新增目录边界测试先RED后GREEN，Node12项/JVM4项/lint/主包及测试包构建通过43s；签名及官方Ruffle资源校验通过。APK SHA256 `63fa075692069755243649c44c19d8845c48fd793559bd369dbcc2124c2b9a82`。已覆盖安装Success，包查询确认0.1.7/code8。后续继续由用户验证，不自动刷新或登录，不截图，不反复要求扫码。当前会话数据保留，登录有效状态/选服/地图/Socket仍未知。
- 用户追加：每次刷新回到登录入口，且需要点击Ruffle自带启动遮罩。已确认属于Ruffle遮罩；下一步调查固定版本扩展的自动播放配置以及官网刷新导航，不凭此推断Cookie失效，不保存/重放认证URL。

## 历史0.1.6：公共静态资源适配

- 用户0.1.5停在“努力加载中，请刷新页面”。只读真机证据：preloader/main均执行且无panic，ver.config已200/62ms；下一阻塞Global.xml缺少ACAO/HTTP200。公开HEAD text/xml/2489bytes；公开XML列明四个启动依赖及swf/libs/conf/res目录，依赖HEAD均200、预期MIME且无ACAO。详见reproduction.md。
- 用户要求统一wrap方法，避免逐文件反复打包。`adaptPublicAssetHeaders` + `allowedAssetTypes`统一官方静态目录/来源/MIME策略，公共函数取代逐文件分支；manifest/listener同步目录范围。兼容扩展1.1.0，App0.1.6/code7。具体允许/拒绝范围在architecture.md最新章节，优先于下面历史逐文件说明。
- 仅res.17roco.qq.com精确HTTPS资源源，官网首页仅ROCO-Z8/编号Ceil家族/preloader，游戏web2来源按目录和文件类型允许。GET/XHR/200、匹配MIME、已有ACAO/ACAC跳过仍保留；不修改登录/广告/其他域，不全局禁用安全机制。
- 用户担心多次扫码风控，要求复用本次会话：保留同一profile/包名/签名和数据，不提取或重放认证信息，不自动认证或重试。覆盖升级会结束页面进程，官方会话恢复不能保证；若再次要求扫码由用户决定，不反复要求其认证。安装持续授权仍有效。
- 新公共规则/启动依赖回归先RED后GREEN；Node11项、JVM4项、lint和主包/测试包构建通过41s。签名及完整官方Ruffle资源核对通过，APK SHA256 `88d36004d681f34aac446578b1db0c0028ce45b57d02e9672ee60d021d634c69`，路径app/build/outputs/apk/debug/app-debug.apk。已覆盖安装Success，包查询确认0.1.6/code7，保留数据且未打开/刷新页面。等待用户检查能否复用官方会话并继续加载；不要为了验证反复要求扫码。当前不等待云端检查，不截图、不自动操作游戏；选服/地图/战斗仍未验证。

## 0.1.5品牌更新：时光匣

- 用户补充“时光匣也可以”，最终按「时光匣」落地，未采用先前候选「拾帧」。应用显示名由strings.xml提供；新增原创匣子/像素光点矢量Logo、自适应图标和Android33单色图标，源文件docs/brand/logo.svg，说明docs/branding.md。
- applicationId/包名/签名不变，不迁移浏览器profile、不改变游戏适配、主页入口或网络设置。版本0.1.5/code6，lintDebug/assembleDebug本地通过47s；aapt确认名称时光匣、版本和打包图标。签名及完整Ruffle资源校验通过，APK SHA256 `1dba29a2eb2b244acb161aec39e12dfaa63dd1b27fa684b3ec3e2737c9eafaed`，输出app/build/outputs/apk/debug/app-debug.apk。已adb install -r覆盖安装Success，包查询确认0.1.5/code6，未启动或操作页面。
- 名称未做完整商标近似清查，不承诺注册或无冲突。仓库尚无根LICENSE，发布前需维护者选择项目许可并核对依赖署名；本次不自动选择许可证或发布应用。
- 用户负责桌面图标和应用视觉验证，不截图。此前0.1.4主页动画、0.1.3版本文件、游戏登录/选服/地图等未获新反馈的关卡仍待验证。

## 0.1.4主页动画修复

- 用户在0.1.3报告主页黑屏、只有开始按钮。只读检查确认首页ROCO-Z8和preloader均执行，metadata存在、无panic；PageError定位动态动画 `/swf/ceils/ROCO-Z8_Ceil_3.swf` 缺少ACAO/HTTP200。公开HEAD证实Flash MIME/164312字节。此时无游戏main帧，不能确认ver.config修复效果。
- 0.1.4/code5、兼容扩展1.0.3仅增加这个精确公开动画文件，来源仍限定官网首页。其他编号分片不自动允许；方法/状态/MIME/已有CORS策略限制不变，不修改渲染器或认证。
- 新回归先RED再GREEN，Node8项、JVM4项、lint和主包/测试包构建通过41s；主包签名及官方Ruffle完整资源校验通过。APK SHA256 `1d1e5f0570ed088a51b57fd28e056c4e8a0103e6965297ee1eae2845fbf4f695`。已覆盖安装，adb返回Success，包查询确认0.1.4/code5；保留数据，用户视觉复测待完成。
- 下一步由用户刷新官网确认动画恢复，再分别验证版本配置、选服及游戏。仍不截图、不自动操作网页、不把入口播放器执行视为完整主页或登录通过。

## 历史版本：0.1.3

- 0.1.2真机只读检查已确认preloader/main均readyState2、metadata存在、无错误覆盖层和panic；前一轮公开SWF加载问题已推进。用户随后报告“版本文件加载失败，请检查配置”，不能据此认定已选服或进入地图。
- 实际失败为res.17roco.qq.com精确 `/ver.config`：web2游戏帧两次请求，PageError明确HTTP200缺少ACAO；公开HEAD确认octet-stream、217494字节、无ACAO。未读取或记录认证状态、Cookie、票据或认证URL。
- 0.1.3/code4、兼容扩展1.0.2仅增加上述文件，精确HTTPS web2来源，GET/XHR/200、octet-stream MIME及已有ACAO/ACAC策略跳过限制均保留。其他配置文件/动态资源未泛化放行。
- 回归先RED再GREEN；Node7项、JVM4项、lint、主包/测试包构建通过43s；签名和完整官方Ruffle资源核对通过。APK SHA256 `7163fdefdfa7d56bf78405da7a26be9638cca1d6c1b881655a0d31164fe661d3`，输出仍为 `app/build/outputs/apk/debug/app-debug.apk`。
- 已按持续安装授权执行adb install -r，Success；包查询确认0.1.3/code4。保留数据，未自动打开或刷新网页。下一步由用户检查版本文件提示是否消失、是否出现服务器列表，再按新证据推进资源/联网问题。
- 用户询问免密登录：现有正常Gecko profile已经保留浏览器会话，但官方重开恢复/有效期未实测。待加载修复后由用户关闭重开验证；不新增密码保存、Cookie提取、认证URL重放或猜测鉴权参数。

## 历史版本：0.1.2

- 用户在0.1.1报告：主页动画不全、可以扫码、扫码后再次Flash加载错误。不能把此前“可以了”视为登录通过。
- 只读Gecko帧/播放器检查与PageError定位：主页 `https://res.17roco.qq.com/preloader.swf`，以及官方web2页面的 `/main.swf`，均HTTP200缺少ACAO、播放器state0/无metadata。有独立公开HEAD证据：Flash MIME，大小9721/54455字节；未发现播放器panic。页面认证结果和具体失败弹窗文本尚未知。
- 0.1.2/code3、兼容扩展1.0.1仅增加上述两个精确公开资源。preloader沿用官网首页来源限制；main仅允许HTTPS精确web2.17roco.qq.com来源，认证页面路径不猜测。保留GET/XHR/200/Flash MIME及已有ACAO/ACAC跳过条件。不适配广告、不修改认证端点。
- 新回归先RED再GREEN；Node边界/隐私6项、JVM4项、lint、主包及测试包构建全部通过。签名和完整官方Ruffle资源校验通过。未在手机自动运行测试，不等待云端检查。
- APK：`D:\workspace\roco-app\app\build\outputs\apk\debug\app-debug.apk`；SHA256 `6a72102c3652316a27b8cafe79ce3812878484469bdf894a2263ba8433ed64bd`。用户授予持续安装许可后，0.1.2已通过adb install -r覆盖安装，返回Success；只读包查询确认versionName0.1.2/code3。保留数据，等待用户打开、刷新、扫码复测，未自动操作网页。
- 下一步先确认两份公开SWF是否真正加载，再检查有效游戏登录、选服及后续资源/Socket。不预设所有问题均为CORS，不宣布游戏流程通过。只读探针只读取播放器状态和PageError，不采集ConsoleAPI参数、Cookie或认证URL；临时ADB转发已移除。

## 最新诊断与进行中的修复：0.1.1

魅族0.1.0已复现与Firefox相同的“无法运行嵌入Flash”。只读调试确认 `res.17roco.qq.com/swf/ROCO-Z8.swf` 返回200但缺少ACAO，浏览器明确报CORS拦截；Ruffle readyState0、metadata未加载、flashready0。官网11秒后弹出的确认框是回调未就绪提示，旧cgi-bin/login问题仍独立。

正在构建0.1.1/code2：新增独立 compatibility/public-swf.js，仅为官网 / 或 /default.html 发起的那一份公开SWF的HTTPS GET/XHR、200且Flash MIME响应补缺失ACAO；保留已有服务器ACAO/ACAC策略，遇凭据跨域响应头时直接跳过、不更改登录、FlashVars或全局安全设置。Node边界/隐私测试5项已通过，适配前已观察红色测试。本地4项JVM测试、lint、主包及测试包已构建成功；CI及真机更新验证待完成；此前ba84be2的成功结果不代表这一修复已验证。

用户已授权直接本地升级，不再等待云端检查。0.1.1已通过 `adb install -r` 覆盖安装，返回Success；只读包查询确认versionName0.1.1、versionCode2。保留应用数据，未自动启动或操作网页。用户负责打开、刷新、登录和游戏操作；可以只读检查状态，不截图。根SWF适配是否生效仍待用户刷新后的真机证据。

当前工作策略：专项本地调试，云端检查不作为安装前置条件；仍需同步文档并使用git.exe推送main。不因此禁用现有CI，也不把旧版本CI成功视为0.1.1通过。本地APK SHA256：`efbda4eaf3eb0f5f62561092964ee656e74fbd22ec88e52dda3f624605548706`。

## 上一已验证版本与环境

已完成 Kotlin + GeckoView + 内置官方 Ruffle 的兼容性验证原型。已验证源码提交 `ba84be21f3937cf8bc18d2baaf5f4d0741f04e03`。

- [GitHub CI](https://github.com/coderleexl/roco-app/actions/runs/39091368510)：build 与 smoke 均成功；三个测试分别验证 Flash FSCommand、关联窗口/共享测试 Cookie/关闭回调、重启进程后的 Cookie 保留。
- [对应云端 APK 压缩包](https://github.com/coderleexl/roco-app/actions/runs/39091368510/artifacts/12122389419)：解压安装 `debug/app-debug.apk`，不安装 androidTest APK。
- Windows 本地构建成功：单元测试4项、lint、Debug 主包和测试包；签名验证与内置 Ruffle 每文件校验通过。
- 本地主 APK：`D:\workspace\roco-app\app\build\outputs\apk\debug\app-debug.apk`。
- 已安装到魅族21（ADB序列号 `461QYGDN225SM`），`adb install -r` 返回 Success；只读包查询确认版本0.1.0，versionCode1。
- **尚未验证手机打开 App 后的官网、官方认证、选服、地图、基础战斗、15分钟稳定性及真实登录恢复。等待用户操作和反馈；禁止自动宣布完整游戏可玩。**

## 下一步

1. 0.1.1已获授权并安装；等待用户打开并刷新官网，再只读检查根SWF是否可读、metadata和flashInit是否真正出现，再推进官方登录。不要等待云端检查或重复询问本次安装许可。
2. 根据具体失败收集脱敏导航/窗口/请求元数据；先区分独立SWF登录问题与旧 `/cgi-bin/login` 404，不猜测认证参数。
3. 登录成功后才排查选服和游戏联网；发现 Socket 等能力缺口时提交证据，再比较桥接与原生路线。
4. 每次修复同步本交接文档、兼容性记录及相关构建/排障说明，使用 git.exe 推送 main。

## 固定环境与本地构建

- GeckoView `158.0.20261007201254`；官方 Ruffle release0.7.1 / manifest0.7.1.65535，SHA256和来源在 third-party/ruffle.json。
- AGP9.2.0、Gradle9.4.1、KGP2.4.20；compile SDK37.2 / Build Tools36.0.0，min26、target35；无需NDK。
- SDK：`D:\Android\sdk`，37.0与37.2并存。37.2经用户允许，使用官方68,056,472字节包及仓库SHA1 `4bec12a02162ff6852df50b5fcf8ee762b050966` 校验安装。
- 本地 JBR：`D:\Android\Android Studio\jbr`（25.0.3），云端JDK17。
- 本地 local.properties 已指向 SDK；用户/IDE生成的 gradle/gradle-daemon-jvm.properties 使用Java25，仍是未跟踪文件，已保留且未提交。
- Gradle包装器首次Java直下载停滞；使用官方同版ZIP及固定SHA256校验后放入标准包装器缓存，`.\gradlew.bat --version` 已成功。未修改系统代理/网络设置。

```powershell
$env:JAVA_HOME='D:\Android\Android Studio\jbr'
$env:ANDROID_HOME='D:\Android\sdk'
.\gradlew.bat --no-daemon testDebugUnitTest lintDebug assembleDebug assembleDebugAndroidTest
python tools/verify_ruffle_apk.py app/build/outputs/apk/debug/app-debug.apk
```

## 已定位问题与限制

- 默认AAPT规则会遗漏 `_locales`；已修正过滤并按官方固定XPI逐文件核对APK，保证扩展资源完整。
- Gecko子进程也运行Application生命周期；主Runtime只从主Activity启动，已避免最初启动崩溃。
- API35 x86_64 SwiftShader上的默认wgpu渲染器在创建着色器时超出 `GL_MAX_VERTEX_UNIFORM_VECTORS(256)`，触发Wasm panic。**只在固定本地自检页请求普通webgl**；官网保持默认渲染器，真机兼容性未知。
- 自检页和原始SWF是测试样例，不是洛克王国；普通WebGL覆盖能力比默认wgpu少。
- 自动点击曾在窗口未就绪时注入到非应用UID；加入窗口焦点等待、UI空闲同步和真实80ms触摸间隔后，run39091368510三项测试通过。
- 详细失败证据/修复账本：implementation.md；验收边界：compatibility.md；操作步骤：testing.md / troubleshooting.md。

## 安装与隐私约束

本次主包安装已获许可并完成。后续更新安装、root或设置改动仍按用户“写入先问我”执行；不截图、不代办登录、不记录秘密。已安装的是**本地签名**APK；后续优先同一本地debug密钥升级，云端临时debug签名可能不一致，遇签名冲突不可直接卸载清数据。
