# Compatibility gates

Build and fixture results must come from the matching GitHub commit/run, not from the existence of this source code. Current live results: [Actions](https://github.com/coderleexl/roco-app/actions/workflows/android.yml).

| Gate | Status / evidence needed |
|---|---|
| GitHub APK build / lint / unit tests | Passed: commit ba84be2, run39091368510; complete packaged extension verified byte-for-byte |
| Ruffle installed and original fixture executes ActionScript | Passed: run39091368510, fixed local fixture requests legacy webgl; default wgpu remains unsupported on this emulator |
| Associated popup opener, shared cookie and close callback | Passed: run39091368510, includes opener focus selecting main while child remains alive |
| Fixture cookie survives process restart | Passed: run39091368510, separate seed/check instrumentation processes without reseeding |
| Complete official game page | Meizu0.1.2 preloader/main now execute with metadata; game loader reports version-file failure, confirmed `/ver.config` missing-ACAO CORS.0.1.3 adaptation awaits user retest |
| User authenticates and game receives valid login | Not verified |
| Server list and selection | Not verified |
| Map, character, resources | Not verified |
| Movement, interface and one basic battle | Not verified |
| 15-minute stability | Not verified |
| Official session recovery / re-login after restart | Not verified; fixture cookies do not prove game authentication |

Version0.1.1 introduces compatibility/public-swf.js, restricted to the evidenced public root SWF response. Local build/tests and package checks passed; authorized in-place installation on Meizu21 returned Success and package inspection confirmed version0.1.1/code2. Website retest awaits user opening/refreshing the app. Per user instruction, cloud checks are no longer an installation prerequisite during local debugging. Ruffle's complete upstream Firefox extension is used; packaged APIs and runtime behavior are validated by installation and Flash smoke tests, not assumed from Firefox support.

## Emulator default-renderer failure

Run39090025900 / commit9aeb81d: original one-frame FSCommand SWF on API35 x86_64 SwiftShader reaches Ruffle/wgpu30.0.1 pipeline creation and panics: `Vertex shader active uniforms exceed GL_MAX_VERTEX_UNIFORM_VECTORS (256)`. Wasm stack reaches `wgpu::Device::create_render_pipeline` and `ruffle_render_wgpu::pipelines::create_shape_pipeline`, before game/login logic. Reproduce with Debug self-test at commit9aeb81d, original extension0.7.1 and default renderer.

Bounded workaround: only the fixed local self-test sets `preferredRenderer: webgl`, using the upstream supported legacy WebGL backend. No renderer is forced on official game or authentication pages. This tests Flash execution and browser/window/session plumbing; it does not prove default wgpu compatibility on emulator or Meizu hardware. Legacy WebGL supports fewer rendering features. See [upstream rendering options](https://ruffle.rs/js-docs/master/enums/Config.RenderBackend.html). Upstream engine/shader repair and physical-device confirmation remain separate decisions; no engine binary was patched.

Verified run: [Actions39090465122](https://github.com/coderleexl/roco-app/actions/runs/39090465122), source ec114ef. These results do not pass any official-game acceptance gate.

2026-10-18 latest verification: ba84be2 / run39091368510 build and all three smoke methods passed; local Windows build and signature/asset checks passed. Main APK installed successfully on Meizu21 with user approval. Actual website, renderer, authentication and game gates on that phone remain unverified pending user operation. See handoff.md.

Real Meizu0.1.0 error is now reproduced and classified as the public root movie CORS failure (HTTP200 missing ACAO), with flashready0 and no game metadata. See reproduction.md and architecture.md for evidence and the exact0.1.1 exception boundary. Node adapter/privacy tests5 pass; local JVM/lint/APK build passes; CI and physical-device retest pending.

0.1.1 actual follow-up: QR interaction is possible, but user reports incomplete homepage animation and the same Flash error after scanning. Read-only evidence confirms `/preloader.swf` on the homepage and `/main.swf` in the official web2 frame are independently CORS-blocked. This is not proof of successful game login.0.1.2 adds those exact public assets with separate source-origin constraints; no game acceptance gate is passed by this source change alone.

0.1.2/code3 is now installed in place on Meizu21: adb returnedSuccess and package inspection confirmed the version. User will verify homepage and post-scan behavior; those gates remain pending. Future project APK upgrades are authorized without repeated permission prompts; device settings/root/data clearing remain outside that authorization.

Latest0.1.3/code4: Node7 tests, JVM4, lint and both APK builds passed locally; signature and official Ruffle assets verified. Installed on Meizu21 in place, Success/version confirmed. Previous0.1.2 now demonstrably executes preloader/main; ver.config adaptation and official session restoration still require user testing. No server/map/battle gate has passed.

0.1.3 homepage visual failure: user sees black background and Start button. Root player executes, but dynamic animation fragment ROCO-Z8_Ceil_3.swf has explicit missingACAO/HTTP200 PageError.0.1.4 adds only that exact homepage dependency. This snapshot contains no game main frame, so ver.config fix remains unverified; no renderer or game login success is inferred.

0.1.4/code5 local Node8/JVM4/lint/bothAPK builds passed; signature and upstream Ruffle assets verified. Meizu in-place installation returnedSuccess, version confirmed; homepage visual recovery awaits user refresh. No new game acceptance gate passed.
