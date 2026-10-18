# Compatibility gates

Build and fixture results must come from the matching GitHub commit/run, not from the existence of this source code. Current live results: [Actions](https://github.com/coderleexl/roco-app/actions/workflows/android.yml).

| Gate | Status / evidence needed |
|---|---|
| GitHub APK build / lint / unit tests | Passed: run39043167729 and run39089159173; source build and packaged extension integrity verified |
| Ruffle installed and original fixture executes ActionScript | Installation passed; default wgpu renderer panics on emulator shader uniform limit256. Fixture now explicitly tests legacy webgl; result pending. Official pages keep default renderer and remain unverified |
| Associated popup opener, shared cookie and close callback | Pending emulator smoke |
| Fixture cookie survives process restart | Pending two separate instrumentation runs |
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
