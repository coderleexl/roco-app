"""Fetch the pinned upstream extension; verify bytes before unpacking into APK assets."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def main():
    lock = json.loads((ROOT / 'third-party/ruffle.json').read_text())
    cache = ROOT / '.cache/ruffle.xpi'
    cache.parent.mkdir(exist_ok=True)
    if not cache.exists() or hashlib.sha256(cache.read_bytes()).hexdigest() != lock['sha256']:
        temporary = cache.with_suffix('.partial')
        request = urllib.request.Request(lock['url'], headers={'User-Agent': 'RocoProbe-build'})
        with urllib.request.urlopen(request, timeout=90) as response, temporary.open('wb') as output:
            shutil.copyfileobj(response, output)
        if hashlib.sha256(temporary.read_bytes()).hexdigest() != lock['sha256']:
            temporary.unlink()
            raise RuntimeError('Ruffle SHA256 mismatch')
        os.replace(temporary, cache)
    destination = ROOT / 'app/build/generated/ruffleAssets/ruffle'
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(cache) as archive:
        for member in archive.infolist():
            path = (destination / member.filename).resolve()
            if not path.is_relative_to(destination.resolve()):
                raise RuntimeError('Unsafe archive path')
        archive.extractall(destination)
    manifest = json.loads((destination / 'manifest.json').read_text())
    extension_id = manifest.get('browser_specific_settings', manifest.get('applications', {})).get('gecko', {}).get('id')
    if not extension_id or manifest['version'] != lock['version']:
        raise RuntimeError('Unexpected extension identity/version')
    (destination.parent / 'ruffle-build.json').write_text(json.dumps({
        'version': lock['version'], 'id': extension_id, 'sha256': lock['sha256'],
        'permissions': manifest.get('permissions', [])
    }), encoding='utf-8')
    print(f"Verified Ruffle {lock['version']} ({extension_id})")

if __name__ == '__main__':
    main()
