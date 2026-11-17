# 时光匣 iOS 实验移植版

这是基于 Android v0.1.27 的 **WKWebView 移植原型**，不是把 APK 转为 IPA。
最低 iOS 16，支持 iPhone/iPad。使用系统 WebKit，不使用 Gecko，也不要求特殊浏览器内核权限或 JIT 权限。

## GitHub 下载及签名

Actions 的 `iOS unsigned IPA and experimental release` 流程会在 macOS 上编译 arm64 设备归档，
检查实际二进制、资源完整性及 plist，通过后创建 `ios-v0.1.27-alpha.1` 预发布版本。
下载 `time-casket-ios-0.1.27-alpha.1-unsigned.ipa`，使用你的签名工具和开发者账号重签后安装。
未签名 IPA 不能直接安装；不包含开发证书、描述文件、账号、密码或私钥。

如果希望 Xcode 自动处理你自己的签名，下载同页源码 ZIP，在 Mac 上：

```sh
brew install xcodegen
cd roco-app  # 源码解压所在目录
python3 ios/scripts/prepare_resources.py
cd ios
xcodegen generate
open TimeCasket.xcodeproj
```

在 Xcode 选择 TimeCasket target → Signing & Capabilities → 选择自己的 Team，
必要时将 Bundle Identifier 改为你账号可用的唯一标识。选择已连接的 iPhone，点击 Run。
设备上如要求启用开发者模式或信任开发者，请按系统提示自行完成。
第一次资源准备需要下载约 388 MiB 的原版本 APK 和上游 XPI，仅为了校验、提取引擎。
本地只生成未签名 IPA：`bash ios/scripts/build_unsigned.sh`。

## 本版包含

- WKWebView 桌面模式、持久化浏览器数据、关联弹窗、网页提示及返回/刷新/游戏布局按钮。
- 复用原版已补丁的 Ruffle 标准/MVP Wasm，核对发布包 SHA256、运行时与源码补丁来源。
- JavaScript 在官方页面 document_start 注入，预加载耦合 JS 块；Wasm 从 App 内资源读取。
- 原生 NWConnection TCP 桥，目标仅 dir/stat/zone1…65535.17roco.qq.com:443。
  Flash 指向本地虚拟 Socket URL，由 WKScriptMessageHandlerWithReply 转为原生 TCP；不监听局域网端口。
- 公开资源域名的受限匿名 HTTPS GET 适配；原生请求不带浏览器 Cookie、不跟随重定向。
  登录、认证、其他 CGI 和其他域的请求继续走浏览器。
- 复用页面配置、音频解锁、游戏布局和同源游戏 GET 适配脚本。

## 验证边界

本地 Node 桥接测试 7 项通过，Python/Shell 语法检查通过。
云端构建、资源验证结果以对应 Actions run 为准；**IPA 编译成功不代表完整游戏兼容**。

尚未完成 iPhone 真机的 Ruffle/Wasm、官方登录、选服、地图、战斗、音乐、活动和长时间内存验收。
WebKit 下 iframe 同源策略、Wasm 返回 Response 的流式处理、游戏特定资源路径与画面表现仍需实测。
公开资源桥当前只覆盖 fetch；页面原生 XHR/图片资源仍遵循 WebKit 的策略。
不伪造物品、PP 或账号数据，不自动登录、不截图、不记录认证票据或网络正文。
没有自动恢复官方会话的承诺；刷新会重载网页，可能回到登录入口。

## 版权

《洛克王国》内容归腾讯及相关权利人，App 是非官方第三方浏览工具，不附带游戏资源。
Ruffle 基础版本 0.7.1 + loader-image-cancel-1，遵循 MIT OR Apache-2.0，保留运行时内许可证。
来源与补丁见根目录 `third-party/NOTICE.md`、`ruffle.json`、`ruffle-loader-fix.json` 和 patches。
本版不是上游 Ruffle 的 iOS 官方产品，也不代表获得游戏官方授权。
