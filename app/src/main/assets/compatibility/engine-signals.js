/* Bounded diagnostic classifications only. No raw log, cookie or token storage. */
(function () {
  'use strict';
  const page = new URL(window.location.href);
  if (page.origin !== 'https://web2.17roco.qq.com' || page.username || page.password || window.__timeCasketEngineSignals) return;
  const state = {socketMentions: 0, missingSocketProxy: 0, scriptErrors: 0, unsupportedFeatures: 0, socketHosts: [], errorCodes: []};
  window.__timeCasketEngineSignals = state;
  function bump(key) { state[key] = Math.min(1000, state[key] + 1); }
  for (const level of ['log', 'warn', 'error']) {
    const original = window.console?.[level];
    if (typeof original !== 'function') continue;
    window.console[level] = function (...args) {
      try {
        // Never stringify objects, enumerate fields, or retain argument strings.
        const text = args.slice(0, 8).filter(value => typeof value === 'string').map(value => value.slice(0, 2000)).join(' ');
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
