import UIKit
import WebKit

final class BrowserController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private let container = UIView()
    private let status = UILabel()
    private var pages: [WKWebView] = []
    private var bridge: NativeBridge!
    private var current: WKWebView { pages.last! }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        let toolbar = UIStackView()
        toolbar.axis = .horizontal; toolbar.distribution = .fillEqually
        for (title, action) in [("首页", #selector(home)), ("返回", #selector(back)), ("刷新", #selector(refresh)), ("游戏全屏", #selector(gameView)), ("帮助", #selector(help))] {
            let button = UIButton(type: .system)
            button.setTitle(title, for: .normal); button.addTarget(self, action: action, for: .touchUpInside)
            toolbar.addArrangedSubview(button)
        }
        status.text = "iOS 实验版 · 游戏兼容性待验证"
        status.font = .systemFont(ofSize: 12); status.textAlignment = .center
        let stack = UIStackView(arrangedSubviews: [status, toolbar, container])
        stack.axis = .vertical; stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            stack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            status.heightAnchor.constraint(equalToConstant: 22), toolbar.heightAnchor.constraint(equalToConstant: 42)
        ])
        guard let root = Bundle.main.resourceURL?.appendingPathComponent("Resources"),
              let files = try? FileManager.default.contentsOfDirectory(atPath: root.appendingPathComponent("dist").path),
              let runtime = try? String(contentsOf: root.appendingPathComponent("dist/ruffle.js"), encoding: .utf8),
              let adapter = try? String(contentsOf: root.appendingPathComponent("bridge.js"), encoding: .utf8) else {
            status.text = "缺少打包资源，请使用完整构建包"; return
        }
        bridge = NativeBridge(resourceRoot: root)
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.defaultWebpagePreferences.preferredContentMode = .desktop
        config.userContentController.addScriptMessageHandler(bridge, contentWorld: .page, name: "timeCasket")
        let chunks = files.filter { $0.range(of: "^[0-9]+\\.js$", options: .regularExpression) != nil }.sorted().compactMap {
            try? String(contentsOf: root.appendingPathComponent("dist/\($0)"), encoding: .utf8)
        }.joined(separator: "\n")
        // Preload webpack chunks in the page world so page CSP need not allow dynamic script URLs.
        let official = "['https://17roco.qq.com','https://web2.17roco.qq.com'].includes(location.origin)"
        let source = "if (\(official)) {\n" + adapter + "\n" + runtime + "\n" + chunks + "\nwindow.postMessage({to:'ruffle_page',id:1,data:{type:'load',publicPath:'tc-extension://runtime/dist/ruffle.js',config:window.RufflePlayer.config}},'*');\n}"
        config.userContentController.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        for name in ["player-options.js", "audio-unlock.js", "game-view.js", "game-http.js"] {
            if let script = try? String(contentsOf: root.appendingPathComponent(name), encoding: .utf8) {
                config.userContentController.addUserScript(WKUserScript(source: "if (\(official)) {\n" + script + "\n}", injectionTime: .atDocumentStart, forMainFrameOnly: false))
            }
        }
        attach(WKWebView(frame: .zero, configuration: config))
        home()
    }
    private func attach(_ page: WKWebView) {
        page.navigationDelegate = self; page.uiDelegate = self
        page.allowsBackForwardNavigationGestures = true
        page.translatesAutoresizingMaskIntoConstraints = false
        pages.last?.isHidden = true
        pages.append(page); container.addSubview(page)
        NSLayoutConstraint.activate([
            page.leadingAnchor.constraint(equalTo: container.leadingAnchor), page.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            page.topAnchor.constraint(equalTo: container.topAnchor), page.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])
    }
    @objc private func home() {
        guard !pages.isEmpty else { return }
        while pages.count > 1 { pages.removeLast().removeFromSuperview() }
        current.isHidden = false; bridge.closeAll()
        current.load(URLRequest(url: URL(string: "https://17roco.qq.com/")!))
    }
    @objc private func back() {
        guard !pages.isEmpty else { return }
        if current.canGoBack { current.goBack() }
        else if pages.count > 1 { pages.removeLast().removeFromSuperview(); current.isHidden = false }
    }
    @objc private func refresh() { if !pages.isEmpty { current.reload() } }
    @objc private func gameView() {
        guard !pages.isEmpty else { return }
        current.evaluateJavaScript("window.__tcView||(window.__tcView=window.createTimeCasketGameView?.(window)); window.__tcView?.enterGame()")
    }
    @objc private func help() {
        show("iOS 实验移植版", "使用官方页面登录。内置 Ruffle 与原生 Socket 桥接；选服、活动、声音、战斗和长时间运行尚未通过 iOS 验收。全屏按钮调整页面布局，横屏请旋转手机。登录和游戏操作由你完成，刷新可能回到登录入口。")
    }
    private func show(_ title: String, _ message: String, done: (() -> Void)? = nil) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in done?() })
        present(alert, animated: true)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { status.text = "iOS 实验版 · 页面已载入，游戏请实测" }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { status.text = "页面加载失败，请检查网络后重试" }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { bridge.closeAll(); status.text = "网页进程已退出，请手动刷新" }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard pages.count < 6 else { return nil }
        let page = WKWebView(frame: .zero, configuration: configuration)
        attach(page); return page
    }
    func webViewDidClose(_ webView: WKWebView) {
        guard pages.count > 1, webView === current else { return }
        pages.removeLast().removeFromSuperview(); current.isHidden = false
    }
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        show("网页提示", message, done: completionHandler)
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "网页确认", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }
    deinit { bridge?.dispose() }
}
