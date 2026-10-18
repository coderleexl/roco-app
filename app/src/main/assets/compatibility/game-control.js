/* Isolated world: native toolbar -> current game's public Ruffle reload API only. */
(function () {
  'use strict';
  if (window.location.origin !== 'https://web2.17roco.qq.com') return;
  let port;
  try { port = browser.runtime.connectNative('time_casket_game_control'); }
  catch (_) { return; }
  let busy = false;
  let lastReady;
  function game() {
    for (const element of [...document.querySelectorAll('ruffle-object,ruffle-embed,ruffle-player')].slice(0, 4)) {
      try {
        // Firefox Xray waiver; pass no extension objects or callbacks into page code.
        const player = element.wrappedJSObject || element;
        const api = player.ruffle?.();
        if (api?.readyState !== 2 || typeof api.reload !== 'function') continue;
        const url = api.loadedConfig?.url;
        if (typeof url !== 'string' || url.length > 4096) continue;
        const movie = new URL(url, document.baseURI);
        if (movie.origin === 'https://res.17roco.qq.com' && movie.pathname === '/main.swf') return api;
      } catch (_) { /* A frame with no ready main movie is not a reload target. */ }
    }
    return null;
  }
  function send(message) { try { port.postMessage(message); } catch (_) {} }
  function publish() {
    const ready = !!game();
    if (ready !== lastReady) { lastReady = ready; send({kind: 'ready', ready}); }
  }
  port.onMessage.addListener(message => {
    if (message?.kind !== 'reload' || busy) return;
    const api = game();
    if (!api) { send({kind: 'reload-unavailable'}); publish(); return; }
    busy = true;
    try {
      // Ruffle retains its own current config internally. Do not copy parameters,
      // serialize authentication URLs, reload the document or navigate its parent.
      Promise.resolve(api.reload()).then(() => {
        busy = false; send({kind: 'reloaded'}); publish();
      }, () => { busy = false; send({kind: 'reload-failed'}); publish(); });
    } catch (_) { busy = false; send({kind: 'reload-failed'}); }
  });
  const timer = window.setInterval(publish, 500);
  port.onDisconnect.addListener(() => window.clearInterval(timer));
  window.addEventListener('pagehide', () => { window.clearInterval(timer); port.disconnect(); }, {once: true});
  publish();
})();
