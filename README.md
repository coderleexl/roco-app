# 洛克王国 Android 兼容性验证原型

Kotlin + GeckoView + 内置 Ruffle 的**验证工具**，不是腾讯官方客户端，不承诺完整游戏兼容。保留完整官网环境和官方登录，不采集账号密码。

## 不装 SDK，直接下载 APK

1. 打开 [GitHub Actions](https://github.com/coderleexl/roco-app/actions/workflows/android.yml)。
2. 选择最新的绿色运行，在 Artifacts 下载 `roco-debug-<commit>`（GitHub 下载 artifacts 需要登录）。
3. 解压后安装 `debug/app-debug.apk`。**不要安装 androidTest APK**，那是模拟器测试程序。
4. 点开 App，等待 Ruffle 初始化后显示官网。登录、验证码、实名、防沉迷由你在官方页面完成。

顶栏可横向滚动：官网、返回、刷新、关闭子窗口、桌面/手机、诊断、自检。登录关联窗口可以独立关闭；自检页只是人工编写的小 Flash，并不是洛克王国。

**绿色构建不代表游戏登录、选服或战斗已经通过。** 当前证据和待验证项目见 [兼容性记录](docs/compatibility.md)。

## 构建

GitHub Actions 自动准备 JDK/SDK，你的电脑无需安装。开发者本地需要 JDK 17 和 SDK Platform 36 / Build Tools 35.0.0，在 `local.properties` 配置 SDK 路径：

```properties
sdk.dir=D\:\\Android\\Sdk
```

```powershell
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug assembleDebugAndroidTest
```

APK：`app/build/outputs/apk/debug/app-debug.apk`。云端同时生成 SHA256 校验文件。

构建会按 [版本锁](third-party/ruffle.json) 下载并校验 Ruffle；GeckoView 158.0.20261007201254，Ruffle 0.7.1，AGP 8.13.2，Gradle 8.13，Kotlin 2.1.20。无需 NDK。

## 安装与调试

设备写入需用户授权后执行：

```powershell
& 'D:\workspace\platform-tools-latest-windows\platform-tools\adb.exe' devices -l
& 'D:\workspace\platform-tools-latest-windows\platform-tools\adb.exe' -s 461QYGDN225SM install -r app\build\outputs\apk\debug\app-debug.apk
```

Debug 构建启用 Gecko 远程调试，可在桌面 Firefox 的 `about:debugging` 连接；Android USB 调试和调试授权必须由用户允许。不要导出原始 HAR、Cookie、控制台日志或带票据的 URL。内置诊断只记录脱敏元数据，不截屏。

不同 CI 运行的临时 debug 签名可能不同；升级若出现签名冲突，**不要直接卸载**，卸载会清空登录状态，先确认是否保留数据。原型不发布 Release，也不使用长期签名密钥。

更多：[架构](docs/architecture.md) · [复现](docs/reproduction.md) · [测试](docs/testing.md) · [排障](docs/troubleshooting.md) · [第三方许可](third-party/NOTICE.md)
