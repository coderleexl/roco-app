/* MAIN world. Forward verified activity GETs through the existing official home. */
(function (root) {
  'use strict';
  const endpoints = ['online_present', 'mini_game_manage', 'vip_tab_state', 'star_tower_new',
    'star_tower_exch_shop', 'ifrit_challenge', 'back_player_guide', 'zombie_coming',
    'discovery', 'mend_shape', 'dawn_hymn'];
  function install(win) {
    const page = new URL(win.location.href);
    if (page.origin !== 'https://web2.17roco.qq.com' || page.username || page.password ||
        typeof win.fetch !== 'function' || win.__timeCasketHttpState) return;
    const original = win.fetch;
    const RequestClass = win.Request, ResponseClass = win.Response;
    if (typeof RequestClass !== 'function' || typeof ResponseClass !== 'function') return;
    const state = {httpBridgeAttempt: 0, httpBridgeComplete: 0, httpBridgeFailed: 0, httpBridgeUnavailable: 0};
    win.__timeCasketHttpState = state;
    const bump = key => { state[key] = Math.min(1000, state[key] + 1); };
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
          if (typeof method !== 'string' || method.toUpperCase() !== 'GET' || url.origin !== 'https://17roco.qq.com' ||
              url.username || url.password || !endpoints.some(name => url.pathname === '/cgi-bin/' + name)) {
            return Reflect.apply(target, receiver, args);
          }
          // Do not parse/copy authentication fields; preserve the game's URL as is.
          address = raw;
          const top = win.top, home = new URL(top.location.href);
          if (top !== win && home.origin === 'https://17roco.qq.com' && !home.username && !home.password &&
              ['/', '/default.html'].includes(home.pathname) && typeof top.fetch === 'function' && typeof top.Request === 'function') owner = top;
        } catch (_) { /* An inaccessible owner keeps the original browser behavior. */ }
        if (!owner) {
          if (address !== undefined) bump('httpBridgeUnavailable');
          return Reflect.apply(target, receiver, args);
        }
        return (async () => {
          bump('httpBridgeAttempt');
          try {
            const request = new RequestClass(args[0], args[1]);
            const resolved = new URL(request.url);
            if (request.method !== 'GET' || resolved.origin !== 'https://17roco.qq.com' || resolved.username || resolved.password ||
                !endpoints.some(name => resolved.pathname === '/cgi-bin/' + name)) throw new TypeError('Activity request changed');
            // A URL-string constructor in the home realm establishes its origin.
            // Redirects fail rather than forwarding an activity into authentication.
            const delegated = new owner.Request(request.url, {method: 'GET', headers: request.headers,
              credentials: request.credentials, cache: request.cache, signal: request.signal,
              mode: 'same-origin', redirect: 'error'});
            const response = await Reflect.apply(owner.fetch, owner, [delegated]);
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
