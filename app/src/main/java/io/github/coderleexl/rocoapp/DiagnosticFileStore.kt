package io.github.coderleexl.rocoapp

import java.io.Closeable
import java.io.File
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit

/** Private, bounded enum/number log. No URL/text/payload argument exists. */
class DiagnosticFileStore(private val directory: File, private val maxBytes: Long = 128 * 1024) : Closeable {
    private val worker = ThreadPoolExecutor(1, 1, 0, TimeUnit.SECONDS, ArrayBlockingQueue(512),
        { task -> Thread(task, "time-casket-log").apply { isDaemon = true } }, ThreadPoolExecutor.DiscardPolicy())
    fun record(category: String, number: Int?) {
        if (!category.matches(Regex("[a-z_-]{1,40}"))) return
        val line = "{\"at\":${System.currentTimeMillis()},\"kind\":\"$category\",\"number\":${number ?: "null"}}\n"
        worker.execute {
            try {
                if (!directory.isDirectory && !directory.mkdirs()) return@execute
                val current = File(directory, "events.jsonl")
                if (current.length() + line.toByteArray().size > maxBytes) {
                    val previous = File(directory, "events.previous.jsonl")
                    if (previous.exists() && !previous.delete()) return@execute
                    if (current.exists() && !current.renameTo(previous)) return@execute
                }
                current.appendText(line, Charsets.UTF_8)
            } catch (_: Exception) { /* Logging failure cannot interrupt game/network execution. */ }
        }
    }
    override fun close() { worker.shutdown(); worker.awaitTermination(5, TimeUnit.SECONDS) }
}
