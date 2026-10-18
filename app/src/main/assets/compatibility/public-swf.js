/* Public asset compatibility only. Never read cookies, bodies or credentials. */
(function (root) {
  'use strict';
  function adaptPublicSwfHeaders(details) {
    if (details.method !== 'GET' || details.type !== 'xmlhttprequest' || details.statusCode !== 200 || !Array.isArray(details.responseHeaders)) return;
    let asset, source;
    try {
      asset = new URL(details.url);
      source = new URL(details.originUrl || details.documentUrl);
    } catch (_) { return; }
    if (asset.origin !== 'https://res.17roco.qq.com' || asset.pathname !== '/swf/ROCO-Z8.swf' || asset.username || asset.password) return;
    if (source.origin !== 'https://17roco.qq.com' || !['/', '/default.html'].includes(source.pathname) || source.username || source.password) return;
    const headers = details.responseHeaders;
    if (headers.some(h => ['access-control-allow-origin', 'access-control-allow-credentials'].includes(h.name.toLowerCase()))) return;
    const type = headers.find(h => h.name.toLowerCase() === 'content-type');
    if (type?.value?.split(';')[0].trim().toLowerCase() !== 'application/x-shockwave-flash') return;
    return {responseHeaders: [...headers, {name: 'Access-Control-Allow-Origin', value: 'https://17roco.qq.com'}]};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {adaptPublicSwfHeaders};
  if (root.browser?.webRequest) {
    root.browser.webRequest.onHeadersReceived.addListener(adaptPublicSwfHeaders,
      {urls: ['https://res.17roco.qq.com/swf/ROCO-Z8.swf*'], types: ['xmlhttprequest']},
      ['blocking', 'responseHeaders']);
  }
})(globalThis);
