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
}
