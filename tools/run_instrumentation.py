"""Fail CI on Android instrumentation failures, whose adb exit status alone is unreliable."""
from pathlib import Path
import subprocess

out = Path('test-results')
out.mkdir(exist_ok=True)
for name in ('app-debug.apk', 'app-debug-androidTest.apk'):
    matches = list(Path('apks').rglob(name))
    if len(matches) != 1:
        raise RuntimeError(f'Expected one {name}, found {len(matches)}')
    subprocess.run(['adb', 'install', '-r', str(matches[0])], check=True)

for method in ('flashExecutesAndPopupRetainsOpenerAndCookie', 'seedPersistentCookie', 'cookieSurvivesProcessRestart', 'audioFixtureStartsAfterUserGesture', 'landscapeShortcutKeepsSessionAndBackRestoresBrowsing', 'gameSurfaceFitsVisualViewportAfterRotationAndRestoresStyles'):
    subprocess.run(['adb', 'shell', 'am', 'force-stop', 'io.github.coderleexl.rocoapp'], check=True)
    try:
        result = subprocess.run(['adb', 'shell', 'am', 'instrument', '-w', '-r', '-e', 'class',
            f'io.github.coderleexl.rocoapp.BrowserSmokeTest#{method}',
            'io.github.coderleexl.rocoapp.test/androidx.test.runner.AndroidJUnitRunner'],
            capture_output=True, text=True, timeout=420)
        text = result.stdout + result.stderr
        returncode = result.returncode
    except subprocess.TimeoutExpired as error:
        def decoded(value):
            return value.decode(errors='replace') if isinstance(value, bytes) else (value or '')
        text = decoded(error.stdout) + decoded(error.stderr) + '\nInstrumentation exceeded 420 seconds.\n'
        returncode = -1
    (out / f'{method}.txt').write_text(text, encoding='utf-8')
    print(text)
    if returncode or 'OK (1 test)' not in text or 'FAILURES!!!' in text:
        excerpt = text[-18000:]
        for offset in range(0, len(excerpt), 3000):
            chunk = excerpt[offset:offset+3000].replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
            print(f'::error title=Smoke test {method} part {offset // 3000 + 1}::{chunk}', flush=True)
        crash = subprocess.run(['adb', 'logcat', '-d', '-s', 'AndroidRuntime:E', 'RocoExtension:E', 'GeckoConsole:V', 'libc:F', 'DEBUG:F', '*:S'], capture_output=True, text=True, timeout=10).stdout[-9000:]
        # This runner is a fresh, unauthenticated emulator with only fixed
        # test fixtures, never a user's phone or official login session.
        (out / f'{method}-crash.txt').write_text(crash, encoding='utf-8')
        for offset in range(0, len(crash), 3000):
            chunk = crash[offset:offset+3000].replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
            print(f'::error title=Emulator runtime error part {offset // 3000 + 1}::{chunk}', flush=True)
        raise RuntimeError(f'Instrumentation failed: {method}')
    print(f'::notice title=Android smoke passed::{method}', flush=True)
print('All six separate-process smoke tests passed')
