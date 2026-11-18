"""Align/sign a Release APK using private material supplied outside the repository."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tools', required=True, type=Path)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--expected-cert', required=True)
    args = parser.parse_args()
    secret = os.environ.get('ANDROID_RELEASE_SIGNING_JSON')
    if not secret:
        raise SystemExit('Configure ANDROID_RELEASE_SIGNING_JSON in repository Actions secrets first.')
    config = json.loads(secret)
    required = ['keystore_base64', 'alias', 'store_password', 'key_password']
    if any(not isinstance(config.get(k), str) or not config[k] for k in required):
        raise SystemExit('Signing secret is missing required fields')
    if any('\n' in config[k] or '\r' in config[k] for k in ['store_password', 'key_password']):
        raise SystemExit('Signing passwords must be single line')
    expected = args.expected_cert.lower().replace(':', '')
    if not re.fullmatch('[0-9a-f]{64}', expected):
        raise SystemExit('Invalid expected public certificate fingerprint')
    key = base64.b64decode(config['keystore_base64'], validate=True)
    if len(key) > 1024 * 1024:
        raise SystemExit('Unexpected keystore size')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    # TemporaryDirectory is private and removed even when a signing command fails.
    with tempfile.TemporaryDirectory(prefix='time-casket-sign-') as name:
        private = Path(name)
        for filename, content in [('release.jks', key), ('storepass', config['store_password'].encode()), ('keypass', config['key_password'].encode())]:
            path = private / filename
            path.write_bytes(content)
            path.chmod(0o600)
        aligned = private / 'aligned.apk'
        subprocess.run([str(args.tools / 'zipalign'), '-P', '16', '-f', '4', str(args.input), str(aligned)], check=True)
        subprocess.run([str(args.tools / 'apksigner'), 'sign', '--ks', str(private / 'release.jks'),
                        '--ks-key-alias', config['alias'], '--ks-pass', 'file:' + str(private / 'storepass'),
                        '--key-pass', 'file:' + str(private / 'keypass'), '--out', str(args.output), str(aligned)], check=True)
    verified = subprocess.run([str(args.tools / 'apksigner'), 'verify', '--verbose', '--print-certs', str(args.output)], check=True, capture_output=True, text=True)
    fingerprints = re.findall(r'Signer #\d+ certificate SHA-256 digest: ([0-9a-fA-F:]+)', verified.stdout)
    if len(fingerprints) != 1 or fingerprints[0].lower().replace(':', '') != expected:
        args.output.unlink(missing_ok=True)
        raise SystemExit('Signing certificate does not match the pinned release identity')
    subprocess.run([str(args.tools / 'zipalign'), '-c', '-P', '16', '4', str(args.output)], check=True)
    with args.output.open('rb') as stream:
        checksum = hashlib.file_digest(stream, 'sha256').hexdigest()
    args.output.with_suffix('.apk.sha256').write_text(checksum + '  ' + args.output.name + '\n', encoding='utf-8')
    print('Verified release signature and alignment; public certificate SHA256: ' + expected)
    print('APK SHA256: ' + checksum)


if __name__ == '__main__':
    main()
