package io.github.coderleexl.rocoapp

import android.content.Intent
import android.os.SystemClock
import android.view.MotionEvent
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BrowserSmokeTest {
    private fun launch(path: String = "/probe.html"): ActivityScenario<MainActivity> {
        val context = ApplicationProvider.getApplicationContext<RocoApplication>()
        return ActivityScenario.launch(Intent(context, MainActivity::class.java).putExtra("probe", true).putExtra("probePath", path))
    }
    private fun await(scenario: ActivityScenario<MainActivity>, label: String, predicate: (MainActivity) -> Boolean) {
        val deadline = SystemClock.uptimeMillis() + 90000
        while (SystemClock.uptimeMillis() < deadline) {
            var ready = false
            scenario.onActivity { ready = predicate(it) }
            if (ready) return
            SystemClock.sleep(200)
        }
        var report = ""
        scenario.onActivity { report = (it.application as RocoApplication).log.text() + "\nfixture=" + it.probeTitle + "\nfixture-error=" + (it.application as RocoApplication).probe.fixtureFailure }
        fail("Timeout: $label\n$report")
    }
    @Test fun flashExecutesAndPopupRetainsOpenerAndCookie() {
        launch().use { scenario ->
            await(scenario, "Ruffle executes ActionScript FSCommand") { it.probeTitle == "ROCO:flash-executed" }
            scenario.onActivity { assertTrue((it.application as RocoApplication).ruffleReady) }
            val point = IntArray(2)
            scenario.onActivity {
                it.browser.getLocationOnScreen(point)
                point[0] += it.browser.width / 2
                point[1] += it.browser.height / 2
            }
            val instrumentation = InstrumentationRegistry.getInstrumentation()
            val time = SystemClock.uptimeMillis()
            MotionEvent.obtain(time, time, MotionEvent.ACTION_DOWN, point[0].toFloat(), point[1].toFloat(), 0).also { instrumentation.sendPointerSync(it); it.recycle() }
            MotionEvent.obtain(time, time + 80, MotionEvent.ACTION_UP, point[0].toFloat(), point[1].toFloat(), 0).also { instrumentation.sendPointerSync(it); it.recycle() }
            await(scenario, "opener focus selects the visible main while child remains alive") {
                it.windowCount == 2 && it.mainWindowSelected && it.probeTitle == "ROCO:popup-focused"
            }
            await(scenario, "associated popup closes and returns callback") {
                it.popupOpened == 1 && it.popupClosed == 1 && it.windowCount == 1 && it.probeTitle == "ROCO:popup-ok"
            }
            scenario.onActivity { assertTrue((it.application as RocoApplication).probe.sharedCookieSeen) }
        }
    }
    @Test fun seedPersistentCookie() {
        launch("/seed.html").use { scenario ->
            await(scenario, "persistent fixture cookie seeded") { it.probeTitle == "ROCO:cookie-seeded" }
            // Allow Gecko's normal cookie persistence task to finish before process termination.
            SystemClock.sleep(4000)
        }
    }
    @Test fun cookieSurvivesProcessRestart() {
        launch("/check.html").use { scenario ->
            await(scenario, "cookie persisted across separate instrumentation processes") { it.probeTitle == "ROCO:cookie-persisted" }
        }
    }
}
