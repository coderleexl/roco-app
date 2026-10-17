package io.github.coderleexl.rocoapp

import java.net.URI
import java.util.ArrayDeque

object SafeDiagnostics {
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
class DiagnosticLog {
    private val events = ArrayDeque<String>()
    @Synchronized fun record(kind: String, url: String? = null, number: Int? = null) {
        val label = kind.takeIf { it.matches(Regex("[a-z_-]{1,40}")) } ?: "event"
        events.addLast("${System.currentTimeMillis()} $label ${url?.let(SafeDiagnostics::url) ?: ""} ${number ?: ""}")
        while (events.size > 300) events.removeFirst()
    }
    @Synchronized fun text(): String = events.joinToString("\n")
}
