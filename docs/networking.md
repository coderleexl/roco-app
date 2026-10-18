# HTTP资源与TCP选服对照

## 0.1.20：活动IOError主因转向CGI来源不匹配

0.1.19实际IO计数至少12；用户点三个活动，NetworkWatcher记录ui4292/ui3760/ui1931均304，地图/NPC1989资源请求有四次404。只取元数据，关闭正文保存，未导出Cookie/headers/body/查询。304本身只是缓存校验，另一次静态观察可见非零contentSize，不能将304当空文件或批量坏缓存。旧3个静态404仍真实，但不能解释全部礼包IO。

脱敏提取器扩展到“官网game-cgi”类别后发现14次（随后15次）CGI CORS；原提取器只列res路径造成盲区。公开无认证HEAD：ifrit_challenge/back_player_guide/online_present/star_tower_new/mini_game_manage/vip_tab_state均200/text-xml、ACAO固定https://res.17roco.qq.com、ACAC=true；附带web2或首页Origin不改变结果。游戏JS页面origin为web2，并非SWF资源res。公开活动UI的CGI.errorHandler对ioError事件弹网络故障，UI配置与观测的ifrit/back_player等对应；不是目录Socket故障。HTTP原状态在部分缓存CORS文字里未提取到，不冒充用户请求状态已逐项读取。

新增同源传输的8个GET端点：online_present、mini_game_manage、vip_tab_state、star_tower_new、star_tower_exch_shop、ifrit_challenge、back_player_guide、zombie_coming（后者来自本次ui1931公开代码）。首页原fetch/Request发送原游戏URL，返回流包装为游戏realm Response。现有服务器CORS保留，认证/隐私/防沉迷接口及POST保持原路径；不扩大到所有cgi，不转发到任意主机。原文和查询不进日志，只计http-bridge-attempt/complete/failed/unavailable。跨域问题在此有证据，仍不能认定其余IOError全是跨域。

## 0.1.18实机活动复测与0.1.19诊断

用户确认IOError在点击礼包/活动后出现。目录与zone5（endpoint6）连接并首发/首收；主游戏无panic/AVM2分类错误，不能归责代理或目录桥。ROCOLegendBook/SuperHand/LittleAngelofCivilization三个exbn资源实机performance条目均200、75/76/75ms，原相关CORS错误已消失。残留重复CORS路径仅activity/4271/s4271.swf、4291/s4291.swf；本次公开HEAD均404/text/html/564B。对应ui电影公开200、665976/1542587B，缓存ver.config也只列ui；ui4271包含roco_restaurant相关控制类，并非纯图片壳，但s入口契约未知，不作未经验证的重定向或假200。不是所有礼包错误的完整证明，仍需具体名称与新计数对应。

0.1.19新增主游戏ioErrors/httpErrors固定分类和phase-io-errors/phase-http-errors文件数字计数，覆盖IOError/IOErrorEvent和loader trace http code:4xx/5xx；不导出原文、URL、认证或请求数据，不改变HTTP适配范围/网络设置。两次后续RDP只读活动明细遇EOF并清理临时forward；此前资源200和404已有独立证据，EOF不作为资源失败证据。

## 0.1.16：已进入游戏，活动IOError分层

用户确认0.1.15确实进入游戏，随后IOError且礼包等点不了。真机zone6（endpoint7）依次open/connect/first-send/first-receive，证明统一规则覆盖并非只补5/7。游戏无panic/AVM2错误分类，traceErrors0；Socket缺桥仍仅原有非公网9000日志器，不为其放开内网。

