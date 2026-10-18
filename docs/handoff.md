# 开发交接（2026-10-18）

## 最新0.1.24：撤回导致选服后卡住的WebGL试验（2026-10-18）

- 用户0.1.23实际验收FAILED：“进服务器一直加载不动”，询问与改动是否有关。只读main ready2，configured/actual renderer均webgl，DPR2.73、canvas2618×1527、显示960×560。文件目录0和区服endpoint7均connected/first-send/first-receive，目录最终139/216B；无新增资源IO，scriptErrors1。因此不能归因区服未连上或代理。
- 将缓存错误提取器从原只匹配Error#的盲区扩到不区分大小写AVM2/RustError，并用固定字面bool匹配确认`Render backend does not support BitmapData.draw`。上游0.7.1 render/webgl render_offscreen直接None，AVM2 BitmapData.draw对应返回此RustError。只输出固定flags，不保存原错误/堆栈/查询/票据。已向用户明确该渲染改动触发兼容性错误，应撤回；本地中文样例未覆盖游戏位图能力，不能当完整游戏验证。
- 0.1.24/code25、兼容1.4.5删除0.1.23默认/null→webgl，恢复原自动选择并保留显式后端。保留canvas字体、11个活动GET与系统退出元数据。新增bitmapDrawErrors限额数字，主游戏端口/原生映射phase-bitmap-draw-errors；固定原文只用于分类，不导出。Node64通过：原后端用例改为自动/显式保留，分类与跨端口隐私断言覆盖新字段。
- 本地文字样例恢复仅自身显式webgl（SwiftShader默认wgpu已有旧失败），不用它证明官方自动后端；本轮未重复8个未改浏览器样例，后端回退及数字telemetry由Node/JVM/构建验证，官网由用户验收。最终JVM15/lint/主及测试APK构建47s通过；签名/完整原版Ruffle及6个兼容文件包内逐字节一致通过。APK SHA256 `b075af15e23b2e7bf06a5ebcbd6797013607fa2f53328ece1ee352218c48b39a`；已adb install -r覆盖安装Success，包查询确认0.1.24/code25，保留数据。已请用户重新进入同一区服反馈地图/仍加载，先暂停切场景内存采样；官网恢复待验收。
- 卡住时一次PSS快照总1717.9MiB、GPU482.5MiB、主要内容进程745.0MiB；阶段与之前不同且功能失败，不认定性能改善。新版启动历史reason10/1等为系统记录，未直接认定OOM；高内存、真实泄漏、卡顿、活动2032/1989/404、技能文字/音乐和QQ手机授权均继续待查。
- 下一步安装回退版后用户重新进入同一区服，确认地图加载及bitmap错误消失，再在可玩的后端连续采样内存。不改系统网络、不清数据、不截图/自动官网登录或点击；未跟踪Gradle配置/work/辅助EXE不读/运行/提交。

## 历史0.1.23：GPU高占用下试用传统WebGL；性能待实测（2026-10-18）

- 0.1.22已提交推送9e6a8d5且覆盖安装Success/code23，用户随后报告“闪退、没打两下就卡”。不要丢失QQ授权需求：仅有可行性排查，未实现；本轮用户插入性能反馈后先处理稳定性，活动/2032/技能文字/音乐同样未完成。
- 只读系统快照：本包各进程PSS合计2260.4MiB；GPU pid15997 PSS1404811KiB≈1371.9MiB，主进程272123KiB≈265.7MiB，另有多个内容进程。不能只报主进程内存，也不累加RSS当独占内存。最近15:48:42退出为PACKAGE UPDATED，对应覆盖升级；15:44:02后台importance400子进程LOW_MEMORY。crash buffer有15:25:50旧子进程SIGSEGV，模块libGLESv2_adreno.so，早于canvas字体版。不把这些合并成“刚才闪退已证实OOM”，未记录原始崩溃消息/包/认证，仅固定类别/时间/库名/数字。
- 只读官网首页Used renderer=wgpu-webgl，DPR2.73，仅1×1就绪预载与两个0尺寸未就绪电影；当前GPU高占用不是必须进入战斗才出现。0.1.23/code24、兼容1.4.4对原官方首页和web2范围，preferredRenderer缺失或null时试用传统webgl；显式后端保留，quality/字体canvas/连接/认证不变。上游说明webgl初始化较快但功能较少，仍使用同一GPU，不能承诺绕过Adreno驱动或降内存，位图/混合效果需用户验收。
- Debug/API30+在主进程startBrowser、创建Gecko前读本包最近至多8条ApplicationExitInfo，记录exit-info-count与相对秒数/角色/原因/importance/RSS MiB数字；角色0主/1GPU/2内容/3其他。不读trace、description或processStateSummary、不留进程名；异常固定exit-info-unavailable，不阻止浏览器。初轮模拟器API返回空历史、没有明细，新补count区分空结果与未运行；最终模拟器启动记录exit-info-count=6，元数据路径实际运行。
- Node64、JVM15及初轮lint/两APK通过77s；新增后端默认/null/显式保留/quality不变边界。原中文本地样例去掉硬编码webgl，让生产配置选择后端，六字非空/不同摘要验证7.838s、OK(1test)。不截图、不导出图像；这个不能证明实际游戏位图/性能。最终增量构建52s通过（JVM15/lint/主及测试包）；原shortcut/Flash/session回归5.947s、OK(1test)，其余6个未改浏览器用例本轮未重跑。签名/完整原版Ruffle和6个兼容文件包内逐字节一致通过。APK SHA256 `c252864d71132263a3caa112db19c3cf803fe019b345c322fb6ad478ca3668b3`，真机adb install -r覆盖安装Success，包查询确认0.1.23/code24，保留数据；已请用户正常进入并打几次后保持前台，读取新GPU内存/退出日志，等待反馈。
- 下一步最终安装后由用户打开App并正常玩几次，先读GPU PSS和新退出元数据，再判断内存/卡顿；没有实测下降就不称已优化成功。读取QQ认证入口/授权确认仍只能用户操作，未放开外部scheme或接SDK。未跟踪Gradle配置/work/辅助EXE均保持原样且不读取/运行/提交。

