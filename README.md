# 时光匣

在 Android 上打开洛克王国经典网页版的实验性应用，内置网页与 Flash 兼容组件，使用官方页面登录。

目前已验证可以选择服务器并进入游戏。部分活动、礼包仍可能报错，背景声音也在排查中，尚未完整兼容。

## 安装

需要 Android 8.0 或更高版本。当前提供测试版 APK：

1. 打开 [GitHub Actions 下载页](https://github.com/coderleexl/roco-app/actions/workflows/android.yml)，选择最新成功的运行。
2. 在 Artifacts 下载 `roco-debug-<commit>`，下载需要登录 GitHub。
3. 解压并安装 `debug/app-debug.apk`，不要安装名称含 `androidTest` 的测试程序。

升级时使用同签名 APK 覆盖安装可保留应用数据；官方登录状态仍可能过期。

## 开始游戏

打开时光匣，按官网提示完成登录和验证，再选择服务器进入游戏。

想只看游戏画面，可以：

- 长按时光匣图标，选择 **游戏全屏**；桌面支持时可将该入口拖到桌面。
- 已在 App 内时，点击顶栏的 **游戏全屏**。

游戏窗口自动横屏并按比例铺满，隐藏网页周边和工具栏；需要登录时，在窗口内按官方提示完成即可。按返回键恢复网页。

顶栏可以左右滑动。**刷新游戏** 用于重新启动当前游戏；**关闭子窗口** 用于返回原页面；**声音测试** 可以试听本地提示音。

## 当前限制与反馈

活动、礼包、背景声音以及长时间游玩仍需继续验证。遇到问题，请提供 App 版本、手机型号、出错步骤和错误文字，方便定位；不要提交密码、Cookie 或带登录凭据的链接。

[提交问题](https://github.com/coderleexl/roco-app/issues) · [查看兼容情况](docs/compatibility.md) · [排查说明](docs/troubleshooting.md)

## 项目说明

时光匣是独立项目，并非腾讯官方客户端。游戏内容与第三方组件的权利归各自权利人所有，项目许可与正式发布准备仍在完善。

开发相关：[构建与调试](docs/development.md) · [架构](docs/architecture.md) · [开发交接](docs/handoff.md) · [第三方说明](third-party/NOTICE.md)
