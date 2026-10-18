package io.github.coderleexl.rocoapp

import android.app.Application
import org.json.JSONObject
import org.json.JSONArray
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.WebExtension

class RocoApplication : Application() {
    private val diagnosticFiles by lazy { DiagnosticFileStore(java.io.File(filesDir, "diagnostics")) }
    lateinit var runtime: GeckoRuntime
        private set
    val log = DiagnosticLog { category, number ->
        if (BuildConfig.DEBUG) {
            android.util.Log.i("TimeCasket", "$category ${number ?: -1}")
            diagnosticFiles.record(category, number)
        }
    }
    val gameFrames = GameFrameController(log)
    var ruffleState = "正在安装 Ruffle"
        private set
    var ruffleReady = false
        private set
    var compatibilityReady = false
        private set
    var compatibilityState = "正在准备资源兼容扩展"
        private set
    var diagnosticReady = false
        private set
    val probe by lazy { LocalProbeServer(
        audioScript = { assets.open("probe/audio.js").use { it.readBytes() } },
        viewAsset = { path -> assets.open(path).use { it.readBytes() } },
        record = { category, value -> log.record(category, number = value) }
    ) }
    private val socketBridge by lazy { GameSocketBridge({ kind, endpoint -> log.record(kind, number = endpoint) }) }

    // Application.onCreate also runs in Gecko's child service processes.
    // Start the parent runtime only when our main Activity asks for it.
    fun startBrowser(probeMode: Boolean = false) {
        if (::runtime.isInitialized) return
        log.record("app-version", number = BuildConfig.VERSION_CODE)
        ProcessExitDiagnostics.record(this, log)
        runtime = GeckoRuntime.create(this, GeckoRuntimeSettings.Builder()
            .remoteDebuggingEnabled(BuildConfig.DEBUG)
            .consoleOutput(BuildConfig.DEBUG && probeMode).debugLogging(false).build())
        runtime.webExtensionController.ensureBuiltIn("resource://android/assets/compatibility/", "compatibility@roco.local")
            .accept({ extension ->
                if (extension == null) {
                    compatibilityState = "资源兼容扩展安装失败"
                } else {
                    gameFrames.install(extension)
                    // Trigger loopback startup now; the background retries until it is ready.
                    socketBridge
                    compatibilityState = "正在准备官方游戏连接"
                    extension.setMessageDelegate(object : WebExtension.MessageDelegate {
                        override fun onMessage(nativeApp: String, message: Any, sender: WebExtension.MessageSender): GeckoResult<Any>? {
                            if (sender.webExtension.id != "compatibility@roco.local" || sender.session != null) {
                                log.record("socket-init-sender-rejected"); return null
                            }
                            val data = message as? JSONObject ?: return null
                            when (data.optString("kind")) {
                                "config" -> {
                                    log.record("socket-config-request", number = if (socketBridge.isReady) 1 else 0)
                                    if (!socketBridge.isReady) return GeckoResult.fromValue("{}")
                                    val proxies = JSONArray()
                                    GameSocketPolicy.hosts.forEach { host -> proxies.put(JSONObject()
                                        .put("host", host).put("port", 443).put("proxyUrl", socketBridge.proxyUrl(host))) }
                                    return GeckoResult.fromValue(JSONObject().put("proxies", proxies)
                                        .put("maxZone", GameSocketPolicy.MAX_ZONE).toString())
                                }
                                "ready" -> {
                                    compatibilityReady = true
                                    compatibilityState = "静态资源兼容和官方目录连接已启用"
                                    log.record("compatibility-installed")
                                }
                                "failed" -> { compatibilityState = "官方游戏连接初始化失败"; log.record("socket-init-failed") }
                            }
                            return GeckoResult.fromValue("ok")
                        }
                    }, "time_casket_socket")
                }
            }, { error ->
                compatibilityState = "资源兼容扩展安装失败"
                log.record("compatibility-install-failed", number = (error as? WebExtension.InstallException)?.code ?: 0)
            })
        try {
            val build = JSONObject(assets.open("ruffle-build.json").bufferedReader().use { it.readText() })
            runtime.webExtensionController.ensureBuiltIn("resource://android/assets/ruffle/", build.getString("id"))
                .accept({ extension ->
                    ruffleReady = extension != null
                    ruffleState = if (ruffleReady) "Ruffle ${build.getString("version")} 已安装；游戏兼容性待验证" else "Ruffle 安装失败，请查看调试器"
                    log.record(if (ruffleReady) "ruffle-installed" else "ruffle-install-failed")
                }, { error ->
                    ruffleState = "Ruffle 安装失败，请查看调试器"
                    log.record("ruffle-install-failed", number = (error as? WebExtension.InstallException)?.code ?: 0)
                    if (BuildConfig.DEBUG) android.util.Log.e("RocoExtension", "Bundled Ruffle installation failed", error)
                })
        } catch (_: Exception) {
            ruffleState = "缺少或损坏的 Ruffle 资源"
            log.record("ruffle-assets-failed")
        }
        runtime.webExtensionController.ensureBuiltIn("resource://android/assets/diagnostics/", "diagnostics@roco.local")
            .accept({ extension ->
                extension?.setMessageDelegate(object : WebExtension.MessageDelegate {
                    override fun onMessage(nativeApp: String, message: Any, sender: WebExtension.MessageSender): GeckoResult<Any>? {
                        if (sender.webExtension.id != "diagnostics@roco.local") return null
                        val data = message as? JSONObject ?: return null
                        if (data.optString("kind") == "request") {
                            log.record("request", data.optString("url"), data.optInt("status"))
                            log.record("request-ms", number = data.optInt("ms").coerceIn(0, 600000))
                        }
                        return null
                    }
                }, "roco_diagnostics")
                diagnosticReady = extension != null
                log.record(if (diagnosticReady) "diagnostics-installed" else "diagnostics-install-failed")
            }, { log.record("diagnostics-install-failed") })
    }
}
