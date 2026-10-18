"""Verify the upstream package and the narrowly rebuilt image-loader runtime."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = re.compile(r"dist/(?:ruffle\.js|[0-9]+\.js|assets/ruffle_web(?:-wasm_mvp)?_bg\.wasm)\Z")
PROVENANCE = "time-casket-engine.json"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def locks():
    base = json.loads((ROOT / "third-party/ruffle.json").read_text(encoding="utf-8"))
    fix = json.loads((ROOT / "third-party/ruffle-loader-fix.json").read_text(encoding="utf-8"))
    if fix["base_version"] != base["version"]:
        raise RuntimeError("Engine patch targets a different upstream version")
    if digest((ROOT / fix["patch"]).read_bytes()) != fix["patch_sha256"]:
        raise RuntimeError("Engine patch checksum mismatch")
    return base, fix


def download(url, target, checksum):
    target = Path(target)
    if target.is_file() and digest(target.read_bytes()) == checksum:
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(".partial")
    request = urllib.request.Request(url, headers={"User-Agent": "TimeCasket-build"})
    with urllib.request.urlopen(request, timeout=180) as response, partial.open("wb") as out:
        shutil.copyfileobj(response, out)
    if digest(partial.read_bytes()) != checksum:
        partial.unlink()
        raise RuntimeError("Downloaded archive checksum mismatch")
    partial.replace(target)
    return target


def upstream():
    base, _ = locks()
    return download(base["url"], ROOT / ".cache/ruffle.xpi", base["sha256"])


def entries(archive):
    result = {}
    for entry in archive.infolist():
        name = entry.filename
        if name.startswith(("/", "\\")) or "\\" in name or ".." in name.split("/"):
            raise RuntimeError("Unsafe extension archive path")
        if name in result:
            raise RuntimeError("Duplicate extension archive entry")
        if not entry.is_dir():
            result[name] = archive.read(entry)
    return result


def verify_runtime(archive_path, base_path=None):
    base, fix = locks()
    base_path = Path(base_path) if base_path else upstream()
    if digest(base_path.read_bytes()) != base["sha256"]:
        raise RuntimeError("Upstream archive checksum mismatch")
    with zipfile.ZipFile(base_path) as archive:
        original = entries(archive)
    with zipfile.ZipFile(archive_path) as archive:
        custom = entries(archive)
    if PROVENANCE not in custom:
        raise RuntimeError("Missing engine build provenance; run tools/build_ruffle_engine.py")
    provenance = json.loads(custom[PROVENANCE])
    expected = {"id": fix["id"], "source_sha256": fix["source_sha256"],
                "patch_sha256": fix["patch_sha256"], "upstream_sha256": base["sha256"]}
    if any(provenance.get(key) != value for key, value in expected.items()):
        raise RuntimeError("Wrong engine build provenance")
    manifest = json.loads(custom["manifest.json"])
    original_manifest = json.loads(original["manifest.json"])
    if manifest != dict(original_manifest, version=fix["manifest_version"]):
        raise RuntimeError("Unexpected manifest change (only version may differ)")
    runtime = {name: digest(data) for name, data in custom.items() if RUNTIME.fullmatch(name)}
    if provenance.get("runtime_sha256") != runtime:
        raise RuntimeError("Engine runtime checksum mismatch")
    required = {"dist/ruffle.js", "dist/assets/ruffle_web_bg.wasm",
                "dist/assets/ruffle_web-wasm_mvp_bg.wasm"}
    if not required.issubset(runtime) or len([n for n in runtime if re.fullmatch(r"dist/[0-9]+\.js", n)]) < 2:
        raise RuntimeError("Incomplete standard/MVP engine runtime")
    for name in set(original) | set(custom):
        if name in ("manifest.json", PROVENANCE) or RUNTIME.fullmatch(name):
            continue
        if original.get(name) != custom.get(name):
            raise RuntimeError(f"Unexpected change outside engine runtime: {name}")
    for name in required:
        if custom[name] == original.get(name):
            raise RuntimeError(f"Engine runtime was not rebuilt: {name}")
    return custom, {"version": base["version"] + "+" + fix["id"],
                    "manifestVersion": manifest["version"],
                    "id": base["extension_id"], "sha256": digest(Path(archive_path).read_bytes()),
                    "permissions": manifest.get("permissions", []), "enginePatch": fix["id"],
                    "source_sha256": fix["source_sha256"], "patch_sha256": fix["patch_sha256"],
                    "upstream_sha256": base["sha256"]}


def patched_archive():
    path = ROOT / ".cache/ruffle-patched.xpi"
    if not path.is_file():
        raise RuntimeError("Missing .cache/ruffle-patched.xpi. Build with tools/build_ruffle_engine.py "
                           "or download the matching ruffle-engine artifact from GitHub Actions.")
    return path
