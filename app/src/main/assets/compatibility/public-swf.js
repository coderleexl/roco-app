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
    if (asset.origin !== 'https://res.17roco.qq.com' || asset.username || asset.password || source.username || source.password) return;
    const homeMovie = ['/swf/ROCO-Z8.swf', '/preloader.swf', '/swf/ceils/ROCO-Z8_Ceil_3.swf'].includes(asset.pathname)
      && source.origin === 'https://17roco.qq.com' && ['/', '/default.html'].includes(source.pathname);
    // Post-auth document paths may vary. Only this exact public movie is allowed
    // from the observed official web2 origin; no authentication response changes.
    const gameMovie = asset.pathname === '/main.swf' && source.origin === 'https://web2.17roco.qq.com';
    const versionConfig = asset.pathname === '/ver.config' && source.origin === 'https://web2.17roco.qq.com';
    if (!homeMovie && !gameMovie && !versionConfig) return;
    const headers = details.responseHeaders;
    if (headers.some(h => ['access-control-allow-origin', 'access-control-allow-credentials'].includes(h.name.toLowerCase()))) return;
    const type = headers.find(h => h.name.toLowerCase() === 'content-type');
    const expectedType = versionConfig ? 'application/octet-stream' : 'application/x-shockwave-flash';
    if (type?.value?.split(';')[0].trim().toLowerCase() !== expectedType) return;
    return {responseHeaders: [...headers, {name: 'Access-Control-Allow-Origin', value: source.origin}]};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {adaptPublicSwfHeaders};
  if (root.browser?.webRequest) {
    root.browser.webRequest.onHeadersReceived.addListener(adaptPublicSwfHeaders,
      {urls: ['https://res.17roco.qq.com/swf/ROCO-Z8.swf*', 'https://res.17roco.qq.com/preloader.swf*', 'https://res.17roco.qq.com/main.swf*', 'https://res.17roco.qq.com/ver.config*', 'https://res.17roco.qq.com/swf/ceils/ROCO-Z8_Ceil_3.swf*'], types: ['xmlhttprequest']},
      ['blocking', 'responseHeaders']);
  }
})(globalThis);
