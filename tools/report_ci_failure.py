"""Expose a small build-error excerpt as a public check annotation (no credentials)."""
from pathlib import Path
import sys

p = Path(sys.argv[1])
if p.exists():
    lines = p.read_text(errors='replace').splitlines()
    text = '\n'.join(lines[-180:])[-22000:]
    text = text.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
    print(f'::error title=Build failure excerpt::{text}')
