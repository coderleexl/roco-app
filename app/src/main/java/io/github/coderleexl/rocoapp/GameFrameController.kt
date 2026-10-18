package io.github.coderleexl.rocoapp

import java.net.URI
import org.json.JSONObject
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.WebExtension

/** Only restarts a ready main.swf in the selected session. Never falls back to a page reload. */
class GameFrameController(private val log: DiagnosticLog) {
    private data class Frame(var ready: Boolean = false, var busy: Boolean = false, val signals: MutableMap<String, Int> = mutableMapOf())
    private class Session(val feedback: (String) -> Unit) {
        val frames = linkedMapOf<WebExtension.Port, Frame>()
    }
    private val sessions = linkedMapOf<GeckoSession, Session>()
    private var extension: WebExtension? = null

    fun install(value: WebExtension) {
        extension = value
        sessions.keys.toList().forEach { bind(it, value) }
    }
    fun attach(session: GeckoSession, feedback: (String) -> Unit) {
        sessions[session] = Session(feedback)
        extension?.let { bind(session, it) }
    }
    private fun bind(session: GeckoSession, extension: WebExtension) {
        session.webExtensionController.setMessageDelegate(extension, object : WebExtension.MessageDelegate {
            override fun onConnect(port: WebExtension.Port) {
                val sender = port.sender
                val state = sessions[session]
                if (state == null || sender.session !== session || sender.webExtension.id != "compatibility@roco.local" ||
                    sender.environmentType != WebExtension.MessageSender.ENV_TYPE_CONTENT_SCRIPT || !allowsPage(sender.url) || state.frames.size >= 8) {
                    port.disconnect(); return
                }
                val frame = Frame()
                state.frames[port] = frame
                port.setDelegate(object : WebExtension.PortDelegate {
                    override fun onPortMessage(message: Any, port: WebExtension.Port) {
                        if (sessions[session] !== state || state.frames[port] !== frame) return
                        val data = message as? JSONObject ?: return
                        when (data.optString("kind")) {
                            "signals" -> {
                                val values = data.optJSONObject("values") ?: return
                                for ((key, label) in signalLabels) {
                                    val value = values.opt(key) as? Int ?: continue
                                    if (value in 0..1000 && frame.signals.put(key, value) != value) log.record(label, number = value)
                                }
                            }
                            "ready" -> {
                                val ready = data.opt("ready") == true
                                if (ready != frame.ready) log.record("game-frame-ready", number = if (ready) 1 else 0)
                                frame.ready = ready
                            }
                            "reloaded", "reload-failed", "reload-unavailable" -> {
                                if (!frame.busy) return
                                frame.busy = false
                                val success = data.optString("kind") == "reloaded"
                                log.record(if (success) "game-reloaded" else "game-reload-failed")
                                state.feedback(if (success) "已重新启动游戏加载，请检查服务器列表" else "游戏重载未完成，请查看诊断")
                            }
                        }
                    }
                    override fun onDisconnect(port: WebExtension.Port) { state.frames.remove(port) }
                })
            }
        }, "time_casket_game_control")
    }
    fun reload(session: GeckoSession): Boolean {
        val state = sessions[session] ?: return false
        if (state.frames.values.any { it.busy }) return true
        val (port, frame) = state.frames.entries.lastOrNull { it.value.ready } ?: return false
        frame.busy = true
        try { port.postMessage(JSONObject().put("kind", "reload")) }
        catch (_: Exception) { frame.busy = false; log.record("game-reload-failed"); return false }
        log.record("game-reload-requested")
        return true
    }
    fun detach(session: GeckoSession) {
        sessions.remove(session)?.frames?.keys?.toList()?.forEach { it.disconnect() }
        extension?.let { session.webExtensionController.setMessageDelegate(it, null, "time_casket_game_control") }
    }
    companion object {
        private val signalLabels = mapOf("traceAttached" to "phase-trace", "configsLoaded" to "phase-configs", "loginInitialized" to "phase-login",
            "directoryRequests" to "phase-dir-requests", "traceErrors" to "phase-errors", "missingSocketProxy" to "phase-missing-socket",
            "dirWsAttempt" to "dir-ws-attempt", "dirWsOpen" to "dir-ws-open", "dirWsError" to "dir-ws-error", "dirWsClose" to "dir-ws-close",
            "statWsAttempt" to "stat-ws-attempt", "statWsOpen" to "stat-ws-open", "statWsError" to "stat-ws-error", "statWsClose" to "stat-ws-close")
        fun allowsPage(raw: String?): Boolean = try {
            val uri = URI(raw ?: "")
            uri.scheme == "https" && uri.host == "web2.17roco.qq.com" && uri.port in setOf(-1, 443) && uri.rawUserInfo == null
        } catch (_: Exception) { false }
    }
}
