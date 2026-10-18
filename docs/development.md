# 开发、构建与调试

GitHub Actions 自动准备 JDK/SDK，你的电脑无需安装。开发者本地需要 JDK 17 和 SDK Platform 37.2 / Build Tools 36.0.0，在 `local.properties` 配置 SDK 路径：

```properties
sdk.dir=D\:\\Android\\Sdk
```

```powershell
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug assembleDebugAndroidTest
```

APK：`app/build/outputs/apk/debug/app-debug.apk`。云端同时生成 SHA256 校验文件。

构建会按 [版本锁](../third-party/ruffle.json) 下载并校验 Ruffle；GeckoView 158.0.20261007201254，Ruffle 0.7.1，AGP 9.2.0（内置 Kotlin，编译器固定 2.4.20），Gradle 9.4.1。无需 NDK。

## 安装与调试

设备写入需用户授权后执行：

```powershell
adb devices -l
adb -s <设备序列号> install -r app/build/outputs/apk/debug/app-debug.apk
```

Debug 构建启用 Gecko 远程调试，可在桌面 Firefox 的 `about:debugging` 连接；Android USB 调试和调试授权必须由用户允许。不要导出原始 HAR、Cookie、控制台日志或带票据的 URL。内置诊断只记录脱敏元数据，不截屏。

不同 CI 运行的临时 debug 签名可能不同；升级若出现签名冲突，**不要直接卸载**，卸载会清空登录状态，先确认是否保留数据。原型不发布 Release，也不使用长期签名密钥。


开始修改前阅读[协作约定](../AGENTS.md)、[交接](handoff.md)与[兼容性](compatibility.md)。项目已有的持续授权见交接；保留本地IDE生成配置，提交时显式选文件。
