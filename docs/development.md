# 开发、构建与调试

GitHub Actions 自动准备 JDK/SDK，你的电脑无需安装。开发者本地需要 JDK 17 和 SDK Platform 37.2 / Build Tools 36.0.0，在 `local.properties` 配置 SDK 路径：

```properties
sdk.dir=D\:\\Android\\Sdk
```

```powershell
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug assembleDebugAndroidTest
```

APK：`app/build/outputs/apk/debug/app-debug.apk`。云端同时生成 SHA256 校验文件。

0.1.27起先准备带Loader图片取消修复的Ruffle，再运行上述Gradle命令。GitHub Actions的engine任务按[原版锁](../third-party/ruffle.json)和[补丁锁](../third-party/ruffle-loader-fix.json)校验并编译0.7.1源码，运行原创红蓝图片回归；通过后才把`ruffle-engine-<commit>`交给APK任务。本地可从对应成功运行下载该artifact，将`ruffle-patched.xpi`放入`.cache/`；缺失时明确失败，不悄悄使用未修复原版。

自行编译引擎需要Rust 1.99.1、wasm32-unknown-unknown目标与rust-src、Node 24、Java 17、wasm-bindgen-cli 0.2.127、Binaryen 129、Clang 18/libclang（JPEG XR）。在干净的`.cache/ruffle-engine-build`目录运行`python tools/build_ruffle_engine.py`。标准与MVP两种Wasm都构建；脚本不签名/发布扩展。只替换页面引擎及配套块，其余文件逐字节保留。原创样例及命令见[fixture说明](../tools/fixtures/loader-image-cancel/README.md)。

GeckoView 158.0.20261007201254，Ruffle基础0.7.1 + loader-image-cancel-1，扩展包版本0.7.2.1（非上游0.7.2），AGP 9.2.0（内置 Kotlin，编译器固定 2.4.20），Gradle 9.4.1。Android构建本身无需NDK。来源清单与APK校验不能代替游戏验收。

## 安装与调试

设备写入需用户授权后执行：

```powershell
adb devices -l
adb -s <设备序列号> install -r app/build/outputs/apk/debug/app-debug.apk
```

Debug 构建启用 Gecko 远程调试，可在桌面 Firefox 的 `about:debugging` 连接；Android USB 调试和调试授权必须由用户允许。不要导出原始 HAR、Cookie、控制台日志或带票据的 URL。内置诊断只记录脱敏元数据，不截屏。

不同 CI 运行的临时 debug 签名可能不同；升级若出现签名冲突，**不要直接卸载**，卸载会清空登录状态，先确认是否保留数据。原型不发布 Release，也不使用长期签名密钥。


开始修改前阅读[协作约定](../AGENTS.md)、[交接](handoff.md)与[兼容性](compatibility.md)。项目已有的持续授权见交接；保留本地IDE生成配置，提交时显式选文件。


## GitHub 测试版发布

仅用户要求发布时，在main推送提交信息标记`[release]`，并准备`docs/releases/<version>.md`。末尾release任务等待引擎回归、Android构建/lint/单测及全部8项Gecko样例成功，才把同一commit的APK artifact和SHA256发布为GitHub pre-release。`prepare_release.py`核对原artifact校验文件，不重新打包或改变签名；既有Release/tag不覆盖，普通main推送与PR不发布。任务独占contents:write/actions:read，其他任务仍contents:read。`[release]`推送会排队等待当前构建，不取消它；普通推送保留原有取消旧run行为。

GitHub测试包与本地调试包可能不是同一签名；真机保留数据升级用本地原签名重建，不卸载/清数据。此流程是用户授权的GitHub测试发布，不涉及应用商店。
