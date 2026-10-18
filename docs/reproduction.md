# Reproduction record

## Historical user observations — not reproduced by this implementation

1. Firefox with Ruffle loads the official website.
2. Separately loading `ROCO-Z8.swf` shows game content, but login does not complete. Unknown whether parent-page functions, window creation, authentication or engine behavior is responsible.
3. Official site's “Flash may be abnormal” confirmation invoked `/cgi-bin/login` and returned 404. This is **separate from item 2**.
4. `/iframe.html` previously redirected to `web2.17roco.qq.com/fcgi-bin/login2` with a platform parameter. Treat all entry/parameter observations as temporary.

No user account login, Firefox debug configuration change, screenshot or game interaction has been performed by the developer agent for this project.

## Current public-entry observation (Windows, 2026-10-17)

Unauthenticated Python HTTP checks: `/` 200 (374 ms), `/default.html` 200 (122 ms), `/iframe.html` 200 (127 ms), `/cgi-bin/login` 404 (177 ms). The iframe's script-based browser redirect is not executed by this HTTP check, so its current authentication target remains unknown. This confirms the old route's HTTP failure only; it does not reproduce independent-SWF login or identify its cause.

## Repeatable prototype check

Open App → wait for Ruffle status → official home → use official login → record whether new window appears → user authenticates → record return to main window → select server.

Use “诊断” for safe host/path/status metadata. Unknown CDN and login callbacks require an authorized debug inspection. Never copy query parameters, passwords, Cookie values or authentication tickets into this repository or public issues.

The CI `public-entry.json` observes only unauthenticated HTTP availability/redirects from a GitHub runner. It does not reproduce Flash interaction or establish account login support.

## Meizu prototype0.1.0 reproduction — 2026-10-18

- User opened the installed App; read-only text inspection found official native confirm: Flash loading may be abnormal, confirm enters game/cancel continues loading. No screenshot was taken and no native crash appeared in app-filtered error tags.
- Current public default.html code calls `flashdown` after11 seconds if `flashready!=1`; `flashInit(ver)` sets it to1. Confirm still assigns the old `/cgi-bin/login`; cancel does not perform that navigation. iframe.html separately points to the official web2 login2 entry. These do not prove the independent SWF login issue has the same cause.
- Read-only Gecko debugger inspection through a temporary local ADB forward (removed after each query): root host17roco; main frame default document complete; flashready0; flashInit exists; Ruffle API exists; one RUFFLE-EMBED, readyState0, no metadata, canvas present, cant-embed message. Player config allowScriptAccess=true, autoplay=auto, preferredRenderer=null.
- Cached PageError specifically attributes `ROCO-Z8.swf` on res.17roco.qq.com to CORS missing Access-Control-Allow-Origin, HTTP200. Resource timing reports status0/0 transferable bytes; those timing fields alone would not identify the cause.
- Independent unauthenticated public HEAD to the exact SWF returns200, Flash MIME and Content-Length92627, with no ACAO. No credentials, Cookie values, tickets, full token-bearing URLs or raw console dumps were recorded.
- Initial fix0.1.1 adds an exact public-resource response-header adapter; real-device retest awaits approved update installation and user refresh. No authentication result is implied.
