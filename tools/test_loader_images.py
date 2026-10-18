"""Run an original red/blue Loader fixture in an isolated, unauthenticated browser."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
from urllib.parse import parse_qs, urlsplit
import zipfile
from ruffle_archive import ROOT, digest, upstream, verify_runtime


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--expect", choices=["baseline-bug", "fixed"], required=True)
    parser.add_argument("--browser")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    archive = args.archive or upstream()
    if args.expect == "fixed":
        verify_runtime(archive)
    else:
        base = json.loads((ROOT / "third-party/ruffle.json").read_text())
        if digest(archive.read_bytes()) != base["sha256"]:
            raise RuntimeError("Baseline test requires the pinned original engine")
    fixture = ROOT / "tools/fixtures/loader-image-cancel"
    hashes = json.loads((fixture / "sha256.json").read_text())
    for name, expected in hashes.items():
        if digest((fixture / name).read_bytes()) != expected:
            raise RuntimeError("Original fixture checksum mismatch")
    browser = args.browser or os.environ.get("CHROME_BIN")
    if not browser:
        browser = next((shutil.which(n) for n in ("google-chrome", "chromium", "chromium-browser") if shutil.which(n)), None)
    if not browser and os.name == "nt":
        browser = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not browser:
        raise RuntimeError("Chrome/Chromium is required for the original local fixture")
    results, steps, errors = [], [], []
    finished = threading.Event()
    with tempfile.TemporaryDirectory(prefix="ruffle-image-test-") as tmp:
        directory = Path(tmp)
        shutil.copyfile(fixture / "index.html", directory / "index.html")
        shutil.copyfile(fixture / "probe.swf", directory / "probe.swf")
        with zipfile.ZipFile(archive) as z:
            for name in z.namelist():
                if name.startswith("dist/") and not name.endswith("/"):
                    target = directory / name
                    if not target.resolve().is_relative_to(directory.resolve()):
                        raise RuntimeError("Unsafe engine archive")
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(z.read(name))

        class Handler(SimpleHTTPRequestHandler):
            def __init__(self, *a, **kw):
                super().__init__(*a, directory=str(directory), **kw)

            def log_message(self, *a):
                pass

            def do_GET(self):
                url = urlsplit(self.path)
                query = parse_qs(url.query)
                if url.path in ("/step", "/result", "/error"):
                    if url.path == "/step":
                        steps.append({k: int(query.get(k, ["-1"])[0]) for k in ("phase", "color")})
                    elif url.path == "/result":
                        results.append({k: int(query.get(k, ["-1"])[0]) for k in ("ok", "count")})
                        finished.set()
                    else:
                        errors.append(query.get("message", [""])[0][:1800])
                    self.send_response(204)
                    self.end_headers()
                    return
                super().do_GET()

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        command = [browser, "--headless=new", "--no-first-run", "--no-default-browser-check",
                   "--disable-background-networking", "--disable-dev-shm-usage",
                   "--autoplay-policy=no-user-gesture-required", "--enable-unsafe-swiftshader",
                   "--use-angle=swiftshader", "--user-data-dir=" + str(directory / "profile"),
                   f"http://127.0.0.1:{server.server_port}/index.html"]
        process = None
        try:
            process = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                       creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            finished.wait(90)
            time.sleep(0.7)  # Catch duplicate COMPLETE callbacks after the first result.
        finally:
            if process is not None:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=10)
            server.shutdown()
            server.server_close()
    colors = [1, 2, 1 if args.expect == "baseline-bug" else 2]
    expected_steps = [{"phase": i, "color": color} for i, color in enumerate(colors)]
    expected_results = [{"ok": 0 if args.expect == "baseline-bug" else 1, "count": 1}]
    report = {"expectation": args.expect, "steps": steps, "results": results,
              "errors": errors, "passed": steps == expected_steps and results == expected_results and not errors}
    print(json.dumps(report, ensure_ascii=True))
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2), encoding="utf-8")
    if not report["passed"]:
        raise RuntimeError("Loader fixture did not match the exact expected sequence")


if __name__ == "__main__":
    main()
