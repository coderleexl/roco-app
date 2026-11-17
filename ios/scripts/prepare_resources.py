"""Recover the exact patched runtime from the immutable checked Android release.

Reuses engine bytes, not Android code. Does not download any game content.
"""
import hashlib
import json
from pathlib import Path
import shutil
import sys
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from ruffle_archive import verify_runtime

APK_SHA = '340bc28ca3b76b21a53f280d3bb126ddc49592259112ccab42f0588a1d22fa52'
APK_URL = 'https://github.com/coderleexl/roco-app/releases/download/v0.1.27/time-casket-0.1.27-debug.apk'

def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def main():
    cache = ROOT / '.cache'
    cache.mkdir(exist_ok=True)
    apk = cache / 'ios-runtime-source.apk'
    xpi = cache / 'ios-verified-runtime.xpi'
    if not apk.exists() or sha(apk) != APK_SHA:
        partial = apk.with_suffix('.partial')
        with urllib.request.urlopen(APK_URL, timeout=180) as response, partial.open('wb') as out:
            shutil.copyfileobj(response, out)
        if sha(partial) != APK_SHA:
            partial.unlink(); raise RuntimeError('Release APK checksum mismatch')
        partial.replace(apk)
    with zipfile.ZipFile(apk) as source, zipfile.ZipFile(xpi, 'w', zipfile.ZIP_DEFLATED) as target:
        for name in source.namelist():
            if name.startswith('assets/ruffle/') and not name.endswith('/'):
                target.writestr(name.removeprefix('assets/ruffle/'), source.read(name))
    files, metadata = verify_runtime(xpi)
    output = ROOT / 'ios/TimeCasket/Resources'
    output.mkdir(exist_ok=True)
    # Only generated dist is replaced; manually maintained app source is never removed.
    if (output / 'dist').exists():
        shutil.rmtree(output / 'dist')
    for name, data in files.items():
        if name.startswith('dist/'):
            dest = output / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
    compat = ROOT / 'app/src/main/assets/compatibility'
    for name in ['player-options.js', 'audio-unlock.js', 'game-view.js', 'game-http.js']:
        shutil.copyfile(compat / name, output / name)
    shutil.copyfile(ROOT / 'ios/TimeCasket/bridge.js', output / 'bridge.js')
    shutil.copyfile(ROOT / 'third-party/NOTICE.md', output / 'NOTICE.md')
    (output / 'engine-build.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    print('Verified and prepared patched standard/MVP Ruffle runtime')

if __name__ == '__main__':
    main()
