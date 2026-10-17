package io.github.coderleexl.rocoapp

import org.junit.Assert.*
import org.junit.Test

class SafeDiagnosticsTest {
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
}
