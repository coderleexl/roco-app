package io.github.coderleexl.rocoapp

import java.net.URI
import java.util.ArrayDeque

object SafeDiagnostics {
    /** Fixed classifications only; never retain the alert's title/message or arbitrary numbers. */
    fun alertCode(message: String?): Int {
        val text = message.orEmpty().take(4096)
        return Regex("\\bError #([0-9]{1,5})\\b").findAll(text).map { it.groupValues[1].toInt() }
            .firstOrNull { it in setOf(1009, 1010, 2032) } ?: 0
    }
    fun alertIsIO(message: String?): Boolean = Regex("\\bIOError(?:Event)?\\b|ioError|Stream Error").containsMatchIn(message.orEmpty().take(4096))
    private val knownPaths = setOf("/", "/default.html", "/iframe.html", "/login.html", "/cgi-bin/login", "/fcgi-bin/login2")
    fun url(raw: String?): String = try {
        val uri = URI(raw ?: "")
        if (uri.scheme !in setOf("http", "https") || uri.host == null) "[non-web]"
        else {
            val port = if (uri.port >= 0) ":${uri.port}" else ""
            val path = uri.rawPath.takeIf { it in knownPaths } ?: "/[redacted]"
            "${uri.scheme}://${uri.host}$port$path"
        }
    } catch (_: Exception) { "[invalid-url]" }
}

/** Metadata only. No raw console text, titles, headers, bodies, cookies or query strings. */
class DiagnosticLog(private val signal: (String, Int?) -> Unit = { _, _ -> }) {
    private val events = ArrayDeque<String>()
    @Synchronized fun record(kind: String, url: String? = null, number: Int? = null) {
        val label = kind.takeIf { it.matches(Regex("[a-z_-]{1,40}")) } ?: "event"
        events.addLast("${System.currentTimeMillis()} $label ${url?.let(SafeDiagnostics::url) ?: ""} ${number ?: ""}")
        while (events.size > 300) events.removeFirst()
        // Observer receives only the validated category and a number, never URLs.
        try { signal(label, number) } catch (_: Exception) { /* Diagnostics never interrupt the browser. */ }
    }
    @Synchronized fun text(): String = events.joinToString("\n")
}
