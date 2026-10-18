/* MAIN world. Delegate game GETs only within a verified server contract. */
(function (root) {
  'use strict';
  const endpoints = ['online_present', 'mini_game_manage', 'vip_tab_state', 'star_tower_new',
    'star_tower_exch_shop', 'ifrit_challenge', 'back_player_guide', 'zombie_coming',
    'discovery', 'mend_shape', 'dawn_hymn', 'flaunt_suit_rank'];
  const verified = new Set(endpoints);
  function gameEndpoint(url, method) {
    if (typeof method !== 'string' || method.toUpperCase() !== 'GET' || url.origin !== 'https://17roco.qq.com' ||
        url.username || url.password) return;
    const name = /^\/cgi-bin\/([a-z][a-z0-9_]{0,63})$/.exec(url.pathname)?.[1];
    // Authentication, account protection and payment flows keep native behavior.
    if (!name || /login|logout|auth|ticket|session|token|cookie|captcha|verif|password|passwd|privacy|chenmi|realname|identity|idcard|security|protect|checkage|agreement|payment|purchase|recharge|checkout/.test(name)) return;
    return name;
  }
  function install(win) {
    const page = new URL(win.location.href);
    if (page.origin !== 'https://web2.17roco.qq.com' || page.username || page.password ||
        typeof win.fetch !== 'function' || win.__timeCasketHttpState) return;
    const original = win.fetch;
    const RequestClass = win.Request, ResponseClass = win.Response;
    if (typeof RequestClass !== 'function' || typeof ResponseClass !== 'function') return;
    const state = {httpBridgeAttempt: 0, httpBridgeComplete: 0, httpBridgeFailed: 0, httpBridgeUnavailable: 0,
      httpBridgeProbeAttempt: 0, httpBridgeProbeAccepted: 0, httpBridgeProbeRejected: 0,
      httpBridgeProbeFailed: 0, httpBridgeProbeLimited: 0, httpBridgeHttpErrors: 0};
    win.__timeCasketHttpState = state;
    const bump = key => { state[key] = Math.min(1000, state[key] + 1); };
    function homeOwner() {
      try {
        const top = win.top, home = new URL(top.location.href);
        if (top !== win && home.origin === 'https://17roco.qq.com' && !home.username && !home.password &&
            ['/', '/default.html'].includes(home.pathname) && typeof top.fetch === 'function' && typeof top.Request === 'function') return top;
      } catch (_) { /* A navigated or inaccessible owner cannot delegate. */ }
    }
    // In-memory path decisions only; never store a query, response body or token.
    const probes = new Map();
    function serverAllows(owner, path) {
      if (probes.has(path)) return probes.get(path);
      if (probes.size >= 128) { bump('httpBridgeProbeLimited'); return Promise.resolve(false); }
      const result = (async () => {
        bump('httpBridgeProbeAttempt');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        try {
          // Probe only public routing headers. No original query/headers/cookies.
          const request = new owner.Request('https://17roco.qq.com' + path, {method: 'HEAD',
            credentials: 'omit', cache: 'no-store', mode: 'same-origin', redirect: 'error',
            referrer: '', referrerPolicy: 'no-referrer', signal: controller.signal});
          const response = await Reflect.apply(owner.fetch, owner, [request]);
          const type = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
          const allowed = response.status === 200 && !response.redirected &&
            ['text/xml', 'application/xml'].includes(type) &&
            response.headers.get('Access-Control-Allow-Origin') === 'https://res.17roco.qq.com' &&
            response.headers.get('Access-Control-Allow-Credentials')?.toLowerCase() === 'true';
          bump(allowed ? 'httpBridgeProbeAccepted' : 'httpBridgeProbeRejected');
          return allowed;
        } catch (_) { bump('httpBridgeProbeFailed'); return false; }
        finally { clearTimeout(timer); }
      })();
      probes.set(path, result);
      return result;
    }
    win.fetch = new Proxy(original, {
      apply(target, receiver, args) {
        let owner, address;
        try {
          const input = args[0], init = args[1];
          // Native getters brand-check Request across realms without trusting an
          // object's own url/toString properties or requiring instanceof here.
          const request = typeof input !== 'string';
          const raw = request ? Reflect.get(RequestClass.prototype, 'url', input) : input;
          if (typeof raw !== 'string') return Reflect.apply(target, receiver, args);
          const url = new URL(raw, win.location.href);
          const method = init?.method ?? (request ? Reflect.get(RequestClass.prototype, 'method', input) : 'GET');
          if (!gameEndpoint(url, method)) {
            return Reflect.apply(target, receiver, args);
          }
          // Do not parse/copy authentication fields; preserve the game's URL as is.
          address = raw;
          owner = homeOwner();
        } catch (_) { /* An inaccessible owner keeps the original browser behavior. */ }
        if (!owner) {
          if (address !== undefined) bump('httpBridgeUnavailable');
          return Reflect.apply(target, receiver, args);
        }
        return (async () => {
          try {
            const request = new RequestClass(args[0], args[1]);
            const resolved = new URL(request.url);
            const name = gameEndpoint(resolved, request.method);
            if (!name) throw new TypeError('Game request changed');
            if (!verified.has(name) && (request.signal.aborted || !await serverAllows(owner, resolved.pathname))) {
              return Reflect.apply(target, receiver, args);
            }
            // Discovery is asynchronous: recheck the homepage before the GET.
            if (owner !== homeOwner()) {
              bump('httpBridgeUnavailable');
              return Reflect.apply(target, receiver, args);
            }
            bump('httpBridgeAttempt');
            // A URL-string constructor in the home realm establishes its origin.
            // Redirects fail rather than forwarding an activity into authentication.
            const delegated = new owner.Request(request.url, {method: 'GET', headers: request.headers,
              credentials: request.credentials, cache: request.cache, signal: request.signal,
              mode: 'same-origin', redirect: 'error'});
            const response = await Reflect.apply(owner.fetch, owner, [delegated]);
            if (response.status >= 400) bump('httpBridgeHttpErrors');
            // wasm-bindgen tests instanceof Response in the GAME realm. Keep the
            // original stream/status/headers and create only that local wrapper.
            const local = new ResponseClass(response.body, {status: response.status, statusText: response.statusText, headers: response.headers});
            Object.defineProperties(local, {url: {value: response.url}, redirected: {value: response.redirected}, type: {value: response.type}});
            bump('httpBridgeComplete');
            return local;
          } catch (error) {
            bump('httpBridgeFailed');
            // Never retry through another transport after a request was sent.
            throw error;
          }
        })();
      }
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {install, endpoints};
  else { root.installTimeCasketGameHttpBridge = install; install(root.window || root); }
})(globalThis);
