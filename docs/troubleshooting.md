# Troubleshooting

- **Ruffle installation fails**: confirm build metadata and pinned digest. Inspect extension manifest/API compatibility through authorized remote debugging. App must show the failure, not label it game success.
- **Website opens but Flash does not**: inspect resource status, Ruffle execution errors and content scripts. Do not substitute a standalone SWF as evidence that official login works.
- **Login click does nothing**: distinguish touch dispatch, ExternalInterface/parent callbacks, new-window callback and blocked external scheme. Native JavaScript confirmation dialogs require a user decision.
- **404 on `/cgi-bin/login`**: record the calling page and redirect evidence. Do not guess a replacement endpoint or authentication parameters.
- **Login window opens but cannot return**: inspect opener relationship, focus/close callbacks and shared runtime/profile. Do not extract skey/uin cookies to manufacture a login.
- **Server selection hangs**: look for actual Socket/XMLSocket calls, HTTP errors or unimplemented Ruffle functionality before proposing a restricted local TCP bridge.
- **CI fails**: read build annotations, job logs and reports. Reproduce exact pinned versions. Tool-policy rejection is a blocker to report, not a reason to change command spelling to evade it.
- **APK update signature conflict**: different ephemeral CI keys can conflict. Stop and ask before uninstalling or clearing data.
- **Session expires**: official browser cookies can expire; authenticate again normally. Browser persistence does not guarantee unlimited game login.

Do not change VPS, proxy, TUN, IPv6, certificates or global browser safety settings to work around unexplained game failures.

## Emulator Wasm unreachable / shader validation

On the API35 SwiftShader emulator, default Ruffle0.7.1 wgpu initialization panicked in create_shape_pipeline with `GL_MAX_VERTEX_UNIFORM_VECTORS (256)` exceeded. The original SWF executed in isolated Windows Chrome; Android self-test passed after requesting upstream legacy `webgl`. The override is limited to the fixed local fixture, with reduced feature coverage. It does not fix or prove official game rendering on a phone. See compatibility.md for exact failed and passing runs. Do not treat this message as a login/network failure or change system proxies.
