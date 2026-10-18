# Compatibility gates

Build and fixture results must come from the matching GitHub commit/run, not from the existence of this source code. Current live results: [Actions](https://github.com/coderleexl/roco-app/actions/workflows/android.yml).

| Gate | Status / evidence needed |
|---|---|
| GitHub APK build / lint / unit tests | Passed: commit ba84be2, run39091368510; complete packaged extension verified byte-for-byte |
| Ruffle installed and original fixture executes ActionScript | Passed: run39091368510, fixed local fixture requests legacy webgl; default wgpu remains unsupported on this emulator |
| Associated popup opener, shared cookie and close callback | Passed: run39091368510, includes opener focus selecting main while child remains alive |
| Fixture cookie survives process restart | Passed: run39091368510, separate seed/check instrumentation processes without reseeding |
| Complete official game page | Not verified on prototype |
| User authenticates and game receives valid login | Not verified |
| Server list and selection | Not verified |
| Map, character, resources | Not verified |
| Movement, interface and one basic battle | Not verified |
| 15-minute stability | Not verified |
| Official session recovery / re-login after restart | Not verified; fixture cookies do not prove game authentication |

No game compatibility scripts are currently installed. Ruffle's complete upstream Firefox extension is used; packaged APIs and runtime behavior are validated by installation and Flash smoke tests, not assumed from Firefox support.

## Emulator default-renderer failure

Run39090025900 / commit9aeb81d: original one-frame FSCommand SWF on API35 x86_64 SwiftShader reaches Ruffle/wgpu30.0.1 pipeline creation and panics: `Vertex shader active uniforms exceed GL_MAX_VERTEX_UNIFORM_VECTORS (256)`. Wasm stack reaches `wgpu::Device::create_render_pipeline` and `ruffle_render_wgpu::pipelines::create_shape_pipeline`, before game/login logic. Reproduce with Debug self-test at commit9aeb81d, original extension0.7.1 and default renderer.

Bounded workaround: only the fixed local self-test sets `preferredRenderer: webgl`, using the upstream supported legacy WebGL backend. No renderer is forced on official game or authentication pages. This tests Flash execution and browser/window/session plumbing; it does not prove default wgpu compatibility on emulator or Meizu hardware. Legacy WebGL supports fewer rendering features. See [upstream rendering options](https://ruffle.rs/js-docs/master/enums/Config.RenderBackend.html). Upstream engine/shader repair and physical-device confirmation remain separate decisions; no engine binary was patched.

Verified run: [Actions39090465122](https://github.com/coderleexl/roco-app/actions/runs/39090465122), source ec114ef. These results do not pass any official-game acceptance gate.

2026-10-18 latest verification: ba84be2 / run39091368510 build and all three smoke methods passed; local Windows build and signature/asset checks passed. Main APK installed successfully on Meizu21 with user approval. Actual website, renderer, authentication and game gates on that phone remain unverified pending user operation. See handoff.md.
