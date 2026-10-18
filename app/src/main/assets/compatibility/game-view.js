/* Isolated-world presentation only. Never navigates or copies movie parameters. */
(function (root) {
  'use strict';
  function createGameView(sourceWindow) {
    let activePlayer, restore = [], resizeWindow, resizeListener, visualViewport;
    function exit() {
      if (resizeWindow) resizeWindow.removeEventListener('resize', resizeListener);
      if (visualViewport) for (const event of ['resize', 'scroll']) visualViewport.removeEventListener(event, resizeListener);
      for (const undo of restore.reverse()) { try { undo(); } catch (_) {} }
      restore = []; activePlayer = resizeWindow = resizeListener = visualViewport = undefined;
    }
    function official(win) {
      const url = new URL(win.location.href);
      return !url.username && !url.password && ['https://17roco.qq.com', 'https://web2.17roco.qq.com'].includes(url.origin);
    }
    function attribute(node, name, value) {
      const old = node.getAttribute(name);
      restore.push(() => old === null ? node.removeAttribute(name) : node.setAttribute(name, old));
      node.setAttribute(name, value);
    }
    function enter(element, targetWindow = sourceWindow) {
      const player = element.wrappedJSObject || element;
      // Orientation, native chrome and mobile zoom settle asynchronously. Polling
      // the same target must still refit it even if no Window resize was fired.
      if (activePlayer === player) { resizeListener(); return true; }
      exit();
      try {
        const chain = [];
        let win = targetWindow.wrappedJSObject || targetWindow, target = player;
        // Validate every participating document before changing any of them.
        for (let depth = 0; depth < 6; depth++) {
          if (!official(win) || target.ownerDocument !== win.document) return false;
          chain.push({win, target});
          if (win === win.top) break;
          const frame = win.frameElement;
          if (!frame) return false;
          target = frame; win = win.parent;
        }
        if (!chain.length || chain.at(-1).win !== chain.at(-1).win.top) return false;
        const metadata = player.ruffle?.()?.metadata;
        const dimension = (n, fallback) => Number.isFinite(n) && n >= 100 && n <= 4096 ? n : fallback;
        const width = dimension(metadata?.width, 960), height = dimension(metadata?.height, 560);
        for (const item of chain) {
          const doc = item.win.document;
          if (!doc.documentElement || !doc.body) throw new Error('Document unavailable');
          attribute(doc.documentElement, 'data-time-casket-view', '');
          attribute(item.target, 'data-time-casket-target', '');
          for (let node = item.target.parentElement; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
            attribute(node, 'data-time-casket-path', '');
          }
          const style = doc.createElement('style');
          style.textContent = `
html[data-time-casket-view],html[data-time-casket-view] body{margin:0!important;padding:0!important;min-width:0!important;min-height:0!important;width:100%!important;height:100%!important;overflow:hidden!important;background:#000!important}
html[data-time-casket-view] body *{visibility:hidden!important}
html[data-time-casket-view] [data-time-casket-path]{display:block!important;visibility:hidden!important;position:static!important;margin:0!important;padding:0!important;transform:none!important;filter:none!important;perspective:none!important;contain:none!important;overflow:visible!important;clip:auto!important;clip-path:none!important;opacity:1!important}
html[data-time-casket-view] [data-time-casket-target]{display:block!important;visibility:visible!important;position:fixed!important;left:0!important;top:0!important;margin:0!important;padding:0!important;border:0!important;width:${width}px!important;height:${height}px!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;transform:none!important;transform-origin:0 0!important;z-index:2147483647!important;opacity:1!important}
html[data-time-casket-view] [data-time-casket-target] *{visibility:visible!important}`;
          (doc.head || doc.documentElement).appendChild(style);
          restore.push(() => style.remove());
        }
        const top = chain.at(-1);
        const oldStyle = top.target.getAttribute('style');
        restore.push(() => oldStyle === null ? top.target.removeAttribute('style') : top.target.setAttribute('style', oldStyle));
        const fit = () => {
          const viewport = top.win.visualViewport;
          const availableWidth = viewport ? viewport.width : top.win.innerWidth;
          const availableHeight = viewport ? viewport.height : top.win.innerHeight;
          if (!(Number.isFinite(availableWidth) && Number.isFinite(availableHeight) && availableWidth > 0 && availableHeight > 0)) return;
          const offsetLeft = Number.isFinite(viewport?.offsetLeft) ? viewport.offsetLeft : 0;
          const offsetTop = Number.isFinite(viewport?.offsetTop) ? viewport.offsetTop : 0;
          const scale = Math.min(availableWidth / width, availableHeight / height);
          top.target.style.setProperty('left', (offsetLeft + (availableWidth - width * scale) / 2) + 'px', 'important');
          top.target.style.setProperty('top', (offsetTop + (availableHeight - height * scale) / 2) + 'px', 'important');
          top.target.style.setProperty('transform', 'scale(' + scale + ')', 'important');
        };
        fit();
        resizeWindow = top.win; resizeListener = fit;
        resizeWindow.addEventListener('resize', resizeListener);
        visualViewport = top.win.visualViewport;
        if (visualViewport) for (const event of ['resize', 'scroll']) visualViewport.addEventListener(event, resizeListener);
        activePlayer = player;
        return true;
      } catch (_) { exit(); return false; }
    }
    function mainMovie(win, depth = 0) {
      // Login can be cross-origin. Leave it in its existing frame; never read
      // its URL, credentials or DOM. Only inspect accessible official documents.
      try {
        if (depth >= 5 || !official(win)) return null;
        const doc = win.document;
        for (const element of [...doc.querySelectorAll('ruffle-object,ruffle-embed,ruffle-player')].slice(0, 4)) {
          const player = element.wrappedJSObject || element, api = player.ruffle?.();
          if (api?.readyState !== 2) continue;
          const raw = api.loadedConfig?.url;
          if (typeof raw !== 'string' || raw.length > 4096) continue;
          const movie = new URL(raw, doc.baseURI);
          if (movie.origin === 'https://res.17roco.qq.com' && movie.pathname === '/main.swf') return {element, win};
        }
        for (const frame of [...doc.querySelectorAll('iframe')].slice(0, 8)) {
          const found = mainMovie(frame.contentWindow, depth + 1);
          if (found) return found;
        }
      } catch (_) { /* An inaccessible authentication frame stays untouched. */ }
      return null;
    }
    function enterGame() {
      try {
        const win = sourceWindow.wrappedJSObject || sourceWindow;
        if (win !== win.top || !official(win)) return false;
        if (new URL(win.location.href).origin === 'https://17roco.qq.com') {
          const frame = win.document.getElementById('mainiframe');
          if (!frame || frame.tagName !== 'IFRAME') return false;
          // The visible 960x560 game/login surface is available before main.swf.
          // Do not select the homepage's hidden 1x1 preloader as a movie.
          const target = mainMovie(frame.contentWindow);
          if (target && enter(target.element, target.win)) return true;
          return enter(frame, win);
        }
        const target = mainMovie(win);
        return target ? enter(target.element, target.win) : false;
      } catch (_) { return false; }
    }
    return {enter, enterGame, exit};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createGameView;
  else root.createTimeCasketGameView = createGameView;
})(globalThis);
