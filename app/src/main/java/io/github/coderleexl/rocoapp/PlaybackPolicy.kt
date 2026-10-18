package io.github.coderleexl.rocoapp

import java.net.URI
import java.util.Locale
import org.mozilla.geckoview.GeckoSession.PermissionDelegate

object PlaybackPolicy {
    fun allowsAutoplay(uri: String?, permission: Int): Boolean {
        if (permission != PermissionDelegate.PERMISSION_AUTOPLAY_AUDIBLE &&
            permission != PermissionDelegate.PERMISSION_AUTOPLAY_INAUDIBLE) return false
        return allowsOfficialDocument(uri)
    }
    fun allowsLoopback(uri: String?, permission: Int): Boolean =
        permission == PermissionDelegate.PERMISSION_LOCAL_DEVICE_ACCESS && allowsOfficialDocument(uri)

    private fun allowsOfficialDocument(uri: String?): Boolean {
        val page = try { URI(uri ?: return false) } catch (_: Exception) { return false }
        if (page.scheme != "https" || page.rawUserInfo != null || page.port !in listOf(-1, 443)) return false
        return when (page.host?.lowercase(Locale.ROOT)) {
            "web2.17roco.qq.com" -> true
            "17roco.qq.com" -> page.rawPath.orEmpty() in setOf("", "/", "/default.html")
            else -> false
        }
    }
}
