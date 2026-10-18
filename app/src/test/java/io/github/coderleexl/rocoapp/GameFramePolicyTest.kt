package io.github.coderleexl.rocoapp

import org.junit.Assert.*
import org.junit.Test

class GameFramePolicyTest {
    @Test fun reloadMessagesRequireExactOfficialHttpsOrigin() {
        assertTrue(GameFrameController.allowsPage("https://web2.17roco.qq.com/game"))
        assertTrue(GameFrameController.allowsPage("https://web2.17roco.qq.com:443/game"))
        for (url in listOf(null, "", "https://17roco.qq.com/", "http://web2.17roco.qq.com/", "https://web2.17roco.qq.com:8443/", "https://web2.17roco.qq.com.evil.example/", "https://a:b@web2.17roco.qq.com/")) {
            assertFalse(url, GameFrameController.allowsPage(url))
        }
    }
    @Test fun homepagePresentationDoesNotGrantMovieReload() {
        for (url in listOf("https://17roco.qq.com/", "https://17roco.qq.com:443/default.html?ignored=1")) {
            assertTrue(GameFrameController.allowsPresentationPage(url))
            assertFalse(GameFrameController.allowsPage(url))
        }
        for (url in listOf(null, "", "https://17roco.qq.com/other", "https://web2.17roco.qq.com/", "http://17roco.qq.com/", "https://17roco.qq.com:8443/", "https://a:b@17roco.qq.com/", "https://17roco.qq.com.evil.example/")) {
            assertFalse(url, GameFrameController.allowsPresentationPage(url))
        }
    }
}
