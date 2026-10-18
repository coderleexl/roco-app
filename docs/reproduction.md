# Reproduction record

## Meizu0.1.8 silent audio / no server list — 2026-10-18

- User reports Unmute click fails and no server list. Read-only main: readyState2/autoplayon/isPlayingtrue/volume1; Play and Unmute displaynone. Browser PageErrors repeatedly state AudioContext blocked until gesture. Output routing/volume has not been tested or changed; overlay disappearance does not prove sound.
- Pinned Ruffle unmute handler resumes AudioContext but hides overlay without awaiting success. PinnedGecko158 source confirms autoplay permission types/defaultPROMPT, with no app delegate previously installed.0.1.9 adds scoped playback permission handling; final audible behavior remains unverified.
- Main ver.config/Global.xml/Angel.config/base libraries/Effect now all200. Outer homepage independently fails preloadlist.xml and ver.config CORS at200. PublicHEAD preloadlist text/xml/3818bytes/noACAO; its public content describes preloading.0.1.9 adds these exact homepage bootstrap pairs, not unrelated endpoints.
- Read-only ConsoleAPI classification has no useful child-frame Socket signal; state remainsunknown. New frame-local bounded engine classifications in0.1.9 support the next user load without raw logging. Python reference directory/zone TCP flow is documented innetworking.md and is not proof of our current blocker. No refresh/login/taps/screenshots/system-network modification were performed by the developer.

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

## Meizu0.1.1 post-scan reproduction — 2026-10-18

- Authorized in-place installation returnedSuccess; package inspection confirmed0.1.1/code2. User reports partial homepage animation, QR page opens, and the Flash error returns after scanning. Earlier informal “works” feedback is not a passed login gate.
- Read-only debugger frame walk shows homepage player loading `/preloader.swf`, and an official web2.17roco.qq.com frame player loading `/main.swf`; both state0/no metadata/error overlay, no panic observed. Authenticated document paths and queries are redacted; no account state or Cookie values inspected.
- Cached PageError explicitly identifies each exact res.17roco.qq.com asset as missingACAO/HTTP200. Public unauthenticated HEAD independently returns Flash MIME, lengths9721/54455 respectively, and noACAO. Third-party advertising errors are separate and not adapted.
- Version0.1.2 adds only these observed movie/source pairs. Its new regression fails on0.1.1 and passes after the change. Main's source is exact HTTPS web2 origin; the post-auth path is not guessed. Whether official authentication completed, game received valid login, or additional resource/socket issues remain is unknown until user retest.
- No phone taps, screenshots, console argument dumps, request credentials, ticket URLs or response bodies were collected. Temporary ADB debug forward removed after inspection.

## Meizu0.1.2 version-file failure — 2026-10-18

- User reports advancing into the game loader, then “版本文件加载失败，请检查配置”. This does not establish server selection or map entry.
- Read-only frame/player inspection confirms both preloader and main atreadyState2, metadata present, no error overlay/panic. This verifies the previous two public movie adaptations in the real browser.
- The official web2 frame records two requests for exact res-host `/ver.config` (61ms/43ms, status0 from resource timing). Cached PageError separately confirms missingACAO/HTTP200 for both requests. Public unauthenticated HEAD returns200, application/octet-stream, Content-Length217494, withoutACAO.
- 0.1.3 adds only this public version file, scoped to web2 origin and its observed MIME. New regression is RED before the adapter change and GREEN after. Further dynamic resources, valid game login, servers, map and sockets remain unverified.
- User also requested password-free login. Current normal persistent profile is retained; real official session recovery has not been tested. No credentials, token URLs or cookies were extracted, persisted or replayed. Plan: user-operated close/reopen after resource loading is repaired, then determine whether the official session restores or requires reauthentication.

## Meizu0.1.3 homepage black background — 2026-10-18

- User reports the homepage is black except for a Start button. Read-only inspection confirms homepage ROCO-Z8 and outer preloader execute (readyState2, metadata present), with no player error overlay/panic. The game web2 main frame is not present in this snapshot, so it cannot verify the previous version-file fix.
- PageError identifies exact public animation fragment `res.17roco.qq.com/swf/ceils/ROCO-Z8_Ceil_3.swf` blocked by missingACAO atHTTP200. Independent publicHEAD confirms Flash MIME/164312 bytes/noACAO. This identifies a missing dynamic animation dependency, rather than evidence of a renderer crash; final visual recovery still requires user verification.
- 0.1.4 adds only this exact path, retaining official homepage source restriction and all previous GET/XHR/status/MIME/server-policy guards. Numbered siblings are not automatically allowed. New regression fails before adaptation and passes after it. No phone taps, screenshots or authenticated data capture.

