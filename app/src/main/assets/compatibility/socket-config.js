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
}
