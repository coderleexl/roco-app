package io.github.coderleexl.rocoapp

import android.app.ActivityManager
import android.content.Context
import android.os.Build

/** System metadata for our own package only. Never read trace streams or descriptions. */
object ProcessExitDiagnostics {
    fun record(context: Context, log: DiagnosticLog) {
        if (!BuildConfig.DEBUG || Build.VERSION.SDK_INT < 30) return
        try {
            val manager = context.getSystemService(ActivityManager::class.java)
            val now = System.currentTimeMillis()
            val exits = manager.getHistoricalProcessExitReasons(context.packageName, 0, 8).take(8)
            log.record("exit-info-count", number = exits.size)
            for (exit in exits) {
                val name = exit.processName.orEmpty()
                val role = when {
                    name == context.packageName -> 0
                    name.startsWith(context.packageName + ":") && name.contains("gpu", ignoreCase = true) -> 1
                    name.startsWith(context.packageName + ":tab") -> 2
                    else -> 3
                }
                log.record("exit-age-seconds", number = ((now - exit.timestamp).coerceAtLeast(0) / 1000).coerceAtMost(604800).toInt())
                log.record("exit-role", number = role)
                log.record("exit-reason", number = exit.reason.takeIf { it in 0..32 } ?: 0)
                log.record("exit-importance", number = exit.importance.coerceIn(0, 1000))
                log.record("exit-rss-mib", number = (exit.rss / 1024).coerceIn(0, 65535).toInt())
            }
        } catch (_: Exception) { log.record("exit-info-unavailable") }
    }
}