游戏CORS错误中精确公共路径与无认证HEAD证据：activity/LittleAngelofCivilization/script/LittleAngelofCivilization.exbn=200/application/octet-stream/1004B，activity/ROCOLegendBook/script/ROCOLegendBook.exbn=200/application/octet-stream/1036B，activity/SuperHand/script/SuperHand.exbn=200/application/octet-stream/822B，均无ACAO。activity/4271/s4271.swf与activity/4291/s4291.swf官网404/text/html，分别162/564B；404不是通过添加允许头修复的资源。缓存ver.config检索activity/*.exbn为0，规则依据是真机请求和当前公开响应，不虚称清单证据。

0.1.16只把activity公共目录的exbn/二进制200响应纳入既有适配函数，其余路径、来源、方法、状态和现存策略边界保留。没有改区服桥或解析游戏包，不下载/分发活动资源。下一步用户重进后再次点击原礼包，看三项请求能否正常被Flash读取，再区分404缺文件或其他脚本实现问题；不能因规则和构建通过认定所有礼包已可用。


## 0.1.15：目录已通，统一覆盖编号区服

用户确认0.1.14能选服务器但进不去。真机目录服endpoint0依次socket-open/connect-start/connected/first-send/first-receive，最终发送139/接收216字节，随后EOF；用户可见列表是本阶段额外验收证据。只读console固定正则提取到缺桥目标zone5.17roco.qq.com:443、zone7.17roco.qq.com:443，无AVM2分类错误/panic。公开缓存LoginPlugin.as:330按roomZoneID拼接zone{0}.17roco.qq.com，字段由公开RoomData/read方法定义为uint32。

用户明确希望统一zone规则，不再逐个补。原版Ruffle0.7.1 connect_socket严格比较host+port，host填zone*无效。0.1.15以受限数字域名规则统一原生桥，浏览器按需展开zone1～zone65535的精确映射；这不是官方编号上限，也不是无限通配。bootstrap能力前缀与端口保持同一进程配置，生成映射本身不发DNS/端口探测；仅Flash实际选择目标才通过既有能力路径连接443，所有解析地址仍须公网。未知其他端口、任意IP/其他域、编号0/前导零/超范围均拒绝。超65535若真出现应记录为未支持，不能宣称所有理论uint32编号均覆盖。

临时只读缺桥提取脚本首次误复用了forward端口变量并遗留统计打印，目标证据已提取但清理报错；随后修正、清理本次遗留调试转发并重跑成功。未刷新/登录/点击游戏，不截图，不保存原始console、认证或数据包。下一步在用户点击区服后观察endpoint=zone编号+1的真实TCP/首收发，再判断加载资源与地图。


## 0.1.14：官网首页创建固定回环连接

0.1.13真机复测失败：当前官方iframe均已有精确allow指令，但游戏仍loopback-network=denied，dir attempt1/error1/close2，无socket-open。官网根/中间/游戏文档均已将document.domain放宽为qq.com，中间iframe的声明src为graph，而实际文档已到web2。Firefox release的PermissionsPolicy/HTMLIFrameElement源码显示容器策略按声明src和考虑document.domain的principal继承；这解释为何仅追加精确URL来源不足，但本轮不再扩大OAuth帧授权或改认证src。

同一游戏调试上下文，只对无效本地能力路径使用顶层官方WebSocket构造器，原生桥两次正常收到并拒绝。它们是开发者诊断握手，无上游TCP/游戏包，不当游戏成功。另起Windows仅回环固定字节WS服务，经临时ADB reverse连接，真机收到原创4字节：原数据跨realm、复制后游戏realm的ArrayBuffer检查通过且字节完全相同。所有临时转发/反向转发清理，未修改系统代理/TUN/网络设置。

正式修复只对原配置两个完整能力URL逐字匹配，且顶层是可访问官方HTTPS首页/default，使用该顶层原生构造器；所有其他请求保留原行为。最先注册capture监听器，将外realm ArrayBuffer复制到本realm后交给原有Flash监听器，内容不解析、不落日志。0.1.13的iframe allow脚本已移除，桥的官方Origin/固定目标/DNS限制不变。下一步仍按真实socket-open→connect→首次收发→用户服务器列表验证。


## 0.1.13：跨域游戏帧缺少回环委派

0.1.12真机文件直接读回：phase-login1、dir-ws-attempt1/error1/close2，未见socket-open。播放器/全局配置与失败WS使用同一回环端口。ADB转发到该端口后用无效能力路径发出本地握手，服务正常拒绝并写socket-rejected；这是开发者本地探针记录，不是游戏连接遭拒，也未触发上游TCP。设备全局代理字段为空，连接元数据未发现HTTP代理，但未据此排除其他网络因素。

切换调试器选中游戏帧（未导航页面）后读取到secureContext=true、loopback-network/local-network均denied；顶层官网两者prompt。符合[Mozilla本地网络权限文档](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access)的跨域iframe默认self限制。游戏帧的本地WS及无效能力路径的本地HTTP探针均失败，原生桥未收到；不再把该失败当目录服务器回包问题。

0.1.13在官网17roco来源的现有/动态iframe上，仅追加 `loopback-network https://17roco.qq.com https://web2.17roco.qq.com`，不改src/认证参数、不使用通配符、不给graph等第三方来源授权，已有显式loopback策略保留。原生只对官方首页/default或web2的LOCAL_DEVICE_ACCESS请求允许；不授予LOCAL_NETWORK_ACCESS，不禁用全局安全机制。需要用户重新进入使iframe按新配置加载，再按loopback-allowed→socket-open/connect/收发核对；修复此门槛不等于有效目录登录或完整游戏通过。

## 0.1.12分层连接日志

0.1.11实测已经到Login.initialize，推荐/列表trace计数3；当前内存诊断有bridge-ready/game-frame-ready，但没有TCP连接结果记录，不能认定已连目录服。0.1.12只观察精确回环能力路径的dir/stat WebSocket构造及open/error/close计数，不输出URL、能力路径或异常正文。计数经已验证content port传给原生诊断。桥新增open/connect-start、DNS失败/非公网地址拒绝/超时/拒绝连接、首次发送/接收及结束总字节数；字节数不含数据内容。

`dir-ws-attempt`有增量但无`socket-open`：检查浏览器至回环桥（含内容权限/握手），还不能归责远端。`socket-open`后连接错误：看固定错误类别。`socket-connected`/`socket-first-send`有而无receive：只证明TCP/写入，未证明目录回复/有效认证。收到字节但无列表再查Flash处理/官方拒绝界面，不解析或持久化认证包。新增content-permission只记录权限编号，未增加自动授权，也未放开目标/端口/内网地址或修改代理设置。

## 0.1.10刷新后只读证据 / 0.1.11下一步

用户反馈连接弹窗消失但仍无服务器。主游戏配置有2个Socket桥，AutoExec/Login插件也HTTP200；没有AVM2错误分类或panic。唯一缺桥告警目标是非公网IPv4:9000；公开main.swf的SocketLogger含对应静态目标及stat:9000握手字符串，故该条更可能是日志连接，不能据此认定dir:443阻塞，不新增内网9000目标。0.1.11按公开主SWF/Login插件的固定trace文本记录配置完成、登录插件initialize、推荐/列表请求及错误类别计数；不记录trace原文、账号、请求参数或票据，也不将logLevel升到info。下一次用户加载后据阶段增量确认是否真正到达目录连接；未知区服仍未开放，不能归咎用户代理。

## 当前0.1.10实现

用户要求修复后，选择保留现有浏览器/Flash集成，新增应用内WebSocket→TCP桥；更换原生引擎会同时影响渲染/页面/窗口/会话，当前不切换。GameSocketPolicy目标仅公开Global.xml明确的dir.17roco.qq.com:443与stat.17roco.qq.com:443；未知编号区服和任意IP尚未允许。官方Flash自身负责所有握手/登录/包内容，桥只透传二进制，不自动选服或实现Python协议。没有移植第三方辅助源码。

桥仅回环监听、随机端口与进程内随机能力路径，校验官方Origin/Host，DNS地址须为公网且直接使用已验证地址连接。连接/队列/帧大小有限制，数据和能力不落盘、不输出原文/URL。Native回传的JSON文本由背景脚本解析后动态注册web2的MAIN配置，并在ready后才允许首次导航；本地模拟器已验证初始化不会卡住。它不修改用户的HTTP代理/VPN/TUN/系统路由，不等同于用户所说的网络代理，也不绕过官网登录。

已通过本地100000字节二进制往返和拒绝来源/能力的JVM测试，以及完整APK校验、三项模拟器样例。**真实官网至回环WebSocket的浏览器策略、目录TCP连通性、有效登录/服务器列表、区服/地图仍待用户操作验证。** native日志的socket-connected只代表TCP连上，不能作为登录通过。下一步按证据读取Socket分类并补实际官方区服坐标，不泛化开放目标或把所有失败归为CORS。

以下保留0.1.9阶段对照；“未实现桥”等历史描述以本节为准。

用户2026-10-18要求对照已记录的Python项目；只静态阅读原有缓存，不继续拉取/运行，不移植认证代码。

| 阶段 | 时光匣实际证据 | Python参考实现 |
|---|---|---|
| 官方认证 | 用户能扫码返回加载，游戏有效登录状态未验证 | qq_login.py沿QQ OAuth取得游戏凭据，不是永久免密 |
| 静态资源 | 0.1.8主SWF、ver.config、Global.xml、Angel.config、基础类库和Effect插件均200 | 协议客户端不加载Flash，不能证明Ruffle兼容 |
| 首页预加载器 | 首页来源的preloadlist.xml/ver.config仍被CORS拦截，同名版本文件在web2帧已200 | 0.1.9补精确首页资源对；公共预加载清单不是目录服API |
| 目录服/选服 | 当前还没有明确Socket调用/失败证据，选服未出现 | game_sessions.py用原生TCP连接dir.17roco.qq.com:443，发送tgw_l7_forward握手，再请求推荐房间并自动选服 |
| 区服/场景 | 未验证 | 随后TCP连接zone编号域名/返回房间地址，初始化、进入房间并心跳；代码未启用TLS，443端口不等于HTTPS |

参考：[固定提交连接实现](https://github.com/hungryami/roco-autobank/blob/2d88f835263196095c8faf6ba4a30c27e80001f2/src/roco_mine_mini_service/game_sessions.py#L1563)、[登录实现](https://github.com/hungryami/roco-autobank/blob/2d88f835263196095c8faf6ba4a30c27e80001f2/src/roco_mine_mini_service/qq_login.py)。没有接入或执行该项目。

ACAO只处理浏览器HTTP响应可读性，不能生成游戏登录状态或创建原生TCP能力。不能为“全加跨域”修改QQ认证、Cookie、证书校验或任意目标策略。当前不新增网络架构。

## 0.1.9实测补充：不能直接归因于用户代理

2026-10-18用户报告服务器连接失败弹窗。只读主播放器配置确认 `socketProxy=[]`、`logLevel=error`，两个web2帧的引擎分类计数仍为0。固定[上游Ruffle0.7.1连接实现](https://github.com/ruffle-rs/ruffle/blob/v0.7.1/web/src/navigator.rs#L524)在没有匹配host/port的WebSocket桥时，以warn记录缺桥并立即返回失败。当前error日志级别会屏蔽该提示，因此现有0计数不是可靠的Socket否定证据；具体游戏调用/目标仍待采集。

Ruffle的Socket桥负责把浏览器WebSocket转换为游戏TCP；用户设备上的代理/VPN负责网络路由，两者用途不同。当前空桥配置是已确认的应用能力缺口。尚未进行代理开/关对照、也没有确认游戏数据已出站，故不能断言用户代理导致该弹窗，关闭代理也不能补齐缺失的桥。现有代理/TUN/VPS/系统网络设置均未修改。音频静音和自动播放阻止独立记录，不能用服务器弹窗解释声音问题。

首页preloadlist.xml/ver.config本次均200，主帧Global.xml/config/基础类库/Effect也均200。后续诊断需要解决warn可见性及原始日志隐私边界，再据实决定桥接或原生路线；不能继续只用HTTP跨域规则解释所有失败。

下一步：用户加载0.1.9后只读检查每游戏帧的引擎信号分类（Socket提及、缺代理、脚本错误码、未实现功能及固定格式官方Socket域名）。现有console缓存未提供有效子帧Socket诊断，计数0不是能力通过；新采集器用于补这个缺口，不存原始日志/URL/票据。

若实测证明Flash Socket/XMLSocket受限，再比较受限本地WebSocket→TCP桥与原生Ruffle，先说明架构范围。桥必须回环监听、限制官方目标/端口，不能成为开放代理；原生路线通常不再叠加浏览器桥。本轮未实现桥、未试探游戏连接、未发送认证或自动任务数据包。
