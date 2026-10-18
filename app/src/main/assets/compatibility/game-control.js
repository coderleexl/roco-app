/* Isolated world: native toolbar -> current game's public Ruffle reload API only. */
(function () {
  'use strict';
  const gameOrigin = window.location.origin === 'https://web2.17roco.qq.com';
  const presentationOwner = window === window.top;
  if (!gameOrigin && !(presentationOwner && window.location.origin === 'https://17roco.qq.com' &&
      ['/', '/default.html'].includes(window.location.pathname))) return;
  let port;
  try { port = browser.runtime.connectNative('time_casket_game_control'); }
  catch (_) { return; }
  let busy = false;
  let lastReady;
  let lastSignals;
  let viewRequested = false, viewActive = false, viewFailed = false;
  const view = createTimeCasketGameView(window);
  function reportView(active) {
    if (active === viewActive) return;
    viewActive = active; send({kind: 'game-view-state', enabled: active});
  }
  function game() {
    if (!gameOrigin) return null;
    for (const element of [...document.querySelectorAll('ruffle-object,ruffle-embed,ruffle-player')].slice(0, 4)) {
      try {
        // Firefox Xray waiver; pass no extension objects or callbacks into page code.
        const player = element.wrappedJSObject || element;
        const api = player.ruffle?.();
        if (api?.readyState !== 2 || typeof api.reload !== 'function') continue;
        const url = api.loadedConfig?.url;
        if (typeof url !== 'string' || url.length > 4096) continue;
        const movie = new URL(url, document.baseURI);
        if (movie.origin === 'https://res.17roco.qq.com' && movie.pathname === '/main.swf') return {api, element};
      } catch (_) { /* A frame with no ready main movie is not a reload target. */ }
    }
    return null;
  }
  function send(message) { try { port.postMessage(message); } catch (_) {} }
  function publish() {
    const target = game(), ready = !!target;
    if (viewRequested && presentationOwner) {
      const active = view.enterGame();
      if (!active) view.exit();
      reportView(active);
      if (!active && ready && !viewFailed) send({kind: 'game-view-failed'});
      viewFailed = !active && ready;
    } else { view.exit(); reportView(false); viewFailed = false; }
    if (ready !== lastReady) { lastReady = ready; send({kind: 'ready', ready}); }
    if (ready) {
      try {
        const raw = (window.wrappedJSObject || window).__timeCasketEngineSignals;
        if (!raw) return;
        const values = {};
        for (const key of ['traceAttached', 'configsLoaded', 'loginInitialized', 'directoryRequests', 'traceErrors', 'ioErrors', 'httpErrors', 'missingSocketProxy',
          'scriptErrors', 'unsupportedFeatures', 'nullObjectErrors', 'undefinedAccessErrors', 'streamErrors', 'fontWarnings',
          'dirWsAttempt', 'dirWsOpen', 'dirWsError', 'dirWsClose', 'statWsAttempt', 'statWsOpen', 'statWsError', 'statWsClose']) {
          const value = raw[key];
          if (Number.isInteger(value) && value >= 0 && value <= 1000) values[key] = value;
        }
        const http = (window.wrappedJSObject || window).__timeCasketHttpState;
        for (const key of ['httpBridgeAttempt', 'httpBridgeComplete', 'httpBridgeFailed', 'httpBridgeUnavailable']) {
          const value = http?.[key];
          if (Number.isInteger(value) && value >= 0 && value <= 1000) values[key] = value;
        }
        const signature = JSON.stringify(values);
        if (signature !== lastSignals) { lastSignals = signature; send({kind: 'signals', values}); }
      } catch (_) { /* Only validated counters cross into native diagnostics. */ }
    }
  }
  port.onMessage.addListener(message => {
    if (message?.kind === 'game-view' && typeof message.enabled === 'boolean') {
      viewRequested = message.enabled; publish(); return;
    }
    if (message?.kind !== 'reload' || busy) return;
    const api = game()?.api;
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
  port.onDisconnect.addListener(() => { window.clearInterval(timer); view.exit(); });
  window.addEventListener('pagehide', () => { window.clearInterval(timer); view.exit(); port.disconnect(); }, {once: true});
  publish();
})();
