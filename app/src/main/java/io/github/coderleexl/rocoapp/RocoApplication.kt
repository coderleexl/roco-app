package io.github.coderleexl.rocoapp

import android.app.Application
import org.json.JSONObject
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.WebExtension

class RocoApplication : Application() {
    lateinit var runtime: GeckoRuntime
        private set
    val log = DiagnosticLog()
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
    val probe by lazy { LocalProbeServer() }

    // Application.onCreate also runs in Gecko's child service processes.
    // Start the parent runtime only when our main Activity asks for it.
    fun startBrowser(probeMode: Boolean = false) {
        if (::runtime.isInitialized) return
        runtime = GeckoRuntime.create(this, GeckoRuntimeSettings.Builder()
            .remoteDebuggingEnabled(BuildConfig.DEBUG)
            .consoleOutput(BuildConfig.DEBUG && probeMode).debugLogging(false).build())
        runtime.webExtensionController.ensureBuiltIn("resource://android/assets/compatibility/", "compatibility@roco.local")
            .accept({ extension ->
                compatibilityReady = extension != null
                compatibilityState = if (compatibilityReady) "公开静态资源兼容已启用" else "资源兼容扩展安装失败"
                log.record(if (compatibilityReady) "compatibility-installed" else "compatibility-install-failed")
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
