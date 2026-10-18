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

### Observed additional movies (0.1.2)

After user-operated QR authentication on0.1.1, read-only frame/player inspection identifies homepage `/preloader.swf` and post-scan `/main.swf` from res.17roco.qq.com. Both are CORS-blocked atHTTP200 with Flash MIME; independent unauthenticated HEAD confirms noACAO. Version0.1.2 adds exactly those two public paths, retaining every method/status/MIME/existing-policy restriction above. Preloader is allowed only from the same homepage paths as ROCO-Z8; main is allowed only from exact HTTPS web2.17roco.qq.com origin. Its document path is deliberately not guessed or persisted because authenticated navigation can vary. ACAO equals the corresponding trusted initiating origin, never wildcard. Separate manifest permissions cover web2 and the two exact resource path patterns; code rejects suffix lookalikes. Authentication endpoints, third-party advertising SWFs and all other assets remain untouched. Compatibility extension version1.0.1 ensures the bundled update is distinguishable. Real-device effect awaits approved installation and user retest.

### Public version configuration (0.1.3)

On0.1.2 both preloader and main reach readyState2 with metadata and no error overlay. The next observed failure is exact public `/ver.config` on the same res host, requested by the web2 game frame: two missingACAO PageErrors atHTTP200. Independent unauthenticated HEAD confirms application/octet-stream and217494 bytes. Compatibility1.0.2 adds only this path, only exactHTTPS web2 initiating origin and octet-stream MIME; Flash resources still require Flash MIME. Existing GET/XHR/200 and fail-closed server-policy rules remain. No arbitrary config paths, authentication headers or credentialed-CORS access are enabled.

### Login persistence boundary

The shared normal GeckoRuntime profile already persists browser state; a separate-process fixture proved ordinary persistent Cookie retention, not official login retention. No password vault, extracted auth tickets, callback URL replay or custom authentication is implemented. User should verify a normal close/reopen after game loading is repaired. Successful restoration depends on the official session remaining valid; if it expires, the user completes official authentication again. Do not store authenticated page URLs as a shortcut.

### Homepage animation dependency (0.1.4)

Real0.1.3 PageError confirms exact `/swf/ceils/ROCO-Z8_Ceil_3.swf` missingACAO atHTTP200 while root player remains executable. Compatibility1.0.3 adds this public Flash dependency only for the same official homepage sources as ROCO-Z8. Manifest/listener include its precise pattern and code rejects suffix lookalikes and other numbered siblings. PublicHEAD confirms Flash MIME/164312 bytes; no renderer change is justified by current evidence. Visual recovery and any further dynamic dependencies require user retest. Each preceding adaptation has revealed a separately fetched dependency; this does not prove all resources or the game protocol are compatible.
