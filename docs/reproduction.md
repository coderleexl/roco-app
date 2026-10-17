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