## 历史0.1.22：补新活动接口及网页alert日志，QQ授权未实现（2026-10-18）

- 用户新增需求：登录时检测并唤起手机已登录QQ、由用户确认授权免扫码，已明确意图；期间继续报告2032 Stream Error，又明确刚点活动出现“哎呀出现了网络故障 ioerror”。保留两项工作，不把QQ问题当2032来源。真机0.1.21：main ready2、字体后端canvas实际加载，无message-overlay/panic；尚无技能文字改善反馈。文件IO0→3，HTTP bridge完成8次无失败增长；cache没有2032，计数0不能排除用户弹窗。
- 当前CORS脱敏路径新增discovery/mend_shape/dawn_hymn；无认证HEAD三者均200/text-xml，ACAO固定https://res.17roco.qq.com、ACAC=true，与web2来源不符。0.1.22/code23、兼容1.4.3只追加这三项游戏GET，总11端点；原owner/Request品牌/realm/流与状态保持/失败不重发均不变。新增断言三项均在规则内并明确warehouse_security_code仍拒绝，登录/隐私/防沉迷均未纳入。静态s4271/s4291仍404，2032具体哪次请求及活动1989仍未知。
- 原生onAlertPrompt记录page-alert，只留1009/1010/2032或0；匹配IOError/ioError/Stream Error时再留page-alert-io=1。只扫前4096字符，验证码/未知编号不会被记录，title/message不写日志，原弹窗行为保留。新JVM测试覆盖固定编号、边界/任意数字拒绝及IO类别。该层是网页JS alert，不宣称能抓Flash内自绘所有弹窗。
- QQ只完成可行性排查，尚未交付免扫码功能：公开login.html使用官网OAuth client102061779、官网logintarget回调，桌面UA使用PC组件；匿名移动UA转xui style35页面，但没有核实可用的外部QQ唤起/回调。官方Android SDK需AppID和回调，应用自己的授权不能直接当洛克官网登录。当前native拦截所有外部scheme确实是待处理点，但单纯解禁不能证明认证完成；未接SDK、未修改UA/授权流程/认证参数/外部scheme，没有操作真机登录。匿名页面临时签名/查询/Cookie只瞬时处理，不落盘/输出；静态公共JS可缓存。详见networking.md，不能答“已经支持自动检测已登录账号”。
- Node63/JVM15/lint与主及测试APK通过，构建56s；签名/完整原版Ruffle和包内6个兼容文件逐字节一致通过。SHA256 `297f47fb769e7214f64998f7950e3a11c30e9d9d119f0e2e867f5b7844d14764`。本轮仅端点表/数字日志，不重跑8个未修改的本地浏览器样例；不能以构建认定真实活动通过。
- 已adb install -r覆盖安装Success，包查询确认0.1.22/code23，保留数据。下一步用户点刚才失败的同一个活动，读新文件桥与IO/page-alert分类。首次IO/2032/活动1989/静态404、技能文字、音乐和QQ快捷授权仍有未完成项；不截图、不清数据、不改网络，不读取/运行/提交未跟踪辅助EXE/work/Gradle配置。

### 追加用户性能反馈（本版安装后，只读排查中）

- 用户报告闪退及打几次后卡顿。系统15:48:42多进程退出=PACKAGE UPDATED，对应本次覆盖安装；另15:44:02有importance400后台子进程LOW_MEMORY，不直接当成前台游戏闪退。crash buffer有15:25:50旧子进程SIGSEGV，栈模块libGLESv2_adreno.so；旧于0.1.21，不能归因刚加的canvas字体。当前进程PSS合计2260.4MiB，GPU pid15997约1371.9MiB，主进程约265.7MiB；RSS有共享不能简单相加。显卡/多进程内存压力是下一步，尚无优化效果。只输出固定原因/时间/数字/模块，不保存原始崩溃文本或参数。

