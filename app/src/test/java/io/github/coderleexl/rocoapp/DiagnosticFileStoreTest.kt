package io.github.coderleexl.rocoapp

import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class DiagnosticFileStoreTest {
    @get:Rule val temporary = TemporaryFolder()
    @Test fun rotatesBoundedPrivateFilesWithoutFreeText() {
        val directory = temporary.newFolder("diagnostics")
        DiagnosticFileStore(directory, 256).use { store ->
            store.record("ticket=SECRET", 0)
            repeat(30) { store.record("socket-first-send", it) }
        }
        val files = directory.listFiles()!!.toList()
        assertEquals(setOf("events.jsonl", "events.previous.jsonl"), files.map { it.name }.toSet())
        for (file in files) {
            assertTrue(file.length() <= 256)
            assertFalse(file.readText().contains("SECRET"))
            for (line in file.readLines()) assertTrue(line.matches(Regex("\\{\"at\":\\d+,\"kind\":\"socket-first-send\",\"number\":\\d+}")))
        }
    }
}
