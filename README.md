# 时光匣

0.1.14改为仅对App配置中两个精确回环能力URL，使用可访问的官方首页WebSocket构造器创建连接；其他连接保持原行为。二进制回包复制到游戏页面自身的ArrayBuffer，兼容Ruffle/gloo-net的跨realm类型检查。0.1.13的iframe委派在真机仍失败，已撤掉该脚本；不扩展OAuth来源权限，不改认证地址。真机独立本地二进制探针已完整往返，真实目录登录/选服仍待复测。

Kotlin + GeckoView + 内置 Ruffle 的 Android 网页/Flash **兼容性验证工具**，当前以洛克王国官网验证。独立项目，不是腾讯官方客户端，不承诺完整游戏兼容。保留完整官网环境和官方登录，不采集账号密码。

历史0.1.13曾尝试补充回环权限（真机复测失败，委派脚本已在0.1.14撤回）：官网中的iframe只向官方17roco/web2来源委派loopback-network，原生只处理这两个官方页面范围的本机回环请求。没有授权local-network局域网权限。此前真机已确认游戏帧回环权限denied、首页prompt，本地桥端口正常；目录服与服务器列表效果待用户复测。

0.1.12按用户要求自动保存Debug脱敏日志到应用私有 `files/diagnostics/events.jsonl`，轮换保留前一份，各128KiB；只写时间、固定类别和数字，不写URL或数据包。新增浏览器WebSocket、原生TCP及加载阶段计数，可直接通过ADB读取，无需打开诊断弹窗。0.1.11两种试听已获用户确认有声音；官网音乐与服务器列表仍未通过验收。

0.1.11把顶栏刷新改为“刷新游戏”：只调用当前官方主播放器的 Ruffle 重载接口，保留外层官网页面；没有就绪游戏时提示，不自动整页返回主页。新增独立子窗口“声音测试”，可分别试听浏览器和原创 Flash PCM 提示音，关闭子窗口返回游戏。补充只保存固定阶段计数的加载诊断；服务器列表、真实声音和刷新后的官方会话/选服仍待用户验收，详见交接记录。

0.1.10针对0.1.9仍静音和服务器连接失败加入修复：官网真实触摸后恢复挂起的WebAudio，并为公开Global.xml明确列出的目录服/统计服提供应用内WebSocket→TCP桥。桥仅回环监听、固定官方目标与443端口，数据只在内存转发；未知区服尚未接入，选服/地图和真实声音仍需用户验收。验证与安装状态见 [交接记录](docs/handoff.md)。

0.1.5采用「时光匣」显示名称和原创“打开的匣子＋像素光点”图标。品牌源文件、命名清查状态及开源许可待办见 [品牌说明](docs/branding.md)。沿用原applicationId与签名，覆盖升级保留数据；功能验收仍按兼容性记录进行。

0.1.6将逐文件的跨域适配统一为公共静态资源规则：按官网公开Global.xml中的目录、来源和文件MIME筛选，覆盖符合条件的动画/类库/配置/素材。真机已确认ver.config成功，当前卡在Global.xml；新版效果待用户复测。保留原有浏览器数据，不提取登录票据、不自动反复扫码，官方登录恢复仍待验证。规则与限制见 [架构说明](docs/architecture.md)。

0.1.6真机已通过Global.xml、Angel.config和两个基础类库加载，后续Effect插件目录遗漏已定位。0.1.7依据公开版本清单补齐plugins/activity/apps/video的类型规则；选服、地图和完整游戏仍待用户验证。

0.1.8在官网范围内请求Ruffle自动播放，保留正常声音触摸限制，遮罩是否消失待用户验证。整页刷新回登录已发现官网入口/退出逻辑，尚未修改它或实现真正的官方会话恢复。后续辅助项目仅记录于 [参考清单](docs/references.md)，当前不移植第三方辅助代码。

0.1.8已确认自动播放配置生效、Effect加载，但音频启动被浏览器阻止、选服仍未出现。0.1.9增加官方页面的自动播放权限处理、首页预加载配置适配和不保存原始日志的引擎诊断；声音与选服结果待用户验证。HTTP跨域和TCP选服对照见 [联网记录](docs/networking.md)。