## 历史0.1.21：战斗设备字体与细分错误日志（2026-10-18）

- 用户0.1.20反馈首次进入仍IOError、其他较好；随后报告战斗按钮能点但文字空白，又出现多次error。先说“方框”后明确纠正“文字是空白”，按空白记录，不以方框当缺字体确证。文件HTTP桥完成12次、failed/unavailable无增长；IO2→4、traceErrors2→6，主电影trace/config/login重载至2。原桥已实际返回Response不代表所有活动成功；初始IO及其他错误仍失败。
- 只读缓存脱敏提取两条Error#1010的公开方法栈，均指向活动1989 UIMain.setBossPage/onDataReceived，经CGI.completeHandler1。公共npc1989/s4271/s4291仍404，不据此断定1010唯一根因。其余观测CGI名称discovery/warehouse_security_code/privacy_agreement；未扩大8个活动接口转发，没有补保护流程。用户后来关闭App，RDP握手EOF两次并清理forward；已告知先不用重新登录，等待新包。
- 公开CombatPluginLib：AttackSkillCell给skillNameText赋skillDes.name；SWF字段700 useOutlines=false引用字体299，字体glyph数0，依赖设备字形。Ruffle0.7.1默认embedded无法读手机字体，canvas可用但上游标实验性。0.1.21/code22、兼容1.4.2仅精确官方web2、未显式选字体后端、OffscreenCanvas真实2D可用时启用canvas；首页、显式选项、GPU preferredRenderer保留。没有修改游戏SWF、Ruffle二进制、网络设置或认证。不据源码分析直接认定真实文字已修好。
- trace/console新增1009空对象、1010未定义访问、2032流错误及缺字体的固定数字分类；原console脚本错误和未支持计数也经既有0..1000受限端口落文件。未知错误仍有总计数，不保留原文/URL参数/堆栈/凭据；可能双通道重复观测，不等于弹窗数量，也没有宣称hook到Flash内部所有统一弹窗。未屏蔽错误/假成功。
- 新原创TextProbeFixture生成SimSun零字形设备字体及六个固定中文字的微型SWF。真实Gecko/Ruffle本地样例检查六字均有非空字形、至少4种不同摘要，验证系统字体路径实际生成中文字；只取自有字形buffer摘要，无截图/图像导出/游戏内容。生产配置函数复用于固定scope替身。新Android独立进程用例5.660s、OK(1test)，原shortcut/Flash/session回归5.447s、OK(1test)，其余6个未改样例本轮未重跑；CI加入第8项。
- Node63、JVM14、lint与主/测试APK通过，构建62s；签名/完整原版Ruffle验证通过，包内6个兼容文件逐字节一致。APK SHA256 `f6d838d978014cd89d0e82f8c98c9c2fe9cc5e94dbc8e7fc4e075c25f1e40c8e`。已adb install -r覆盖安装Success，包查询确认0.1.21/code22，保留数据。README仅补使用者可见的战斗文字限制，兼容表纠正旧版本仍写未选服的过时状态。
- 下一步用户正常进入一次战斗确认技能名/PP/其他中文；复现统一error时结合新分类日志与标题/编号对应来源。首次IOError、活动1989、静态404、音乐与完整战斗/稳定性仍未完成，不能把本地中文样例当官网验收。未跟踪Gradle配置/work/辅助EXE保留且未读取/运行/提交。

## 历史0.1.20：活动CGI的同源传输与响应realm（2026-10-18）

