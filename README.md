# 洛克王国 Android 兼容性验证原型

Kotlin + GeckoView + 内置 Ruffle 的**验证工具**，不是腾讯官方客户端，不承诺完整游戏兼容。保留完整官网环境和官方登录，不采集账号密码。

2026-10-18：提交 `ba84be2` 已通过 [GitHub 构建与三项模拟器测试](https://github.com/coderleexl/roco-app/actions/runs/39091368510)，包含真实 Flash 回调、关联窗口和进程重启后的测试 Cookie 保留。自检使用普通 WebGL；官网默认渲染、账号登录与完整游戏仍待真机验证。

已验证版本：[下载 Debug APK 压缩包](https://github.com/coderleexl/roco-app/actions/runs/39091368510/artifacts/12122389419)（需要登录 GitHub），解压安装 `debug/app-debug.apk`。

本地构建也已成功，主 APK 已经用户授权安装到魅族 21；官网和游戏流程等待用户真机验证。继续开发先读 [开发交接](docs/handoff.md) 和 [协作约定](AGENTS.md)。

当前正在修复真机发现的根 SWF 跨域读取失败，0.1.1 的精确资源适配见 [交接记录](docs/handoff.md)；此前通过的自检不代表该修复或完整游戏已验证。

## 不装 SDK，直接下载 APK

1. 打开 [GitHub Actions](https://github.com/coderleexl/roco-app/actions/workflows/android.yml)。
2. 选择最新的绿色运行，在 Artifacts 下载 `roco-debug-<commit>`（GitHub 下载 artifacts 需要登录）。
3. 解压后安装 `debug/app-debug.apk`。**不要安装 androidTest APK**，那是模拟器测试程序。
4. 点开 App，等待 Ruffle 初始化后显示官网。登录、验证码、实名、防沉迷由你在官方页面完成。

顶栏可横向滚动：官网、返回、刷新、关闭子窗口、桌面/手机、诊断、自检。登录关联窗口可以独立关闭；自检页只是人工编写的小 Flash，并不是洛克王国。

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
