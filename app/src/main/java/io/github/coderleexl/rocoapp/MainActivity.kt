package io.github.coderleexl.rocoapp

import android.app.AlertDialog
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSessionSettings
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebRequestError

class MainActivity : ComponentActivity() {
    private val app get() = application as RocoApplication
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var status: TextView
    private lateinit var address: TextView
    private lateinit var progress: ProgressBar
    lateinit var browser: GeckoView
        private set
    private val registry = WindowRegistry<GeckoSession>()
    private val windows get() = registry.items
    private val history = mutableMapOf<GeckoSession, Boolean>()
    private val prompts = mutableListOf<AlertDialog>()
    private val current get() = registry.current
    var popupOpened = 0
        private set
    var popupClosed = 0
        private set
    var probeTitle = ""
        private set
    var pageSucceeded = false
        private set
    val windowCount get() = windows.size
    val mainWindowSelected get() = windows.isNotEmpty() && current == windows.first()
    private var desktop = true
    private var lastError = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        app.startBrowser(BuildConfig.DEBUG && intent.getBooleanExtra("probe", false))
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        // API 35 edge-to-edge: keep toolbar and game outside system bars.
        root.setOnApplyWindowInsetsListener { view, insets ->
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                val bars = insets.getInsets(android.view.WindowInsets.Type.systemBars())
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            } else {
                @Suppress("DEPRECATION")
                view.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop, insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
            }
            insets
        }
        val toolbar = LinearLayout(this)
        fun action(label: String, run: () -> Unit) {
            toolbar.addView(Button(this).apply { text = label; setOnClickListener { run() } })
        }
        action("官网") { current.loadUri(HOME) }
        action("返回") { goBack() }
        action("刷新游戏") {
            status.text = if (app.gameFrames.reload(current)) "正在重载游戏…"
                else "当前没有就绪的游戏页面；可点官网重新进入"
        }
        action("关闭子窗口") { if (windows.size > 1) closeWindow(if (current != windows.first()) current else windows.last()) }
        action("桌面/手机") {
            desktop = !desktop
            windows.forEach { configureSettings(it.settings) }
            current.reload()
        }
        action("诊断") { showDiagnostics() }
        if (BuildConfig.DEBUG) action("声音测试") {
            if (windows.size < 5) {
                val child = newWindow()
                registry.add(child, current)
                child.open(app.runtime)
                showWindow(child)
                child.loadUri(app.probe.baseUrl + "/audio.html")
            } else status.text = "请先关闭一个子窗口，再打开声音测试"
        }
        if (BuildConfig.DEBUG) action("自检") { loadProbe() }
        root.addView(HorizontalScrollView(this).apply { addView(toolbar) })
        status = TextView(this).apply { textSize = 12f }
        address = TextView(this).apply { textSize = 11f; maxLines = 2 }
        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        root.addView(status); root.addView(address); root.addView(progress)
        browser = GeckoView(this)
        root.addView(browser, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(root)

        val main = newWindow()
        registry.add(main)
        main.open(app.runtime)
        browser.setSession(main)
        main.setActive(true)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { goBack() }
        })
        waitForExtension()
    }

    private fun waitForExtension() {
        if (isDestroyed) return
        status.text = if (app.ruffleReady && !app.compatibilityReady) app.compatibilityState else app.ruffleState
        if (app.ruffleReady && app.compatibilityReady) {
            if (BuildConfig.DEBUG && intent.getBooleanExtra("probe", false)) {
                val path = intent.getStringExtra("probePath")
                loadProbe(path.takeIf { it in setOf("/probe.html", "/seed.html", "/check.html", "/audio.html") } ?: "/probe.html")
            }
            else current.loadUri(HOME)
        } else if (app.ruffleState.contains("失败") || app.ruffleState.contains("损坏") || app.compatibilityState.contains("失败")) {
            lastError = if (app.compatibilityState.contains("失败")) app.compatibilityState else app.ruffleState
            status.text = lastError
        } else handler.postDelayed({ waitForExtension() }, 200)
    }

    private fun configureSettings(settings: GeckoSessionSettings) {
        settings.userAgentMode = if (desktop) GeckoSessionSettings.USER_AGENT_MODE_DESKTOP else GeckoSessionSettings.USER_AGENT_MODE_MOBILE
        settings.viewportMode = if (desktop) GeckoSessionSettings.VIEWPORT_MODE_DESKTOP else GeckoSessionSettings.VIEWPORT_MODE_MOBILE
    }

    private fun newWindow(): GeckoSession {
        val session = GeckoSession(GeckoSessionSettings.Builder().usePrivateMode(false).build())
        app.gameFrames.attach(session) { message -> if (!isDestroyed && windows.isNotEmpty() && session == current) status.text = message }
        configureSettings(session.settings)
        session.permissionDelegate = object : GeckoSession.PermissionDelegate {
            override fun onContentPermissionRequest(
                session: GeckoSession,
                perm: GeckoSession.PermissionDelegate.ContentPermission
            ): GeckoResult<Int>? {
                if (perm.permission != GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_AUDIBLE &&
                    perm.permission != GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_INAUDIBLE) return null
                val allowed = PlaybackPolicy.allowsAutoplay(perm.uri, perm.permission)
                app.log.record(if (allowed) "autoplay-allowed" else "autoplay-denied", number = perm.permission)
                return GeckoResult.fromValue(if (allowed) GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW
                    else GeckoSession.PermissionDelegate.ContentPermission.VALUE_DENY)
            }
        }
        session.navigationDelegate = object : GeckoSession.NavigationDelegate {
            override fun onLoadRequest(session: GeckoSession, request: GeckoSession.NavigationDelegate.LoadRequest): GeckoResult<AllowOrDeny>? {
                val scheme = android.net.Uri.parse(request.uri).scheme
                if (scheme !in setOf("https", "http", "about", "resource", "data", "blob")) {
                    app.log.record("external-scheme-blocked")
                    if (session == current) { lastError = "网页请求打开其他 App，原型暂不处理；可尝试网页登录方式"; status.text = lastError }
                    return GeckoResult.fromValue(AllowOrDeny.DENY)
                }
                return null
            }
            override fun onNewSession(session: GeckoSession, uri: String): GeckoResult<GeckoSession>? {
                if (windows.size >= 5) { app.log.record("popup-limit"); return null }
                val child = newWindow()
                registry.add(child, session)
                popupOpened++
                app.log.record("popup-open", uri)
                // Gecko itself opens this initially UNOPENED session and establishes its opener.
                // Never call open()/loadUri() here: doing so breaks window.open's relationship.
                handler.post { showWhenOpened(child) }
                return GeckoResult.fromValue(child)
            }
            override fun onLocationChange(session: GeckoSession, url: String?, perms: MutableList<GeckoSession.PermissionDelegate.ContentPermission>, hasUserGesture: Boolean) {
                app.log.record("navigation", url)
                if (session == current) address.text = SafeDiagnostics.url(url)
            }
            override fun onCanGoBack(session: GeckoSession, canGoBack: Boolean) { history[session] = canGoBack }
            override fun onLoadError(session: GeckoSession, uri: String?, error: WebRequestError): GeckoResult<String>? {
                app.log.record("load-error", uri, error.code)
                if (session == current) { lastError = "加载失败（${error.code}），可刷新或查看诊断"; status.text = lastError }
                return null
            }
        }
        session.progressDelegate = object : GeckoSession.ProgressDelegate {
            override fun onPageStart(session: GeckoSession, url: String) {
                if (session == current) { lastError = ""; pageSucceeded = false; progress.visibility = View.VISIBLE }
                app.log.record("page-start", url)
            }
            override fun onProgressChange(session: GeckoSession, value: Int) { if (session == current) progress.progress = value }
            override fun onPageStop(session: GeckoSession, success: Boolean) {
                app.log.record(if (success) "page-loaded" else "page-failed")
                if (session == current) {
                    pageSucceeded = success
                    progress.visibility = View.GONE
                    status.text = if (success) app.ruffleState else lastError.ifEmpty { "页面未完整加载，查看诊断" }
                }
            }
        }
        session.contentDelegate = object : GeckoSession.ContentDelegate {
            override fun onCloseRequest(session: GeckoSession) { if (windows.firstOrNull() != session) closeWindow(session) }
            override fun onFocusRequest(session: GeckoSession) { if (session.isOpen && windows.contains(session)) showWindow(session) }
            override fun onTitleChange(session: GeckoSession, title: String?) {
                // Only expose fixture markers to tests; real game/login titles are never logged.
                if (title != null && title.matches(Regex("ROCO:[a-z-]{1,40}"))) probeTitle = title
            }
            override fun onCrash(session: GeckoSession) {
                app.log.record("content-crash")
                lastError = "网页进程崩溃，请点击官网重新加载"
                status.text = lastError
            }
        }
        session.promptDelegate = object : GeckoSession.PromptDelegate {
            override fun onAlertPrompt(session: GeckoSession, prompt: GeckoSession.PromptDelegate.AlertPrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse> {
                val result = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>()
                val dialog = AlertDialog.Builder(this@MainActivity).setTitle("网页提示").setMessage(prompt.message)
                    .setPositiveButton("确定") { _, _ -> result.complete(prompt.dismiss()) }
                    .setOnCancelListener { result.complete(prompt.dismiss()) }.create()
                prompts.add(dialog); dialog.show(); return result
            }
            override fun onButtonPrompt(session: GeckoSession, prompt: GeckoSession.PromptDelegate.ButtonPrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse> {
                val result = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>()
                val dialog = AlertDialog.Builder(this@MainActivity).setTitle("网页确认").setMessage(prompt.message)
                    .setPositiveButton("确定") { _, _ -> result.complete(prompt.confirm(GeckoSession.PromptDelegate.ButtonPrompt.Type.POSITIVE)) }
                    .setNegativeButton("取消") { _, _ -> result.complete(prompt.confirm(GeckoSession.PromptDelegate.ButtonPrompt.Type.NEGATIVE)) }
                    .setOnCancelListener { result.complete(prompt.dismiss()) }.create()
                prompts.add(dialog); dialog.show(); return result
            }
            override fun onTextPrompt(session: GeckoSession, prompt: GeckoSession.PromptDelegate.TextPrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse> {
                val result = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>()
                val input = EditText(this@MainActivity).apply { setText(prompt.defaultValue) }
                val dialog = AlertDialog.Builder(this@MainActivity).setTitle("网页输入").setMessage(prompt.message).setView(input)
                    .setPositiveButton("确定") { _, _ -> result.complete(prompt.confirm(input.text.toString())) }
                    .setNegativeButton("取消") { _, _ -> result.complete(prompt.dismiss()) }
                    .setOnCancelListener { result.complete(prompt.dismiss()) }.create()
                prompts.add(dialog); dialog.show(); return result
            }
        }
        return session
    }

    private fun showWhenOpened(session: GeckoSession) {
        if (isDestroyed || !windows.contains(session)) return
        if (session.isOpen) showWindow(session)
        else handler.postDelayed({ showWhenOpened(session) }, 30)
    }
    private fun showWindow(session: GeckoSession) {
        registry.focus(session)
        if (browser.session == session) return
        browser.session?.setActive(false)
        browser.releaseSession()
        browser.setSession(session)
        session.setActive(true)
    }
    private fun closeWindow(session: GeckoSession) {
        if (!registry.remove(session)) return
        history.remove(session)
        if (browser.session == session) browser.releaseSession()
        app.gameFrames.detach(session)
        session.close()
        popupClosed++
        app.log.record("popup-close")
        showWindow(current)
    }
    private fun goBack() {
        if (history[current] == true) current.goBack()
        else if (current != windows.first()) closeWindow(current)
        else AlertDialog.Builder(this).setMessage("退出兼容性验证？")
            .setPositiveButton("退出") { _, _ -> finish() }.setNegativeButton("取消", null).show()
    }
    fun loadProbe(path: String = "/probe.html") {
        check(BuildConfig.DEBUG)
        check(path in setOf("/probe.html", "/seed.html", "/check.html", "/audio.html"))
        probeTitle = ""
        current.loadUri(app.probe.baseUrl + path)
    }
    private fun showDiagnostics() {
        val info = "${app.ruffleState}\n资源兼容：${app.compatibilityState}\n诊断扩展：${if (app.diagnosticReady) "已安装" else "未就绪"}\n窗口数：${windows.size}\n$lastError\n\n${app.log.text()}"
        val content = TextView(this).apply { text = info; setPadding(20, 20, 20, 20); setTextIsSelectable(true) }
        AlertDialog.Builder(this).setTitle("脱敏诊断（未验证游戏兼容）").setView(ScrollView(this).apply { addView(content) })
            .setPositiveButton("关闭", null).show()
    }
    override fun onResume() { super.onResume(); if (windows.isNotEmpty() && current.isOpen) current.setActive(true) }
    override fun onPause() { if (windows.isNotEmpty() && current.isOpen) current.setActive(false); super.onPause() }
    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        prompts.forEach { if (it.isShowing) it.cancel() }
        browser.releaseSession()
        windows.forEach { app.gameFrames.detach(it); it.close() }; registry.clear()
        super.onDestroy()
    }
    companion object { const val HOME = "https://17roco.qq.com/" }
}