- 用户要求读“大量ioerror”日志并手动点了三个活动。0.1.19文件计数从4逐步增至12；目录/zone6（endpoint7）首收发成功，不能归因代理或连接断开。只读全屏几何已从旧y885修正到bbox约(149.8,0,1135.37,662.3)，位于1435×662.3可见区内；仍未据此宣称触控/声音通过。
- 纠正上轮诊断遗漏：原CORS提取器只列res公共静态路径，忽略活动CGI。当前缓存79条CORS匹配提取到14次17roco game-cgi（随后增至15），包括online_present、mini_game_manage、vip_tab_state、star_tower_new、star_tower_exch_shop、ifrit_challenge、back_player_guide；另有保护流程类别，不作为本次转发目标。用户三次点击期间只读NetworkWatcher看到ui4292/ui3760/ui1931等304，旧NPC1989四次404。公共无认证HEAD验证活动CGI=200/text-xml，ACAO固定https://res.17roco.qq.com、ACAC=true，带web2或首页Origin均不变；游戏页面实际web2，来源不匹配。这比缺SWF更能解释活动UI加载后ioError，不再将全部礼包错误归因404或304。公开UI公共CGI错误处理会对ioError弹网络故障提示；所查UI4292配置ifrit_challenge、3760=back_player_guide、1931=zombie_coming。
- 0.1.20/code21、最终兼容1.4.1：MAIN game-http只在web2为8个已核实活动GET接口使用可访问且精确HTTPS官网首页/default的原fetch与Request构造器，按URL字符串在首页realm构造新Request，mode=same-origin/redirect=error。保留游戏原URL、查询、headers、credentials/cache/signal，不解析/生成/存储认证字段，不改服务器既有CORS策略。失败不换通道重试；其他域、未知端点、POST、登录/隐私/防沉迷流程保留原行为。8项见game-http.js，不能称已支持所有游戏CGI。输入Request用原生getter作跨realm品牌检查，不信任自有url属性；构造后再次确认目标与GET，避免URL遮蔽或方法变化越界。
- 原版Ruffle fetch返回值会在游戏realm做Response类型检查；转发后用游戏realm的Response包裹原始ReadableStream，保留状态/headers/url/type/redirected，不解析响应、不全量缓冲。403等失败状态不伪装200。四个限额数字httpBridgeAttempt/Complete/Failed/Unavailable经现有主游戏端口写文件；Complete仅表示返回Response包装，不是礼包/业务成功。未改Ruffle二进制、Socket、系统网络或现有浏览器数据。
- 新Node5项覆盖8接口、实际/外realm Request输入、URL遮蔽拒绝、Response realm/原流内容/headers/abort、403保持、失败不重发、来源/端口/敏感路径/方法拒绝及幂等；最终61项与JVM14/lint/两APK通过（首轮65s、最终增量37s）。本地两真实Gecko realm测试最终用外realm Request输入，验证原始字节/本realmResponse/403保持，5.343s、OK(1test)；首轮同realm输入5.686s也通过。它使用本地测试scope和固定回环接口，不能证明官网同源请求已验收。CI纳入新Node文件及第7个独立进程用例。最终签名/完整原版Ruffle校验通过；APK SHA256 `03d9d5e9ee901a9fa49c4ef921d8e095b270ab0832b65f0b6d03a6be87fc57b0`。
- 只读网络观察关闭请求/响应正文保存，只输出公共静态路径/状态/字节数；额外CGI观察仅固定类别/状态，未请求headers/Cookie/响应正文/WS包，未导出查询。观察器退出均移除临时forward。协议schema首个旧方法不可用，改用官方Watcher API；没有RDP页面展示注入/认证/游戏自动点击。未跟踪的Gradle配置、辅助EXE和新出现work/均不读取/运行/提交。
- 原快捷入口/Flash/session回归5.962s、OK(1test)；与新HTTP样例共2项通过，本轮未重跑其余5个未改的本地样例。包内5个兼容脚本/清单与工作区逐字节一致。已adb install -r覆盖安装Success，包查询确认0.1.20/code21，保留数据；已请用户点原活动，尚无本版真实活动反馈。核对名称后关闭本次TimeCasketProbe模拟器。
- 下一步用户再点原礼包/活动，直接核对http-bridge-*和IO计数变化；实际活动、剩余静态404、声音仍未完成。全屏仅有真机几何到位证据，不代替触控/视觉验收。

## 历史0.1.19：修复横屏后游戏窗口落到屏幕外（2026-10-18）

