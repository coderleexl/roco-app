# Architecture

- Kotlin Android View app, one process-level GeckoRuntime with normal persistent profile. A main GeckoSession and at most four associated sessions share that runtime. No cross-app Firefox cookie access.
- `onNewSession` returns a **new unopened** session. Gecko opens it and establishes its opener; app retains it and attaches the view only after open. Do not manually navigate that child using the informational URI.
- JavaScript alert/confirm/prompt have native presentation and user responses. Authentication stays on official pages; unsupported external-app schemes are blocked with an explanation, not silently launched.
- Official Firefox Ruffle extension is downloaded at build time with fixed version and SHA256, unpacked into generated assets, and registered via GeckoView `ensureBuiltIn`. Runtime renderer is browser/Wasm, not native Ruffle.
- A separate bundled metadata-only diagnostics extension uses `webRequest` plus GeckoView native messaging. Scope is 17roco.qq.com and its subdomains. Other CDNs/auth hosts are not recorded in v1. No raw JS/Ruffle error text is persisted; debug inspection remains manual.
- Main website is never replaced with a standalone game SWF. App does not invent FlashVars or rewrite login endpoints. Browser CORS and certificate validation stay enabled. A separate compatibility extension applies one explicit public-asset response exception described below.
- Debug self-test server binds **127.0.0.1 only**, ephemeral port, fixed fixture routes, no proxy or arbitrary-file access. Original tiny ActionScript SWF emits FSCommand to prove actual execution. It never simulates successful game authentication.
- A local TCP bridge/native Ruffle route is not implemented. It requires observed game calls and an explicit architecture decision.

References: [GeckoView extensions](https://firefox-source-docs.mozilla.org/mobile/android/geckoview/consumer/web-extensions.html), [Ruffle upstream](https://github.com/ruffle-rs/ruffle), [Ruffle JS API](https://ruffle.rs/js-docs/master/interfaces/Player.PlayerV1.html).

## Public SWF response compatibility (0.1.1)

Real Meizu0.1.0 evidence identifies the root movie fetch as CORS-blocked, not a login error: official SWF HTTP200 lacks Access-Control-Allow-Origin. `compatibility/public-swf.js` uses Firefox webRequest.onHeadersReceived with blocking/responseHeaders; its separate built-in MV2 manifest declares only the official document host and resource host. App waits for both compatibility extension installation and Ruffle installation before initial navigation; compatibility installation failure prevents automatic game entry and is visible in diagnostics.

The exception requires all of: HTTPS exact resource origin `https://res.17roco.qq.com`, path `/swf/ROCO-Z8.swf`, GET/XHR, HTTP200 and Flash MIME; trusted initiating `https://17roco.qq.com/` or `/default.html`; no existing ACAO or credentialed-CORS policy header. It adds only `Access-Control-Allow-Origin: https://17roco.qq.com`, preserving all other headers and the body. It never enables credentialed cross-origin reads, changes request cookies, touches authentication endpoints, logs response headers/bodies, grants arbitrary-origin access or disables browser security globally. Missing initiator or unexpected MIME/status fails closed. Source query strings are used only by the browser request, not persisted by the adapter. Normal login, parent window and iframe environment remain intact.

This is a deliberate, narrowly scoped app response-policy exception for an already publicly downloadable resource. It is not proof of login, other resources, rendering, or full game compatibility. Changes to other assets require new observed evidence and boundary tests.
