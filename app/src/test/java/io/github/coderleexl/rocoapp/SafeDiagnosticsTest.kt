package io.github.coderleexl.rocoapp

import org.junit.Assert.*
import org.junit.Test

class SafeDiagnosticsTest {
    @Test fun alertsRetainOnlyKnownErrorCodesAndIOCategory() {
        assertEquals(2032, SafeDiagnostics.alertCode("Error #2032: Stream Error token=SECRET"))
        assertEquals(1010, SafeDiagnostics.alertCode("Error #1010 SECRET"))
        assertEquals(1009, SafeDiagnostics.alertCode("Error #1009 SECRET"))
        for (text in listOf(null, "verification=123456", "Error #20321", "Error #99999", "Error #2032secret")) {
            assertEquals(0, SafeDiagnostics.alertCode(text))
        }
        assertTrue(SafeDiagnostics.alertIsIO("哎呀出现了网络故障 ioError SECRET"))
        assertTrue(SafeDiagnostics.alertIsIO("Error #2032: Stream Error"))
        assertFalse(SafeDiagnostics.alertIsIO("ordinary message SECRET"))
    }
    @Test fun dropsAuthenticationAndOpaquePaths() {
        assertEquals("https://17roco.qq.com/cgi-bin/login", SafeDiagnostics.url("https://user:SECRET@17roco.qq.com/cgi-bin/login?ticket=SECRET#SECRET"))
        assertEquals("https://example.com/[redacted]", SafeDiagnostics.url("https://example.com/sub/SECRET"))
        assertEquals("[non-web]", SafeDiagnostics.url("javascript:SECRET"))
    }
    @Test fun boundsLogAndRejectsUnstructuredMessages() {
        val log = DiagnosticLog()
        repeat(400) { log.record("request", "https://example.com/?ticket=SECRET", 200) }
        assertEquals(300, log.text().lines().size)
        assertFalse(log.text().contains("SECRET"))
        log.record("raw SECRET with spaces")
        assertFalse(log.text().contains("SECRET"))
    }
    @Test fun debugObserverReceivesNoUrlsAndCannotInterruptLogging() {
        val observed = mutableListOf<Pair<String, Int?>>()
        val log = DiagnosticLog { label, value -> observed.add(label to value); throw IllegalStateException("observer failed") }
        log.record("socket-first-send", "https://user:SECRET@example.com/?ticket=SECRET", 0)
        assertEquals(listOf("socket-first-send" to 0), observed)
        assertFalse(observed.toString().contains("SECRET"))
        assertTrue(log.text().contains("socket-first-send"))
    }
}