- 用户0.1.18明确验收失败：全屏黑屏，点击礼包/活动仍IOError。只读真机证明主main已运行、无panic/AVM2分类错误，目录和zone5（endpoint6）已连接并首收发，不能当连接故障。全屏ack=1只证明样式已设置，不证明可见；实际viewport1435×662，mainiframe bbox约(0,885,1435,837)，整个窗口落在屏幕下方。inline top884.958和scale1.49479可由早期1435×2607尺寸精确复现；后续尺寸变化未重算，同一target原来直接return。
- 0.1.19/code20、兼容1.3.9：game-view优先使用顶层visualViewport宽高与偏移，监听其resize/scroll；每次同目标轮询也重算，补上旋转/系统栏/缩放异步变化未触发Window resize的路径。退出清理两类viewport监听并恢复旧样式。两项回归测试先RED，直接复现top884.958，再GREEN。无导航/重载/认证/系统设置变更。
- 新固定本地view.html浏览器样例使用真实DOM/CSS/iframe/visualViewport和原生产适配器，只有window scope为本地测试替身；不导航官网，不放宽生产来源校验。先故意把舞台置于屏幕外，再同目标重算，实际getBoundingClientRect验证位于可见边界内；Android再旋转到横屏验证边界，返回竖屏检查旧属性/inline还原。新用例加入CI，共6项独立进程。首轮测试因loadProbe第二处固定路径表漏加/view.html而崩溃，补齐后新样例7.176s、原快捷方式/Flash/session用例6.446s，均OK(1test)。不是官方全屏验收证据。
- 活动IOError仍未解决：三项exbn实机资源条目均200、约75/76/75ms，相关CORS已消失；剩下重复CORS公共路径仅activity/4271/s4271.swf和4291/s4291.swf，当前无认证HEAD均404/text-html/564B。对应ui4271.swf与ui4291.swf却公开200（665976/1542587B），ver.config也仅列这两个ui，不列s。公开ui4271只读反编译包含roco_restaurant相关控制类，非纯图片壳；s入口契约未核实，不能直接用ui替换，不能据两个404认定所有礼包同因。后续RDP只读活动明细探针遇EOF两次，均清理转发；没有原始认证/包/console落盘。
- 新增仅数字ioErrors/httpErrors：观察主电影trace与既有console分类中的IOError/固定loader http code:4xx/5xx，原文/资源URL/凭据不保留，经现有受限端口写phase-io-errors/phase-http-errors。便于下次点击活动直接读文件，不再要求打开诊断。Node56/JVM14、lint及两APK最终构建48s通过（首轮75s）；签名/完整原版Ruffle及4个兼容脚本/清单包内一致性通过。APK SHA256 `28194ee3e2d4ae59bcd1fe912174098076fe0454fafca2159761ca1f096c66b5`。
- 下一步覆盖升级后由用户测试全屏边界和触控，并提供失败礼包/活动名称以对应资源；IOError、官网声音仍失败/未验收。未把全屏模拟器通过当真机完成，未重复未改的其余4个本地样例，未进行上版被拒绝的RDP展示注入。
- 已adb install -r覆盖安装Success，包查询确认0.1.19/code20，保留数据；已请用户复测黑屏并提供具体礼包/活动名称，不要求截图或打开诊断。当前只确认“点击后弹出”，尚无名称或本版全屏反馈；保持IOError未解决状态。关闭本次名称核对为TimeCasketProbe的隔离模拟器。

## 历史0.1.18：从入口就单独显示游戏窗口（2026-10-18）

- 用户否定0.1.17横屏效果，澄清只要Flash那块全屏，网页周边不要。只读几何证据：首页viewport980×323，mainiframe位于(20,61)、960×560，仍有首页新闻等周边；三个首页Ruffle分别0×0、0×0、1×1，最后一个为已就绪preloader，不能拿它当可见游戏。当前仍在官方登录层；文件只有game-view-requested，没有主游戏ready/展示ack。0.1.17仅在web2 main就绪后才裁切，这一阶段实际只旋转，用户反馈成立。
- 0.1.18/code19、兼容1.3.8：顶层官网展示端口立即聚焦原有mainiframe（960×560），网页周边、App工具栏和系统栏随展示ack隐藏。官方跨域登录留在该窗口，不访问其DOM/地址或复制凭据；主游戏就绪后尝试聚焦真正main播放器，父链不可访问时保留外层游戏窗口。首页隐藏预加载器不作为展示目标。单一顶层展示所有者避免与子帧重复写CSS；子帧继续主游戏刷新/信号上报。晚连接端口也接收已请求模式，避免冷启动丢失请求。
- 首页端口仅精确HTTPS17roco的/与/default.html用于展示，不取得reload/phase权限；reload仍限原web2就绪main。退出按返回恢复原DOM/样式/网页，无导航/重载/认证重放。入口改名“游戏全屏”，shortcut ID不变。README只更新使用说明，过程写docs。
- Node53项通过（新增6项含登录前聚焦、就绪切换/重载回退、不可访问父链回退、缺容器拒绝及单一展示所有者）；JVM新增首页展示与刷新权限分离测试。首轮JVM/lint/两APK构建56s通过；最终包复核、模拟器与覆盖升级结果见后续记录。没有再次执行上版被自动审批拒绝的RDP展示注入；本轮只读几何探针正常完成并清理临时转发。
- 未验证：官网实际全屏裁切、缩放触控、登录到游戏切换仍由用户验收；声音、活动礼包IOError继续待办，不以构建或Node模型认定已修复。下一步安装后用户点击“游戏全屏”，直接读文件ack，不要求截图/诊断弹窗。
- 最终Node53/JVM14/lint/主包及测试包通过（最终增量构建42s），签名和完整原版Ruffle校验通过，APK内3个兼容脚本/清单与工作区逐字节一致；SHA256 `9cf80d47241a7c35c8c25b68a01a903e8ce5b138e8aadad9b7586f4373e1f635`。隔离API37/x86_64模拟器仅重跑受影响的shortcut保留session/返回恢复用例，6.699s、OK(1test)；本轮未重复其余4个未改的声音/窗口/Cookie样例。上述不能证明官方CSS/触控通过。
- 已adb install -r覆盖安装Success，包查询确认0.1.18/code19，保留数据；已请求用户点击“游戏全屏”验收，尚无本版反馈。仅关闭名称核对为TimeCasketProbe的本次模拟器，未操作真机网页/登录/系统设置，未截图。

