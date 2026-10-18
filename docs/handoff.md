# 开发交接（2026-10-18）

## 最新待安装版本：0.1.2

- 用户在0.1.1报告：主页动画不全、可以扫码、扫码后再次Flash加载错误。不能把此前“可以了”视为登录通过。
- 只读Gecko帧/播放器检查与PageError定位：主页 `https://res.17roco.qq.com/preloader.swf`，以及官方web2页面的 `/main.swf`，均HTTP200缺少ACAO、播放器state0/无metadata。有独立公开HEAD证据：Flash MIME，大小9721/54455字节；未发现播放器panic。页面认证结果和具体失败弹窗文本尚未知。
- 0.1.2/code3、兼容扩展1.0.1仅增加上述两个精确公开资源。preloader沿用官网首页来源限制；main仅允许HTTPS精确web2.17roco.qq.com来源，认证页面路径不猜测。保留GET/XHR/200/Flash MIME及已有ACAO/ACAC跳过条件。不适配广告、不修改认证端点。
- 新回归先RED再GREEN；Node边界/隐私6项、JVM4项、lint、主包及测试包构建全部通过。签名和完整官方Ruffle资源校验通过。未在手机自动运行测试，不等待云端检查。
- APK：`D:\workspace\roco-app\app\build\outputs\apk\debug\app-debug.apk`；SHA256 `6a72102c3652316a27b8cafe79ce3812878484469bdf894a2263ba8433ed64bd`。当前手机仍为0.1.1，0.1.2尚未安装；需依协作约定取得本次升级许可，随后由用户刷新、扫码并复测。
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
