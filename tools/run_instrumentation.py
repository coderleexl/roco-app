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

for method in ('flashExecutesAndPopupRetainsOpenerAndCookie', 'seedPersistentCookie', 'cookieSurvivesProcessRestart'):
    subprocess.run(['adb', 'shell', 'am', 'force-stop', 'io.github.coderleexl.rocoapp'], check=True)
    result = subprocess.run(['adb', 'shell', 'am', 'instrument', '-w', '-r', '-e', 'class',
        f'io.github.coderleexl.rocoapp.BrowserSmokeTest#{method}',
        'io.github.coderleexl.rocoapp.test/androidx.test.runner.AndroidJUnitRunner'],
        capture_output=True, text=True, timeout=150)
    text = result.stdout + result.stderr
    (out / f'{method}.txt').write_text(text, encoding='utf-8')
    print(text)
    if result.returncode or 'OK (1 test)' not in text or 'FAILURES!!!' in text:
        excerpt = text[-11000:].replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
        print(f'::error title=Smoke test {method}::{excerpt}', flush=True)
        raise RuntimeError(f'Instrumentation failed: {method}')
print('All three separate-process smoke tests passed')