## 历史0.1.17：横屏游戏快捷入口与面向使用者的README（2026-10-18）

- 用户在0.1.16礼包复测提问中追加需求“加快捷方式，进去横屏打开Flash，只需要展示游戏界面”；继续保留礼包IOError/声音待办，优先交付游戏画面入口。用户另明确README不应写开发过程，只面向使用者：此约定持续有效，后续排查/构建/版本流水放docs，不再向README顶部叠开发段落。
- 0.1.17/code18、兼容1.3.7：顶栏横屏游戏切换及动态launcher shortcut landscape_game，复用当前Activity/GeckoSession。动态Intent使用NEW_TASK/CLEAR_TOP/SINGLE_TOP，避免静态快捷方式默认CLEAR_TASK清当前页面；没有自动请求固定桌面图标，用户可长按应用使用/拖出。模式请求仅本Activity横屏，主游戏就绪前保留官网登录和浏览UI；已通过受限端口确认画面模式后隐藏工具栏/地址/系统栏，返回键退出恢复浏览与系统自动方向。
- 新ISOLATED game-view先验证现有官方main播放器和父帧链，临时CSS只显示游戏区域、按舞台尺寸居中等比适配，resize重算；所有自有属性/旧inline style记录后可恢复。退出/替换/页面关闭/端口断开清理；无src读取/参数复制/页面重载/认证重放。父链不可访问时保留浏览界面。官网实际CSS/触控与第三方HTML活动弹层效果仍需用户验收。
- README重写为简介、安装、使用、当前限制、反馈入口；旧段落完整迁docs/readme-history.md并标明历史，构建/调试迁docs/development.md，修正迁移后的相对链接。当前README不再有提交号/Socket参数/构建流水；许可尚未准备完成，不称已完成开源发布。
- Node47项通过（新增6项含适配/还原、幂等/替换、父链拒绝、部分失败回滚、未就绪等待和失败不隐藏UI）；JVM13/lint/主包及测试包最后构建50s通过（首版53s），签名/完整原版Ruffle校验通过；APK SHA256 `e5338cfaba2a3d4afcdf64e3bbd8cb3d0c58a89bb4ed29a82a46697798464f78`。新增Android用例读取真实动态shortcut并启动，验证横屏/保留session/无新增导航/返回恢复；CI增加为5项独立进程用例，隔离API37/x86_64模拟器5项均OK(1test)：新shortcut6.653s、Flash/关联窗口8.882s、seed8.543s、重启Cookie4.973s、声音7.01s。原版Ruffle逐字节未变。
- 验证失败/限制：首轮shortcut用例51.373s因onNewIntent更新Intent后ActivityScenario生命周期过滤失配，close阶段等待DESTROYED失败；测试结束前恢复fixture原启动Intent后完整重跑5项通过，产品仍保留正确onNewIntent行为。额外RDP页面注入展示探针在执行前被自动审批拒绝，仅返回blocked by policy，未执行/未换写法重试；因此官方父帧CSS、缩放触控仍由用户验收，不能以Node模型替代真机。
- 0.1.16已推送22c00c5并安装，但用户尚未反馈礼包结果。当前首次进入游戏/目录/zone6双向连接已确认；活动、移动/战斗、声音、横屏模式还不能以构建通过当完成。下一步完成模拟器验证后覆盖升级，用户点横屏游戏验收，直接读文件，不截图。
- 已adb install -r覆盖安装Success，包查询确认0.1.17/code18，保留数据；已请求用户点横屏游戏确认画面与触控，等待真机验收。确认AVD为TimeCasketProbe后仅关闭本次隔离模拟器。README、迁移文档相对链接均核对无缺失。


## 历史0.1.16：进入游戏已确认，修复活动exbn跨域遗漏（2026-10-18）

