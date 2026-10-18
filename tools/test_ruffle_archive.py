"""Supply-chain boundary tests with synthetic packages; no external requests."""
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import ruffle_archive as r


def package(path, files):
    with zipfile.ZipFile(path, "w") as z:
        for name, data in files.items():
            z.writestr(name, data)


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base_path = Path(self.tmp.name) / "base.xpi"
        self.custom_path = Path(self.tmp.name) / "custom.xpi"
        self.manifest = {"version": "0.7.1.65535", "permissions": ["storage"],
                         "browser_specific_settings": {"gecko": {"id": "fixed-id"}}}
        self.original = {"manifest.json": json.dumps(self.manifest).encode(), "dist/content.js": b"original",
                         "_locales/en/messages.json": b"{}", "LICENSE": b"original license"}
        package(self.base_path, self.original)
        self.base = {"version": "0.7.1", "sha256": r.digest(self.base_path.read_bytes()), "extension_id": "fixed-id"}
        self.fix = {"id": "test-fix", "source_sha256": "source", "patch_sha256": "patch", "manifest_version": "0.7.2.1"}
        self.files = dict(self.original)
        self.files["manifest.json"] = json.dumps(dict(self.manifest, version="0.7.2.1")).encode()
        for name in ["dist/ruffle.js", "dist/110.js", "dist/993.js", "dist/assets/ruffle_web_bg.wasm",
                     "dist/assets/ruffle_web-wasm_mvp_bg.wasm"]:
            self.files[name] = b"rebuilt " + name.encode()
        self.provenance = {k: self.fix[k] for k in ("id", "source_sha256", "patch_sha256")}
        self.provenance["upstream_sha256"] = self.base["sha256"]
        self.provenance["runtime_sha256"] = {n: r.digest(b) for n, b in self.files.items() if r.RUNTIME.fullmatch(n)}
        self.files[r.PROVENANCE] = json.dumps(self.provenance).encode()
        self.addCleanup(patch.stopall)
        patch.object(r, "locks", return_value=(self.base, self.fix)).start()

    def verify(self):
        package(self.custom_path, self.files)
        return r.verify_runtime(self.custom_path, self.base_path)

    def test_accepts_declared_runtime_and_preserves_permissions(self):
        files, metadata = self.verify()
        self.assertEqual(files["LICENSE"], self.original["LICENSE"])
        self.assertEqual(metadata["permissions"], ["storage"])
        self.assertEqual(metadata["id"], "fixed-id")
        self.assertEqual(metadata["enginePatch"], "test-fix")

    def test_rejects_permission_or_id_change(self):
        manifest = dict(self.manifest, version="0.7.2.1", permissions=["storage", "tabs"])
        self.files["manifest.json"] = json.dumps(manifest).encode()
        with self.assertRaisesRegex(RuntimeError, "manifest"):
            self.verify()

    def test_rejects_unrelated_script_change_or_missing_locale(self):
        for name in ("dist/content.js", "_locales/en/messages.json"):
            with self.subTest(name=name):
                before = self.files.pop(name)
                with self.assertRaisesRegex(RuntimeError, "outside engine"):
                    self.verify()
                self.files[name] = before

    def test_rejects_runtime_tamper(self):
        self.files["dist/110.js"] += b"changed"
        with self.assertRaisesRegex(RuntimeError, "runtime checksum"):
            self.verify()

    def test_rejects_wrong_patch_provenance(self):
        self.provenance["patch_sha256"] = "other-patch"
        self.files[r.PROVENANCE] = json.dumps(self.provenance).encode()
        with self.assertRaisesRegex(RuntimeError, "provenance"):
            self.verify()

    def test_rejects_unsafe_path(self):
        self.files["../outside"] = b"bad"
        with self.assertRaisesRegex(RuntimeError, "Unsafe"):
            self.verify()


if __name__ == "__main__":
    unittest.main()
