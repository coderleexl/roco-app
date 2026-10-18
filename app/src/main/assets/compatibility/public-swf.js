/* Public asset compatibility only. Never read cookies, bodies or credentials. */
(function (root) {
  'use strict';
  const resourceOrigin = 'https://res.17roco.qq.com';
  const requestPatterns = ['/swf/*', '/libs/*', '/conf/*', '/res/*', '/preloader.swf*', '/main.swf*', '/ver.config*', '/Global.xml*']
    .map(path => resourceOrigin + path);
  const mimeTypes = new Map([
    ['swf', ['application/x-shockwave-flash']],
    ['xml', ['text/xml', 'application/xml']],
    ['config', ['application/octet-stream']],
    ['bin', ['application/octet-stream']],
    ['dat', ['application/octet-stream']],
    ['png', ['image/png']], ['jpg', ['image/jpeg']], ['jpeg', ['image/jpeg']],
    ['gif', ['image/gif']], ['webp', ['image/webp']], ['mp3', ['audio/mpeg']]
  ]);
  // Central policy shared by every eligible response, not a page fetch override.
  // Directory roots come from the public Global.xml, not authentication URLs.
  function allowedAssetTypes(asset, source) {
    if (asset.origin !== resourceOrigin || asset.username || asset.password || source.username || source.password) return;
    const path = asset.pathname;
    if (!/^\/[A-Za-z0-9_./-]+$/.test(path) || path.includes('//')
      || /(?:^|\/)(?:\.|cgi-bin(?:\/|$)|fcgi-bin(?:\/|$)|crossdomain\.xml$)/i.test(path)) return;
    const home = source.origin === 'https://17roco.qq.com' && ['/', '/default.html'].includes(source.pathname);
    const game = source.origin === 'https://web2.17roco.qq.com';
    if (home && (path === '/preloader.swf' || path === '/swf/ROCO-Z8.swf' || /^\/swf\/ceils\/ROCO-Z8_Ceil_\d+\.swf$/.test(path))) return mimeTypes.get('swf');
    if (!game) return;
    if (path === '/main.swf') return mimeTypes.get('swf');
    if (path === '/ver.config') return mimeTypes.get('config');
    if (path === '/Global.xml') return mimeTypes.get('xml');
    const ext = path.split('.').pop();
    if (/^\/(?:swf|libs)\//.test(path) && ext === 'swf') return mimeTypes.get(ext);
    if (path.startsWith('/conf/') && ['xml', 'config', 'bin', 'dat'].includes(ext)) return mimeTypes.get(ext);
    if (path.startsWith('/res/')) return mimeTypes.get(ext);
  }
  function adaptPublicAssetHeaders(details) {
    if (details.method !== 'GET' || details.type !== 'xmlhttprequest' || details.statusCode !== 200 || !Array.isArray(details.responseHeaders)) return;
    let asset, source;
    try {
      asset = new URL(details.url);
      source = new URL(details.originUrl || details.documentUrl);
    } catch (_) { return; }
    const expectedTypes = allowedAssetTypes(asset, source);
    if (!expectedTypes) return;
    const headers = details.responseHeaders;
    if (headers.some(h => ['access-control-allow-origin', 'access-control-allow-credentials'].includes(h.name.toLowerCase()))) return;
    const type = headers.find(h => h.name.toLowerCase() === 'content-type');
    if (!expectedTypes.includes(type?.value?.split(';')[0].trim().toLowerCase())) return;
    return {responseHeaders: [...headers, {name: 'Access-Control-Allow-Origin', value: source.origin}]};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {adaptPublicAssetHeaders, requestPatterns};
  if (root.browser?.webRequest) {
    root.browser.webRequest.onHeadersReceived.addListener(adaptPublicAssetHeaders,
      {urls: requestPatterns, types: ['xmlhttprequest']},
      ['blocking', 'responseHeaders']);
  }
})(globalThis);
