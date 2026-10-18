/* MAIN-world, document_start. Called only by the built-in background registration. */
function installTimeCasketSocketConfig(proxies, maxZone) {
  'use strict';
  const page = new URL(window.location.href);
  if (page.origin !== 'https://web2.17roco.qq.com' || page.username || page.password) return;
  const hosts = ['dir.17roco.qq.com', 'stat.17roco.qq.com'];
  if (!Array.isArray(proxies) || proxies.length !== hosts.length || maxZone !== 65535) return;
  for (let i = 0; i < hosts.length; i++) {
    const item = proxies[i];
    if (item.host !== hosts[i] || item.port !== 443 || typeof item.proxyUrl !== 'string') return;
    const proxy = new URL(item.proxyUrl);
    if (proxy.protocol !== 'ws:' || proxy.hostname !== '127.0.0.1' || !proxy.port || proxy.username || proxy.password || proxy.search || proxy.hash ||
        !new RegExp('^/[0-9a-f]{48}/' + hosts[i].replaceAll('.', '\\.') + '$').test(proxy.pathname)) return;
  }
  const prefix = proxies[0].proxyUrl.slice(0, proxies[0].proxyUrl.lastIndexOf('/') + 1);
  if (proxies[1].proxyUrl !== prefix + hosts[1]) return;
  function registeredDestination(address) {
    if (typeof address !== 'string' || !address.startsWith(prefix)) return false;
    const host = address.slice(prefix.length);
    if (hosts.includes(host)) return true;
    const zone = /^zone([1-9][0-9]{0,4})\.17roco\.qq\.com$/.exec(host);
    return !!zone && Number(zone[1]) <= maxZone;
  }
  const player = window.RufflePlayer || (window.RufflePlayer = {});
  const config = player.config || (player.config = {});
  // Lazy exact-match expansion: empty tracking frames need not allocate it.
  Object.defineProperty(config, 'socketProxy', {configurable: true, enumerable: true,
    get() {
      const entries = proxies.slice();
      for (let zone = 1; zone <= maxZone; zone++) {
        const host = 'zone' + zone + '.17roco.qq.com';
        entries.push({host, port: 443, proxyUrl: prefix + host});
      }
      Object.defineProperty(config, 'socketProxy', {value: entries, writable: true, configurable: true, enumerable: true});
      return entries;
    },
    set(value) { Object.defineProperty(config, 'socketProxy', {value, writable: true, configurable: true, enumerable: true}); }
  });
  config.logLevel = 'warn';
  // The official game relaxes document.domain and is reached through an OAuth
  // iframe. Its inherited policy blocks loopback before Gecko can prompt.
  // Use the already trusted official top document only for these exact URLs.
  const NativeSocket = window.WebSocket;
  if (typeof NativeSocket !== 'function') return;
  window.WebSocket = new Proxy(NativeSocket, {
    construct(target, args, newTarget) {
      let owner;
      if (registeredDestination(args[0])) {
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
