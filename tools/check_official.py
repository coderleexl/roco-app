"""Public, unauthenticated network observation. Does not print headers/bodies/tokens."""
import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urlsplit

results = []
for path in ('/', '/default.html', '/iframe.html', '/cgi-bin/login'):
    started = time.monotonic()
    record = {'host': '17roco.qq.com', 'path': path}
    try:
        request = urllib.request.Request('https://17roco.qq.com' + path, headers={'User-Agent': 'Mozilla/5.0 RocoProbe/0.1'})
        with urllib.request.urlopen(request, timeout=20) as response:
            url = urlsplit(response.url)
            record.update(status=response.status, final_host=url.hostname,
                final_path=url.path if url.path in ('/', '/default.html', '/iframe.html', '/cgi-bin/login', '/fcgi-bin/login2') else '[redacted]')
    except urllib.error.HTTPError as e:
        record.update(status=e.code)
    except Exception as e:
        record.update(error=type(e).__name__)
    record['ms'] = round((time.monotonic() - started) * 1000)
    results.append(record)
directory = Path('test-results'); directory.mkdir(exist_ok=True)
(directory / 'public-entry.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
print(json.dumps(results, indent=2))
