"""Prepare the exact checked debug artifact, without rebuilding or changing signing."""
import hashlib
from pathlib import Path
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    config = (ROOT / "app/build.gradle.kts").read_text(encoding="utf-8")
    version = re.search(r'versionName = "([0-9]+\.[0-9]+\.[0-9]+)"', config).group(1)
    if not (ROOT / "docs/releases" / (version + ".md")).is_file():
        raise RuntimeError("Release requires reviewed version-specific notes")
    apks = list(Path(sys.argv[1]).rglob("app-debug.apk"))
    if len(apks) != 1:
        raise RuntimeError("Expected exactly one checked main APK")
    apk = apks[0]
    expected = (apk.parent / "SHA256SUMS.txt").read_text().split()[0]
    actual = hashlib.sha256(apk.read_bytes()).hexdigest()
    if expected != actual:
        raise RuntimeError("Release APK differs from the checked build artifact")
    out = ROOT / "release-assets"
    out.mkdir(exist_ok=False)
    filename = f"time-casket-{version}-debug.apk"
    shutil.copyfile(apk, out / filename)
    (out / "SHA256SUMS.txt").write_text(f"{actual}  {filename}\n", encoding="utf-8")
    (out / "VERSION").write_text(version, encoding="utf-8")
    print(f"Prepared {filename}, SHA256 {actual}")


if __name__ == "__main__":
    main()
