/* Bounded diagnostic classifications only. No raw log, cookie or token storage. */
(function () {
  'use strict';
  const page = new URL(window.location.href);
  if (page.origin !== 'https://web2.17roco.qq.com' || page.username || page.password || window.__timeCasketEngineSignals) return;
  const state = {socketMentions: 0, missingSocketProxy: 0, scriptErrors: 0, unsupportedFeatures: 0, socketHosts: [], errorCodes: [],
    traceAttached: 0, traceMessages: 0, configsLoaded: 0, loginInitialized: 0, directoryRequests: 0, traceErrors: 0, ioErrors: 0, httpErrors: 0,
    nullObjectErrors: 0, undefinedAccessErrors: 0, streamErrors: 0, fontWarnings: 0, bitmapDrawErrors: 0,
    dirWsAttempt: 0, dirWsOpen: 0, dirWsError: 0, dirWsClose: 0, statWsAttempt: 0, statWsOpen: 0, statWsError: 0, statWsClose: 0};
  window.__timeCasketEngineSignals = state;
  function bump(key) { state[key] = Math.min(1000, state[key] + 1); }
  function classifyIO(text) {
    if (/\bIOError(?:Event)?\b|ioError|加载文件出错/.test(text)) bump('ioErrors');
    if (/\bhttp code:[45]\d{2}\b/i.test(text)) bump('httpErrors');
    if (text.includes('Render backend does not support BitmapData.draw')) bump('bitmapDrawErrors');
    for (const [code, key] of [[1009, 'nullObjectErrors'], [1010, 'undefinedAccessErrors'], [2032, 'streamErrors']]) {
      if (new RegExp('\\bError #' + code + '\\b').test(text)) bump(key);
    }
    if (/\bfont\b.*(?:not found|not available|missing)|(?:not found|missing).*\bfont\b/i.test(text)) bump('fontWarnings');
  }
  const OriginalWebSocket = window.WebSocket;
  if (typeof OriginalWebSocket === 'function') window.WebSocket = new Proxy(OriginalWebSocket, {
    construct(target, args, newTarget) {
      let endpoint;
      try {
        if (typeof args[0] === 'string') {
          const url = new URL(args[0]);
          const match = /^\/[0-9a-f]{48}\/(dir|stat)\.17roco\.qq\.com$/.exec(url.pathname);
          if (url.protocol === 'ws:' && url.hostname === '127.0.0.1' && !url.username && !url.password && !url.search && !url.hash && match) endpoint = match[1];
        }
      } catch (_) {}
      if (endpoint) bump(endpoint + 'WsAttempt');
      let socket;
      try { socket = Reflect.construct(target, args, newTarget); }
      catch (error) { if (endpoint) bump(endpoint + 'WsError'); throw error; }
      if (endpoint) for (const [event, suffix] of [['open', 'Open'], ['error', 'Error'], ['close', 'Close']]) {
        socket.addEventListener(event, () => bump(endpoint + 'Ws' + suffix));
      }
      return socket;
    }
  });
  // Observe only fixed bootstrap milestones. Keep warn logging: full movie traces
  // may contain login parameters and must never be copied into diagnostics.
  window.document?.addEventListener('loadedmetadata', event => {
    try {
      const player = event.target;
      if (!player?.matches?.('ruffle-object,ruffle-embed,ruffle-player')) return;
      const api = player.ruffle?.();
      const movie = new URL(api?.loadedConfig?.url, window.document.baseURI);
      if (movie.origin !== 'https://res.17roco.qq.com' || movie.pathname !== '/main.swf') return;
      api.traceObserver = message => {
        if (typeof message !== 'string') return;
        bump('traceMessages');
        const text = message.slice(0, 2000);
        classifyIO(text);
        if (text === '[AngelAppInstall] 程序相关的配置文件加载完毕!!') bump('configsLoaded');
        if (text === 'LoginPlugin Debug version initialize!!') bump('loginInitialized');
        if (/^(?:推荐请求:|列表请求:)/.test(text)) bump('directoryRequests');
        if (/Error #\d{1,5}\b|ReferenceError|TypeError|VerifyError/.test(text)) bump('traceErrors');
      };
      bump('traceAttached');
    } catch (_) { /* No raw trace or error is retained. */ }
  }, true);
  for (const level of ['log', 'warn', 'error']) {
    const original = window.console?.[level];
    if (typeof original !== 'function') continue;
    window.console[level] = function (...args) {
      try {
        // Never stringify objects, enumerate fields, or retain argument strings.
        const text = args.slice(0, 8).filter(value => typeof value === 'string').map(value => value.slice(0, 2000)).join(' ');
        classifyIO(text);
        if (/socket|websocket|xmlsocket/i.test(text)) {
          bump('socketMentions');
          for (const host of text.match(/\b(?:dir|zone\d+)\.17roco\.qq\.com\b/g) || []) {
            if (state.socketHosts.length < 8 && !state.socketHosts.includes(host)) state.socketHosts.push(host);
          }
        }
        if (/(?:no|missing|not found|not configured|without|could not).*socket.*prox|socket.*prox.*(?:not found|not configured|missing)/i.test(text)) bump('missingSocketProxy');
        if (/AVM2.*error|ReferenceError|TypeError|VerifyError/i.test(text)) {
          bump('scriptErrors');
          for (const match of text.matchAll(/Error #(\d{1,5})\b/g)) {
            const code = Number(match[1]);
            if (state.errorCodes.length < 8 && !state.errorCodes.includes(code)) state.errorCodes.push(code);
          }
        }
        if (/unimplemented|not implemented|encountered stub/i.test(text)) bump('unsupportedFeatures');
      } catch (_) { /* Diagnostic failure must not alter game behavior. */ }
      return Reflect.apply(original, window.console, args);
    };
  }
})();
