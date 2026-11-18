# Android Release 签名与发布

2026-11-18 用户授权创建新的长期签名密钥。公开证书 SHA256：

`e93924f77e71d2703b86d3c9ed4f6a0b89db0d09f059abf9c586facced80c40c`

密钥、密码和 `github-secret.json` 只保存在用户的私有备份中，不在本仓库或公开 Release。
新签名不能直接覆盖以前的 Debug/其他签名安装；不要为了安装而直接卸载有重要数据的旧 App。
后续更新始终使用此密钥，发布时还需维护递增的 versionCode。

## 一次性配置 GitHub

1. 解压私有签名备份，打开 `github-secret.json`，复制完整文件内容。
2. 仓库 Settings → Secrets and variables → Actions → New repository secret。
3. Name 填 `ANDROID_RELEASE_SIGNING_JSON`，Secret 粘贴上述 JSON，保存。
4. Actions → Android signed Release APK → Run workflow，选择 main。

GitHub 连接可推送代码，但当前不提供写入 Actions Secrets 的能力；不能用公开文件代替 Secret。
如果云端尚未配置此项，流程仍会完成 Release 编译和验证，上传明确标注的未签名 APK artifact，但跳过签名和公开发行步骤。不会临时生成密钥或用 Debug 签名冒充。
不要将 `github-secret.json` 当作公开附件上传。

## 自动流程

修改签名工作流或签名脚本并推送 main 会自动触发；也可在 Actions 手动运行。构建 artifact 名称为 `time-casket-android-release`。未配置 Secret 时其中的 `*-unsigned.apk` 不能直接安装。

- 从已发布 v0.1.27 APK 校验并恢复固定修复引擎，保留标准/MVP运行时。
- Node/Python边界测试、JVM单元测试、lintRelease 和 assembleRelease。
- 用仓库 Secret 中的长期密钥对 Release APK 做16KB对齐和签名。
- 验证签名、公钥证书指纹、对齐及全部内嵌 Ruffle 资源，再发布独立
  `android-v0.1.27-release.1` pre-release，不覆盖已有安卓/iOS版本。
- 输出 `time-casket-0.1.27-release.apk`、校验文件和发布说明。不上传私钥/密码/Secret。

Release 构建关闭 Debug、自检及 Gecko 远程调试。仍为实验性游戏兼容浏览器，完整游戏兼容性以真机验收为准。

## 本机签名

向进程环境提供 `ANDROID_RELEASE_SIGNING_JSON` 后运行：

```sh
python3 tools/sign_android_release.py \
  --tools "$ANDROID_HOME/build-tools/36.0.0" \
  --input app/build/outputs/apk/release/app-release-unsigned.apk \
  --output release-assets/time-casket-0.1.27-release.apk \
  --expected-cert e93924f77e71d2703b86d3c9ed4f6a0b89db0d09f059abf9c586facced80c40c
```

密码通过权限受限的临时文件传给签名工具，不放进命令行参数或输出日志。