2026-10-18：提交 `ba84be2` 已通过 [GitHub 构建与三项模拟器测试](https://github.com/coderleexl/roco-app/actions/runs/39091368510)，包含真实 Flash 回调、关联窗口和进程重启后的测试 Cookie 保留。自检使用普通 WebGL；官网默认渲染、账号登录与完整游戏仍待真机验证。

已验证版本：[下载 Debug APK 压缩包](https://github.com/coderleexl/roco-app/actions/runs/39091368510/artifacts/12122389419)（需要登录 GitHub），解压安装 `debug/app-debug.apk`。

本地构建也已成功，主 APK 已经用户授权安装到魅族 21；官网和游戏流程等待用户真机验证。继续开发先读 [开发交接](docs/handoff.md) 和 [协作约定](AGENTS.md)。

当前专项本地调试，不等待云端检查。真机0.1.2已确认preloader/main加载执行；下一处“版本文件加载失败”定位为公开ver.config跨域拦截，0.1.3已补充这一精确文件并通过本地测试、构建和校验。免密恢复优先使用既有官方浏览器会话，真实登录保持时长和重开恢复仍待用户测试；不保存密码或认证URL。最新安装/测试状态见 [交接记录](docs/handoff.md)，完整游戏流程仍未通过验收。

主页黑屏只剩“开始”的0.1.3反馈已定位为另一个动态动画文件ROCO-Z8_Ceil_3.swf跨域拦截；0.1.4补充该精确文件。主页视觉恢复与0.1.3版本配置修复效果分别等待用户验证，不能混为已通过的游戏流程。

## 不装 SDK，直接下载 APK

1. 打开 [GitHub Actions](https://github.com/coderleexl/roco-app/actions/workflows/android.yml)。
2. 选择最新的绿色运行，在 Artifacts 下载 `roco-debug-<commit>`（GitHub 下载 artifacts 需要登录）。
3. 解压后安装 `debug/app-debug.apk`。**不要安装 androidTest APK**，那是模拟器测试程序。
4. 点开 App，等待 Ruffle 初始化后显示官网。登录、验证码、实名、防沉迷由你在官方页面完成。

顶栏可横向滚动：官网、返回、刷新游戏、关闭子窗口、桌面/手机、诊断、声音测试、自检。登录关联窗口可以独立关闭；声音测试和自检均使用本地原创样例，并不是洛克王国。桌面/手机切换仍会重新加载网页，不是游戏刷新。

**绿色构建不代表游戏登录、选服或战斗已经通过。** 当前证据和待验证项目见 [兼容性记录](docs/compatibility.md)。

## 构建

GitHub Actions 自动准备 JDK/SDK，你的电脑无需安装。开发者本地需要 JDK 17 和 SDK Platform 37.2 / Build Tools 36.0.0，在 `local.properties` 配置 SDK 路径：

```properties
sdk.dir=D\:\\Android\\Sdk
```

```powershell
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug assembleDebugAndroidTest
```

APK：`app/build/outputs/apk/debug/app-debug.apk`。云端同时生成 SHA256 校验文件。

构建会按 [版本锁](third-party/ruffle.json) 下载并校验 Ruffle；GeckoView 158.0.20261007201254，Ruffle 0.7.1，AGP 9.2.0（内置 Kotlin，编译器固定 2.4.20），Gradle 9.4.1。无需 NDK。

## 安装与调试

设备写入需用户授权后执行：

```powershell
& 'D:\workspace\platform-tools-latest-windows\platform-tools\adb.exe' devices -l
& 'D:\workspace\platform-tools-latest-windows\platform-tools\adb.exe' -s 461QYGDN225SM install -r app\build\outputs\apk\debug\app-debug.apk
```

Debug 构建启用 Gecko 远程调试，可在桌面 Firefox 的 `about:debugging` 连接；Android USB 调试和调试授权必须由用户允许。不要导出原始 HAR、Cookie、控制台日志或带票据的 URL。内置诊断只记录脱敏元数据，不截屏。

不同 CI 运行的临时 debug 签名可能不同；升级若出现签名冲突，**不要直接卸载**，卸载会清空登录状态，先确认是否保留数据。原型不发布 Release，也不使用长期签名密钥。

更多：[架构](docs/architecture.md) · [复现](docs/reproduction.md) · [测试](docs/testing.md) · [排障](docs/troubleshooting.md) · [第三方许可](third-party/NOTICE.md)
