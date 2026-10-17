"""Expose a small build-error excerpt as a public check annotation (no credentials)."""
from pathlib import Path
import sys

p = Path(sys.argv[1])
if p.exists():
    lines = p.read_text(errors='replace').splitlines()
    text = '\n'.join(lines[-180:])[-22000:]
    # GitHub check annotations truncate long individual messages. Keep each
    # chunk below that limit so the actual final exception stays observable.
    for offset in range(0, len(text), 3000):
        chunk = text[offset:offset+3000].replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
        print(f'::error title=Build failure excerpt {offset // 3000 + 1}::{chunk}')
