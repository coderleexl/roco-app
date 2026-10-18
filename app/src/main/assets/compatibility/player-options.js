/* Page-world preferences only: no extension APIs, cookies, auth data or messaging. */
(function (root) {
  function configure(window) {
  'use strict';
  const page = new URL(window.location.href);
  if (page.username || page.password) return;
  const home = page.origin === 'https://17roco.qq.com' && ['/', '/default.html'].includes(page.pathname);
  const game = page.origin === 'https://web2.17roco.qq.com';
  if (!home && !game) return;
  // Ruffle documents autoplay:on as immediate start, muted if audio is blocked.
  // Device text in Combat has no embedded outlines. Ruffle's default embedded
  // device-font backend cannot use Android's CJK fonts; its canvas backend can.
  try {
    const player = window.RufflePlayer || (window.RufflePlayer = {});
    const config = player.config || (player.config = {});
    config.autoplay = 'on';
    // The physical Adreno GPU process exceeded 1.3 GiB and has a native driver
    // crash record. Trial the simpler backend; keep explicit page choices.
    if (config.preferredRenderer == null) config.preferredRenderer = 'webgl';
    if (game && config.deviceFontRenderer === undefined && typeof window.OffscreenCanvas === 'function') {
      try {
        if (new window.OffscreenCanvas(1, 1).getContext('2d')) config.deviceFontRenderer = 'canvas';
      } catch (_) { /* Retain Ruffle's default when a real 2D context is unavailable. */ }
    }
  } catch (_) { /* A page with immutable config retains its own behavior. */ }
  }
  if (typeof module === 'object' && module.exports) module.exports = configure;
  else { root.applyTimeCasketPlayerOptions = configure; configure(root); }
})(typeof window === 'object' ? window : globalThis);
