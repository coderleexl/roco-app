"""Check the complete APK extension against the verified source-patched package."""
import sys
import zipfile
from ruffle_archive import patched_archive, verify_runtime


def verify(apk_path, xpi_path):
    files, _ = verify_runtime(xpi_path)
    with zipfile.ZipFile(apk_path) as apk:
        packaged = {n for n in apk.namelist() if n.startswith("assets/ruffle/") and not n.endswith("/")}
        expected = {"assets/ruffle/" + n for n in files}
        if packaged != expected:
            raise RuntimeError("APK extension file set differs from verified engine package")
        for name, data in files.items():
            if apk.read("assets/ruffle/" + name) != data:
                raise RuntimeError(f"APK changed verified extension file: {name}")
    print("APK contains the complete verified Ruffle package with the declared loader patch")


if __name__ == "__main__":
    verify(sys.argv[1], patched_archive())
