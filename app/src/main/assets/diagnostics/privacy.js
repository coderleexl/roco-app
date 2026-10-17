(function (root) {
  'use strict';
  const paths = new Set(['/', '/default.html', '/iframe.html', '/login.html', '/cgi-bin/login', '/fcgi-bin/login2']);
  function safeUrl(value) {
    try {
      const u = new URL(value);
      if (!['http:', 'https:'].includes(u.protocol)) return '[non-web]';
      const path = paths.has(u.pathname) ? u.pathname : u.pathname.split('/').map((p, i) => i === 0 ? '' : '[redacted]').join('/');
      return u.origin + path;
    } catch (_) { return '[invalid-url]'; }
  }
  function requestEvent(details, started) {
    return {kind: 'request', url: safeUrl(details.url), status: Number(details.statusCode) || 0,
      ms: Math.max(0, Math.round(details.timeStamp - started))};
  }
  const api = {safeUrl, requestEvent};
  root.RocoPrivacy = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
