"""Read only bounded enum/number app-private logs; never dump logcat or UI."""
import argparse
import json
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--adb', default='adb')
parser.add_argument('--serial', required=True)
args = parser.parse_args()
for name in ('events.previous.jsonl', 'events.jsonl'):
    result = subprocess.run([args.adb, '-s', args.serial, 'shell', 'run-as', 'io.github.coderleexl.rocoapp',
                             'cat', 'files/diagnostics/' + name], capture_output=True, text=True, timeout=15)
    if result.returncode:
        print(json.dumps({'file': name, 'available': False}))
        continue
    for line in result.stdout.splitlines()[-2500:]:
        try:
            row = json.loads(line)
            if (set(row) != {'at', 'kind', 'number'} or type(row['at']) is not int or
                not isinstance(row['kind'], str) or not re.fullmatch('[a-z_-]{1,40}', row['kind']) or
                row['number'] is not None and type(row['number']) is not int):
                continue
            print(json.dumps(row))
        except (ValueError, TypeError):
            pass
