# Original Loader cancellation regression

This is original project test data: two generated solid-color 60×60 PNGs in AS3.
No Tencent code, assets, authentication or gameplay are included.

`ImageProbe.as` reuses one Loader and ByteArray. It loads red, then blue; finally
it starts red, immediately unloads it and starts blue. Correct colors are
`red, blue, blue`, with one final COMPLETE. Upstream Ruffle 0.7.1 instead returns
`red, blue, red`. Callbacks report only phase/color integers and completion count.

The committed `probe.swf` was compiled with JPEXS FFDec 26.3.0's AS3 compiler and
Adobe playerglobal 32 definitions from a minimal original AS3 seed. Source,
compiled movie and harness hashes are in `sha256.json`. Compiler/player library
are development tools, not application or fixture payloads.

```sh
python tools/test_loader_images.py --expect baseline-bug
python tools/test_loader_images.py --archive .cache/ruffle-patched.xpi --expect fixed
```

Chrome/Chromium required. The runner uses a temporary browser profile and a
loopback-only server, checks the exact sequence and duplicate completion count,
and closes both afterwards. Only this local fixture explicitly uses legacy
WebGL for SwiftShader. It does not change the official game's automatic renderer
and takes no screenshots. Passing this fixture is not game acceptance.
