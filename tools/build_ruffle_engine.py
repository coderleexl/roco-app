"""Build the pinned Loader image fix; never sign/publish or modify game content."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import zipfile
from ruffle_archive import (ROOT, RUNTIME, PROVENANCE, digest, download,
                            entries, locks, upstream, verify_runtime)


def run(args, cwd, env=None):
    print("Running: " + " ".join(args), flush=True)
    subprocess.run(args, cwd=cwd, env=env, check=True)


def main():
    base, fix = locks()
    source = download(fix["source_url"], ROOT / ".cache/ruffle-source-071.tar.gz", fix["source_sha256"])
    # Dedicated fresh extraction: never edit a checkout or developer configuration.
    work = ROOT / ".cache/ruffle-engine-build"
    if work.exists():
        raise RuntimeError("Build directory exists. Reuse the CI artifact or choose a fresh workspace.")
    work.mkdir(parents=True)
    with tarfile.open(source) as archive:
        members = archive.getmembers()
        prefix = members[0].name.split("/")[0]
        for member in members:
            relative = Path(*Path(member.name).parts[1:])
            if member.name.split("/")[0] != prefix or not (work / relative).resolve().is_relative_to(work.resolve()):
                raise RuntimeError("Unsafe engine source archive")
            if member.isdir():
                (work / relative).mkdir(parents=True, exist_ok=True)
            elif member.isfile():
                path = work / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(member) as src, path.open("wb") as dest:
                    shutil.copyfileobj(src, dest)
            else:
                raise RuntimeError("Unexpected source archive link or special file")
    git = "git.exe" if os.name == "nt" else "git"
    run([git, "apply", "--check", str(ROOT / fix["patch"])], work)
    run([git, "apply", str(ROOT / fix["patch"])], work)
    npm = "npm.cmd" if os.name == "nt" else "npm"
    npx = "npx.cmd" if os.name == "nt" else "npx"
    web = work / "web"
    seal = {"version_number": base["version"], "version_name": base["version"] + "+" + fix["id"],
            "version_channel": "time-casket", "build_date": "2026-10-18T00:00:00.000Z",
            "commitHash": "upstream-v" + base["version"] + "+" + fix["id"],
            "version4": fix["manifest_version"], "firefox_extension_id": base["extension_id"]}
    (web / "version_seal.json").write_text(json.dumps(seal), encoding="utf-8")
    env = dict(os.environ, ENABLE_VERSION_SEAL="true", BUILD_WASM_MVP="true", CARGO_FEATURES="jpegxr")
    actual_bindgen = subprocess.check_output(["wasm-bindgen", "--version"], text=True).strip()
    if actual_bindgen != "wasm-bindgen " + fix["wasm_bindgen_version"]:
        raise RuntimeError("Wrong wasm-bindgen CLI version")
    run([npm, "ci"], web, env)
    run([npm, "run", "build", "--workspace=ruffle-core"], web, env)
    extension = web / "packages/extension"
    run([npx, "tsc", "-p", "jsconfig.json"], extension, env)
    run([npx, "webpack", "--env", "firefox"], extension, env)
    with zipfile.ZipFile(upstream()) as archive:
        original = entries(archive)
    # Only the coupled page engine/chunks/Wasm change. Browser integration,
    # permissions, translations, license files and ID remain upstream bytes.
    files = {n: data for n, data in original.items() if not RUNTIME.fullmatch(n)}
    dist = extension / "assets/dist"
    runtime = {"dist/" + p.relative_to(dist).as_posix(): p.read_bytes()
               for p in dist.rglob("*") if p.is_file()
               and RUNTIME.fullmatch("dist/" + p.relative_to(dist).as_posix())}
    files.update(runtime)
    manifest = json.loads(files["manifest.json"])
    manifest["version"] = fix["manifest_version"]
    files["manifest.json"] = json.dumps(manifest).encode()
    provenance = {"id": fix["id"], "source_sha256": fix["source_sha256"],
                  "patch_sha256": fix["patch_sha256"], "upstream_sha256": base["sha256"],
                  "runtime_sha256": {n: digest(data) for n, data in runtime.items()},
                  "wasm_bindgen_version": fix["wasm_bindgen_version"], "features": ["jpegxr", "wasm_mvp"]}
    files[PROVENANCE] = json.dumps(provenance, sort_keys=True).encode()
    output = ROOT / ".cache/ruffle-patched.xpi"
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(files.items()):
            archive.writestr(name, data)
    _, metadata = verify_runtime(output)
    print(json.dumps(metadata, sort_keys=True))


if __name__ == "__main__":
    main()
