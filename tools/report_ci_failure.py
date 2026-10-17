"""Expose a small build-error excerpt as a public check annotation (no credentials)."""
from pathlib import Path
import sys

p = Path(sys.argv[1])
if p.exists():
    lines = p.read_text(errors='replace').splitlines()
    hits = [i for i, line in enumerate(lines) if any(word in line.lower() for word in ('error', 'exception', 'failed', 'what went wrong'))]
    selected = sorted({j for i in hits[-12:] for j in range(max(0, i-1), min(len(lines), i+4))})
    text = '\n'.join(lines[i] for i in selected)[-14000:] or '\n'.join(lines[-15:])
    text = text.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
    print(f'::error title=Build failure excerpt::{text}')
