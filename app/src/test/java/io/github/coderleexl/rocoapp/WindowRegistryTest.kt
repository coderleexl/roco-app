package io.github.coderleexl.rocoapp

import org.junit.Assert.*
import org.junit.Test

class WindowRegistryTest {
    @Test fun openerFocusChangesCommandTargetEvenWhilePopupExists() {
        val windows = WindowRegistry<String>()
        windows.add("main")
        windows.add("login", "main")
        windows.focus("login")
        windows.focus("main")
        assertEquals("main", windows.current)
        assertEquals(2, windows.items.size)
        assertTrue(windows.remove("login"))
        assertEquals("main", windows.current)
        assertFalse(windows.remove("main"))
    }
    @Test fun closingActivePopupReturnsToItsOpener() {
        val windows = WindowRegistry<String>()
        windows.add("main")
        windows.add("login", "main")
        windows.focus("login")
        windows.add("captcha", "login")
        windows.focus("captcha")
        assertTrue(windows.remove("captcha"))
        assertEquals("login", windows.current)
    }
}
