/* MAIN-world, document_start. Called only by the built-in background registration. */
function installTimeCasketSocketConfig(proxies) {
  'use strict';
  const page = new URL(window.location.href);
  if (page.origin !== 'https://web2.17roco.qq.com' || page.username || page.password) return;
  if (!Array.isArray(proxies) || proxies.length !== 2) return;
  const hosts = ['dir.17roco.qq.com', 'stat.17roco.qq.com'];
  for (let i = 0; i < hosts.length; i++) {
    const item = proxies[i];
    if (item.host !== hosts[i] || item.port !== 443 || typeof item.proxyUrl !== 'string') return;
    const proxy = new URL(item.proxyUrl);
    if (proxy.protocol !== 'ws:' || proxy.hostname !== '127.0.0.1' || !proxy.port || proxy.username || proxy.password || proxy.search || proxy.hash ||
        !new RegExp('^/[0-9a-f]{48}/' + hosts[i].replaceAll('.', '\\.') + '$').test(proxy.pathname)) return;
  }
  const player = window.RufflePlayer || (window.RufflePlayer = {});
  const config = player.config || (player.config = {});
  config.socketProxy = proxies;
  config.logLevel = 'warn';
  // The official game relaxes document.domain and is reached through an OAuth
  // iframe. Its inherited policy blocks loopback before Gecko can prompt.
  // Use the already trusted official top document only for these exact URLs.
  const NativeSocket = window.WebSocket;
  if (typeof NativeSocket !== 'function') return;
  const destinations = proxies.map(item => item.proxyUrl);
  window.WebSocket = new Proxy(NativeSocket, {
    construct(target, args, newTarget) {
      let owner;
      if (typeof args[0] === 'string' && destinations.includes(args[0])) {
        try {
          const top = window.top, url = new URL(top.location.href);
          if (top !== window && url.origin === 'https://17roco.qq.com' && !url.username && !url.password &&
              ['/', '/default.html'].includes(url.pathname) && typeof top.WebSocket === 'function') owner = top.WebSocket;
        } catch (_) { /* Cross-origin or unavailable owner: retain native failure. */ }
      }
      const socket = Reflect.construct(owner || target, args, newTarget);
      if (owner) socket.addEventListener('message', event => {
        // gloo-net uses instanceof ArrayBuffer in the game realm. Copy bytes
        // into that realm before its listener runs; never inspect or log them.
        const data = event.data;
        if (Object.prototype.toString.call(data) === '[object ArrayBuffer]' && !(data instanceof ArrayBuffer)) {
          Object.defineProperty(event, 'data', {value: Uint8Array.from(new Uint8Array(data)).buffer});
        }
      }, {capture: true});
      return socket;
    }
  });
}
