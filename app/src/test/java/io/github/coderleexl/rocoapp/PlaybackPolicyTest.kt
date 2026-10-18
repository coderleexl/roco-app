package io.github.coderleexl.rocoapp

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.mozilla.geckoview.GeckoSession.PermissionDelegate

class PlaybackPolicyTest {
    @Test fun loopbackIsLimitedToOfficialDocumentsAndNeverLocalNetwork() {
        for (uri in listOf("https://17roco.qq.com/", "https://17roco.qq.com/default.html", "https://web2.17roco.qq.com/game")) {
            assertTrue(PlaybackPolicy.allowsLoopback(uri, PermissionDelegate.PERMISSION_LOCAL_DEVICE_ACCESS))
            assertFalse(PlaybackPolicy.allowsLoopback(uri, PermissionDelegate.PERMISSION_LOCAL_NETWORK_ACCESS))
            assertFalse(PlaybackPolicy.allowsLoopback(uri, PermissionDelegate.PERMISSION_STORAGE_ACCESS))
        }
        for (uri in listOf("https://graph.qq.com/", "https://17roco.qq.com/other", "https://web2.17roco.qq.com:8443/", "http://web2.17roco.qq.com/", "https://u:p@web2.17roco.qq.com/")) {
            assertFalse(PlaybackPolicy.allowsLoopback(uri, PermissionDelegate.PERMISSION_LOCAL_DEVICE_ACCESS))
        }
    }
    @Test fun allowsOnlyOfficialDocumentAudioPlayback() {
        for (uri in listOf("https://17roco.qq.com/", "https://17roco.qq.com/default.html?v=1", "https://web2.17roco.qq.com/game")) {
            assertTrue(PlaybackPolicy.allowsAutoplay(uri, PermissionDelegate.PERMISSION_AUTOPLAY_AUDIBLE))
            assertTrue(PlaybackPolicy.allowsAutoplay(uri, PermissionDelegate.PERMISSION_AUTOPLAY_INAUDIBLE))
        }
    }

    @Test fun deniesOtherOriginsAndOtherPermissions() {
        for (uri in listOf(null, "", "about:blank", "http://17roco.qq.com/", "https://17roco.qq.com:8443/", "https://17roco.qq.com/unrelated.html", "https://user:pass@17roco.qq.com/", "https://web2.17roco.qq.com.evil.example/", "https://res.17roco.qq.com/", "https://evil.example/")) {
            assertFalse(uri, PlaybackPolicy.allowsAutoplay(uri, PermissionDelegate.PERMISSION_AUTOPLAY_AUDIBLE))
        }
        for (permission in listOf(PermissionDelegate.PERMISSION_GEOLOCATION, PermissionDelegate.PERMISSION_STORAGE_ACCESS, PermissionDelegate.PERMISSION_TRACKING, PermissionDelegate.PERMISSION_LOCAL_NETWORK_ACCESS)) {
            assertFalse(PlaybackPolicy.allowsAutoplay("https://17roco.qq.com/", permission))
        }
    }
}
