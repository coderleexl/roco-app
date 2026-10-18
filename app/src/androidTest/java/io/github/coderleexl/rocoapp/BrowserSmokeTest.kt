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
            scenario.onActivity { assertTrue((it.application as RocoApplication).ruffleReady); assertTrue((it.application as RocoApplication).compatibilityReady) }
            val instrumentation = InstrumentationRegistry.getInstrumentation()
            await(scenario, "app window focused before real touch") {
                it.hasWindowFocus() && it.browser.hasWindowFocus() && it.browser.isShown && it.browser.width > 0 && it.browser.height > 0
            }
            instrumentation.waitForIdleSync()
            val point = IntArray(2)
            scenario.onActivity {
                it.browser.getLocationOnScreen(point)
                point[0] += it.browser.width / 2
                point[1] += it.browser.height / 2
            }
            val time = SystemClock.uptimeMillis()
            MotionEvent.obtain(time, time, MotionEvent.ACTION_DOWN, point[0].toFloat(), point[1].toFloat(), 0).also { instrumentation.sendPointerSync(it); it.recycle() }
            SystemClock.sleep(80)
            MotionEvent.obtain(time, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, point[0].toFloat(), point[1].toFloat(), 0).also { instrumentation.sendPointerSync(it); it.recycle() }
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
    @Test fun audioFixtureStartsAfterUserGesture() {
        launch("/audio.html").use { scenario ->
            await(scenario, "local audio page ready") { it.probeTitle == "ROCO:audio-ready" && it.hasWindowFocus() && it.browser.hasWindowFocus() }
            val instrumentation = InstrumentationRegistry.getInstrumentation()
            fun tap(fraction: Float) {
                instrumentation.waitForIdleSync()
                val point = IntArray(2)
                scenario.onActivity { it.browser.getLocationOnScreen(point); point[0] += it.browser.width / 2; point[1] += (it.browser.height * fraction).toInt() }
                val time = SystemClock.uptimeMillis()
                MotionEvent.obtain(time, time, MotionEvent.ACTION_DOWN, point[0].toFloat(), point[1].toFloat(), 0).also { instrumentation.sendPointerSync(it); it.recycle() }
                SystemClock.sleep(80)
                MotionEvent.obtain(time, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, point[0].toFloat(), point[1].toFloat(), 0).also { instrumentation.sendPointerSync(it); it.recycle() }
            }
            tap(.38f)
            await(scenario, "WebAudio context running after real fixture touch") { it.probeTitle == "ROCO:audio-web-running" }
            tap(.62f)
            await(scenario, "Ruffle starts a PCM AudioBufferSource") { it.probeTitle == "ROCO:audio-flash-started" }
        }
    }
    @Test fun cookieSurvivesProcessRestart() {
        launch("/check.html").use { scenario ->
            await(scenario, "cookie persisted across separate instrumentation processes") { it.probeTitle == "ROCO:cookie-persisted" }
        }
    }
    @Test fun landscapeShortcutKeepsSessionAndBackRestoresBrowsing() {
        launch().use { scenario ->
            await(scenario, "original local Flash runs before shortcut") { it.probeTitle == "ROCO:flash-executed" }
            var original: org.mozilla.geckoview.GeckoSession? = null
            var launchIntent: Intent? = null
            var starts = 0
            scenario.onActivity { activity ->
                original = activity.browser.session
                launchIntent = Intent(activity.intent)
                starts = (activity.application as RocoApplication).log.text().lineSequence().count { it.contains(" page-start ") }
                val shortcut = activity.getSystemService(android.content.pm.ShortcutManager::class.java)
                    .dynamicShortcuts.single { it.id == "landscape_game" }
                val target = shortcut.intent!!
                assertTrue(target.getBooleanExtra(MainActivity.EXTRA_GAME_MODE, false))
                assertEquals(0, target.flags and Intent.FLAG_ACTIVITY_CLEAR_TASK)
                activity.startActivity(target)
            }
            await(scenario, "shortcut enters landscape while waiting for an official game") {
                it.gameModeRequested && it.resources.configuration.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE
            }
            scenario.onActivity { activity ->
                assertSame(original, activity.browser.session)
                assertFalse(activity.gameOnlyActive)
                assertEquals("ROCO:flash-executed", activity.probeTitle)
                activity.onBackPressedDispatcher.onBackPressed()
            }
            await(scenario, "back exits game mode") { !it.gameModeRequested }
            scenario.onActivity { activity ->
                assertSame(original, activity.browser.session)
                assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED, activity.requestedOrientation)
                assertEquals(starts, (activity.application as RocoApplication).log.text().lineSequence().count { it.contains(" page-start ") })
                // ActivityScenario filters lifecycle events by its original
                // launch Intent. onNewIntent correctly updates the Activity's
                // intent; restore the fixture identity before scenario.close.
                activity.intent = launchIntent
            }
        }
    }
    @Test fun gameSurfaceFitsVisualViewportAfterRotationAndRestoresStyles() {
        launch("/view.html").use { scenario ->
            await(scenario, "same-target refit recovers the deliberately offscreen local surface") { it.probeTitle == "ROCO:view-fitted" }
            scenario.onActivity { it.setGameMode(true) }
            await(scenario, "real Gecko CSS keeps the surface inside the landscape visual viewport") { it.probeTitle == "ROCO:view-rotated" }
            scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }
            await(scenario, "portrait restoration removes presentation styles") { it.probeTitle == "ROCO:view-restored" && !it.gameModeRequested }
        }
    }
    @Test fun activityHttpBridgeReturnsLocalRealmAndPreservesFailureStatus() {
        launch("/http.html").use { scenario ->
            await(scenario, "two real Gecko realms preserve activity bytes and HTTP failure") { it.probeTitle == "ROCO:http-bridge-ok" }
        }
    }
}
