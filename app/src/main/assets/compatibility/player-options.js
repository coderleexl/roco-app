/* Page-world preferences only: no extension APIs, cookies, auth data or messaging. */
(function () {
  'use strict';
  const page = new URL(window.location.href);
  if (page.username || page.password) return;
  const home = page.origin === 'https://17roco.qq.com' && ['/', '/default.html'].includes(page.pathname);
  const game = page.origin === 'https://web2.17roco.qq.com';
  if (!home && !game) return;
  // Ruffle documents autoplay:on as immediate start, muted if audio is blocked.
  // Preserve the normal unmute overlay, renderer and all existing load options.
  try {
    const player = window.RufflePlayer || (window.RufflePlayer = {});
    const config = player.config || (player.config = {});
    config.autoplay = 'on';
  } catch (_) { /* A page with immutable config retains its own behavior. */ }
})();
