# HTTP资源与TCP选服对照

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

下一步：用户加载0.1.9后只读检查每游戏帧的引擎信号分类（Socket提及、缺代理、脚本错误码、未实现功能及固定格式官方Socket域名）。现有console缓存未提供有效子帧Socket诊断，计数0不是能力通过；新采集器用于补这个缺口，不存原始日志/URL/票据。

若实测证明Flash Socket/XMLSocket受限，再比较受限本地WebSocket→TCP桥与原生Ruffle，先说明架构范围。桥必须回环监听、限制官方目标/端口，不能成为开放代理；原生路线通常不再叠加浏览器桥。本轮未实现桥、未试探游戏连接、未发送认证或自动任务数据包。
