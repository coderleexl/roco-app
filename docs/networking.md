# HTTP资源与TCP选服对照

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