- 用户0.1.15明确“确实进去了，然后ioerror，点不了礼包啥的”。首次进入游戏界面已有用户确认，不把此前选服未知继续当当前状态；移动/战斗、礼包和声音仍未通过。真机zone6:443（endpoint7）连接成功并首发/首收，验证统一编号规则不是仅补5/7。无panic/AVM2分类错误，traceErrors0；浏览器表长度探针旧100上限返回null只是探针边界，不是配置缺失。
- 当前CORS错误提取到3个公共activity/script/*.exbn，HEAD分别200/octet-stream/1004、1036、822bytes且无ACAO；LittleAngelofCivilization、ROCOLegendBook、SuperHand。两个旧activity/4271/s4271.swf、4291/s4291.swf公开404/HTML（162/564bytes），不伪装成功/替换资源。缓存版本清单exbn检索0，证据来自真机实际请求+公开HEAD。
- 0.1.16/code17、兼容1.3.6统一在activity目录允许exbn后缀且严格二进制200，复用原适配函数；不放开其他目录exbn、404/HTML、认证或既有跨域策略。不改桥/Ruffle/声音/系统网络。新的边界测试先RED（旧规则拒绝该200脚本）再GREEN，Node41、JVM13、lint及主包/测试包构建通过49s；签名及完整官方Ruffle资源核对通过，SHA256 `e339515553d0e947941c23c3d9f015fc4df48d349f73841070b8a4c06c75f962`。未重复模拟器样例，本轮仅资源类型策略与版本变更；上版大表/Ruffle回调证据不能代替礼包验收。
- 下一步用户进入游戏后点击原礼包，直接读日志并检查这3项读取/错误变化；IOError并不全等于CORS，已知404与其余活动/脚本交互仍需分别验证。首页声音浮窗仍是后续待办，不重复要求用户测试已可听的独立提示音。
- 已adb install -r覆盖安装Success，包查询确认0.1.16/code17，保留数据；已请求用户进入后点击原礼包复测，等待实际活动效果。用户另澄清电脑版Edge也不行，仅用户报告，不据此认定与当前同因；未访问其电脑浏览器数据。


## 历史0.1.15：选服已通过，统一编号区服规则（2026-10-18）

- 用户确认0.1.14“现在可以选服务器了，但是进不去”。真机文件证明dir端点0连接成功、首发/首收，最终sent139/received216；列表已有人机验收证据，区服进入仍失败。只读主游戏无panic/AVM2分类错误；缺桥计数增长，严格提取仅zone5/zone7:443，不输出原始日志/认证/包。
- 用户进一步明确要求统一zone*，不接受逐个补。公开已缓存LoginPlugin.as connectSvr按roomZoneID拼zone{0}.17roco.qq.com；RoomData及目录读取为uint32。原版Ruffle0.7.1只严格匹配host+port，不支持真正通配。0.1.15/code16、兼容1.3.5实现原生规范数字zone1～65535规则，浏览器lazy展开同范围精确映射并缓存；没有逐个维护5/7，没有修改Ruffle。65535是资源上限，不冒充协议范围/无限通配。
- 原生配置仍只传两个bootstrap能力URL，新增maxZone；JS验证同一能力根和固定上限。生成表不发DNS或连接，实际Flash选服才连接443；原有能力/官方Origin/公网DNS验证/限流不变。endpoint dir0/stat1/zoneN=N+1，zone总量固定类别，数据原样转发不解析/记录。旧浏览器WS计数可能因顶层路由为0，原生分层日志为准。
- Node40项通过，含规范编号/界限/伪域名拒绝、65537条lazy表重复读取缓存、正确能力URL、数值配置/能力根拒绝；单次本地Node展开约9ms（不是手机/Wasm耗时）。JVM13项通过，含zone1/5/7/65535各100000字节往返及端点/总量核对；lint、主包/测试包构建49s通过，签名和完整原版Ruffle资源核对通过。APK SHA256 `579e2dab06b232f7b321b8439ba21b13317fbe1adfc894550afd32b38f5a50a4`。隔离API37/x86_64模拟器：原创Flash先执行，再用当前socket-config生成大表重载同一原创样例，count/loadedCount均65537，生成11ms、至FSCommand403ms、resolved/executed均true；这是预热样例，不是官网冷启动/选服/地图证据。临时RDP转发已清理，未操作真机官网。
- 一次临时只读提取脚本端口变量覆盖，清理报错；已修正、移除遗留调试转发并重跑成功。无截图/系统设置/代理变更。下一步安装本版后由用户选服，直接读endpoint与资源阶段；地图/官网音乐/首页声音浮窗仍未验收。
- 已adb install -r覆盖安装Success，包查询确认0.1.15/code16，保留数据；已请求用户进入选服并点击区服，等待真实进入结果。未代办真机页面操作。已确认隔离AVD名为TimeCasketProbe后仅关闭本次模拟器。


## 历史0.1.14：由官方首页创建连接，保留二进制realm（2026-10-18）

- 0.1.13已安装并推送07ce132，用户已到卡点，**选服仍失败**：iframe allow实际存在，但子帧loopback权限仍denied，dir attempt1/error1/close2，无socket-open。此前“修复”只能指代码尝试，不是验收通过。官网各层document.domain=qq.com，中间声明src=graph、实际游戏web2；release源码继承策略会考虑这些因素，不能把允许声明存在当权限生效。
- 同一真机游戏调试上下文，用顶层官方原生WebSocket构造器（含保留原newTarget的Reflect.construct）访问无效本地能力路径，两次均到达原生socket-rejected；均为开发者探针，未发上游TCP/游戏包。原生无9号回调，未人工改浏览器/系统权限。另用Windows仅回环固定原创4字节WS服务+临时ADB reverse独立验证：foreignBefore=true、localAfter=true、bytesMatch=true；随后关闭本地服务，清理reverse/forward，恢复调试器顶层。
- 0.1.14/code15、兼容扩展1.3.4：socket-config只为两个逐字匹配的App能力URL，选择可访问且精确HTTPS官方首页/default的WebSocket构造器，保留原newTarget/原生Socket；其他URL/来源/不可访问顶层保持原行为。最先注册capture监听器，外realm ArrayBuffer复制进游戏realm后交原监听器，供gloo-net的instanceof检查，数据不解析、不记录。撤掉0.1.13无效的iframe委派脚本与对应测试，不扩大graph/局域网授权，不改认证或代理。保留原生限定官方的回环权限回调。
- Node38项通过，新增精确能力/来源/不可访问回退，以及外realm二进制内容与类型回归；JVM12项、lint及主包/测试包完整构建通过53s；签名和完整官方Ruffle资源核对通过，APK SHA256 `04d06b3f8b48cf1508820a09547b80bc6bb64a6cea7fed81d120dc1062591d82`。未重复上版本地模拟器样例；本轮额外完成上述真机独立二进制测试。用户新增反馈：首页每次仍弹“点击开始声音”且感觉无效，已记录；按用户当前要求先选服，声音浮窗/官网音乐仍未修复验收。基础浏览器和Flash试听此前有人耳有声证据。
- 下一步覆盖升级后由用户到卡点，直接读私有日志app-version15后的真实目录Socket/TCP/首次收发结果；服务器列表、地图与官网声音仍需用户分别验收。
- 已adb install -r覆盖安装Success，包查询确认0.1.14/code15，保留数据；已请求用户再次进入卡点，未自动打开/刷新/认证/点击游戏。当前等待本版真实目录连接日志。


## 最新持续授权

用户明确“安装可以允许你，不要问我了，结果我帮你验证”：后续本项目APK覆盖升级可直接执行，保留数据，不再逐次询问。系统设置、root、卸载/清数据不在此授权内。仍不截图、不自动代办网站验证；本地调试不等待云端检查。下文历史待授权描述以本条为准。

## 历史0.1.13：修复官方跨域游戏帧的回环权限（2026-10-18）

- 0.1.12已安装并推送7b84f88。用户进入卡点后，真机私有文件直接读回成功：phase-login1，dir-ws-attempt1/error1/close2，无socket-open/TCP结果。当前失败在浏览器到本地桥，尚未到目录回包；声音两种试听此前已获用户确认有声，官网音乐仍未验收。
- 主播放器/global配置与浏览器失败消息使用同一有效回环端口；ADB临时转发后本地无效能力握手被正确拒绝，原生写socket-rejected（仅开发者本地探针，不是游戏请求失败，不发上游TCP，转发均清理）。/proc/net/tcp6读取被拒；ss有限元数据显示该端口监听。全局代理字段为空且连接元数据未发现HTTP代理，不能据此概括所有VPN/TUN因素，设置未修改。
- 根因证据：调试器选择游戏frame后只读查询，secureContext=true，loopback-network/local-network都denied；顶层官网则prompt。子帧本地WS和HTTP诊断均失败；无本机权限回调9，因为iframe默认未委派。MDN文档确认跨域默认self限制，详见networking.md。调试frame选择最后恢复顶层，无网页导航/刷新/登录/截图；探针不保留URL/能力/认证正文。
- 0.1.13/code14、兼容扩展1.3.3新增loopback-delegation：仅官网17roco来源，在当前/新iframe上补两个精确官方来源的loopback-network指令；不改src或认证、不用通配符、不覆盖显式站点策略、不授权graph或local-network局域网权限。原生只为官方首页/default或web2的LOCAL_DEVICE_ACCESS请求返回ALLOW，桥的能力路径/Origin/目标/DNS策略不变。自动播放行为不改。
- 已验证Node38项（含动态iframe、显式deny保留、受限来源及不修改其他allow）、JVM12项（含回环权限范围/拒绝局域网）、lint及主包/测试包完整构建54s。APK签名和完整官方Ruffle资源核对通过，SHA256 `03623c61af4833d4fa64ce44dc186077a4633171f6bc6e6d1cf8eb317b17b84e`。未重复上版本地固定样例模拟器测试，它们不能验证官网跨域帧权限。下一步由用户重新进入卡点，直接看loopback-allowed→socket-open→connect结果→首个收发，不能把权限修复当服务器列表或地图验收。
- 已adb install -r覆盖安装Success，包查询确认0.1.13/code14，保留数据；未代用户打开官网/刷新/认证或点击游戏。已请求用户进入原卡点，等待本版实际权限和连接结果。

## 历史0.1.12：私有文件日志与选服连接分层诊断（2026-10-18）

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
