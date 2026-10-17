"""Check that Android asset filtering did not alter the pinned extension."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def verify(apk_path, xpi_path):
    with zipfile.ZipFile(xpi_path) as upstream, zipfile.ZipFile(apk_path) as apk:
        packaged = set(apk.namelist())
        for entry in upstream.infolist():
            if entry.is_dir():
                continue
            name = "assets/ruffle/" + entry.filename
            if name not in packaged:
                raise RuntimeError(f"APK dropped required extension file: {entry.filename}")
            if upstream.read(entry) != apk.read(name):
                raise RuntimeError(f"APK changed pinned extension file: {entry.filename}")
    print("APK contains the complete, unmodified pinned Ruffle extension")

if __name__ == "__main__":
    lock = json.loads((ROOT / "third-party/ruffle.json").read_text())
    xpi = ROOT / ".cache/ruffle.xpi"
    if hashlib.sha256(xpi.read_bytes()).hexdigest() != lock["sha256"]:
        raise RuntimeError("Upstream archive checksum mismatch")
    verify(sys.argv[1], xpi)
