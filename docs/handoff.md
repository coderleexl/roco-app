# 开发交接（2026-10-18）

## 最新持续授权

用户明确“安装可以允许你，不要问我了，结果我帮你验证”：后续本项目APK覆盖升级可直接执行，保留数据，不再逐次询问。系统设置、root、卸载/清数据不在此授权内。仍不截图、不自动代办网站验证；本地调试不等待云端检查。下文历史待授权描述以本条为准。

## 最新0.1.8：省去Ruffle启动遮罩（待用户验证）

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
