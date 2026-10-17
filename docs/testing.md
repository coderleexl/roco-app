# Test plan

## Automated

- `node --test tools/diagnostics.test.cjs`: strip credentials, token queries/fragments and opaque paths; ignore headers and bodies.
- `./gradlew testDebugUnitTest lintDebug assembleDebug assembleDebugAndroidTest`: Kotlin sanitizer/ring-buffer tests, static Android checks, arm64/x86_64 Debug APK and instrumentation APK.
- GitHub API 35 x86_64 emulator uses actual GeckoView and bundled official Ruffle, without screenshots:
  1. Original Flash executes `fscommand("roco-probe", "executed")`; only its callback passes the gate.
  2. A real synthetic touch opens a child, checks shared HttpOnly fixture cookie and opener callback, then window.close returns to main.
  3. Cookie seeded with Max-Age; process force-stopped; separate instrumentation run checks persistence without first setting a cookie.
- Instrumentation stdout must contain `OK (1 test)`; adb exit code alone is insufficient. Build/emulator reports are artifacts.
- Public entry probe records status/elapsed time and sanitized redirect metadata only. Network failure is recorded as failure/unknown, not interpreted as game incompatibility.

## Manual game acceptance

User completes normal login, server selection, map load, movement, interface opening and a basic battle. Run 15 minutes, record crashes/disconnects/stalls; restart App and check recovery or normal re-login. Record version, commit and failure gate, not credentials or screenshots.

No local SDK or NDK is required to download an Actions APK. Meizu arm64 is a separate acceptance target from the CI emulator.