## Meizu0.1.5 loading message and policy consolidation — 2026-10-18

- User reports “努力加载中，请刷新页面”. Read-only inspection shows preloader/main readyState2, metadata present, no player panic/overlay. Official web2 frame ver.config now succeeds atHTTP200, duration62ms: real evidence that0.1.3 config adaptation works. No server list/map success is established.
- Cached PageError identifies res-host `/Global.xml` missingACAO atHTTP200. Independent unauthenticated publicHEAD confirms text/xml/2489bytes/noACAO. Public XML explicitly lists `/swf/bb.swf`, `/libs/AngelClientLibs_s.swf`, `/libs/AngelProtocal.swf`, `/conf/Angel.config`, plus resource roots. HEAD for those four returns200, expected Flash/Flash/Flash/octet-stream MIME, lengths24891/623033/246233/1484336, all withoutACAO. These are declared upcoming dependencies, not requests observed succeeding in the game.
- User asks to reuse login and avoid repeated QR scans, then requests a common wrapper instead of per-file fixes.0.1.6 centralizes typed public-directory rules, using this public config as scope evidence. Shared-policy and Global bootstrap tests fail on old code, pass after the change; browser-hook test also verifies real registered callback and manifest scopes. It does not validate all future resources in a real Gecko browser.
- Same runtime profile persists; no extraction/replay of passwords, Cookie values, authentication tickets or login URLs. Package upgrades preserve stored data but end the current page process, so successful website login recovery remains unknown. No automated account or game interactions, no screenshot, no system network changes.

## Meizu0.1.6 still loading before server selection — 2026-10-18

- User reports loading without game picture or server-selection step. Read-only main/preloader remain executable, no panic/overlay. Resource timing verifies ver.config200/51ms, Global.xml200/29ms, Angel.config200/42ms, AngelClientLibs_s.swf200/71ms, AngelProtocal.swf200/32ms. This establishes actual progress past the previous bootstrap blockers.
- Four game-triggered requests for `/plugins/Effect/EffectPluginLib.swf` have timing status0 (39/35/48/58ms); PageError independently confirms missingACAO atHTTP200. No developer-triggered reload/retry was performed. PublicHEAD confirms Flash MIME/190572bytes/noACAO.
- Inspecting only publicly downloadable ver.config shows ZIP containing XML with13216 file entries. Its path attributes explicitly include the Effect plugin and plugins/activity/apps/video directories, extending Global.xml's smaller root list. Suffix inventory: plugins has SWF/XML/TXT/FINT/config/PNG and a backup; activity SWF/PNG/XML; apps SWF/PNG/XML/JPG; video SWF/MP4. H5 assets are also declared but are not part of this Flash policy expansion.
- 0.1.7 expands the common typed-directory table, not one plugin filename. It excludes backups/scripts/HTML, unknown suffixes and CGI paths, keeps exact resource/source origins and existing policy protections. Regression fails on0.1.6 then passes. Runtime outcome of the added directories remains unverified until user retest; login validity, selection, maps and Socket capabilities are still unknown.

## Startup overlay and refresh feedback — 2026-10-18

- User reports refreshing returns to login and an extra Play click is required, then explicitly identifies it as Ruffle's own overlay. Do not treat this feedback as game/server acceptance.
- Public official root-page source selects the default iframe again on load, conditionally calls LogoutPage and explicitly calls it in the keyboard-refresh handler. Public LayerLogin.js defines logout handling; no actual Cookie values or user auth URLs were read. Android toolbar reloads the whole session. Current evidence supports investigating whole-page navigation, not declaring browser storage broken.
- Official Ruffle0.7.1 bundle defaults autoplay toauto and accepts global RufflePlayer.config.0.1.8 adds a scoped MAIN-world document_start preference autoplay:on, with normal unmute behavior preserved. Tests were RED before script/manifest existed, then all three configuration/scope/manifest tests GREEN. Actual Gecko injection and overlay outcome require user opening the App; developer did not click Play, refresh, authenticate or screenshot.
