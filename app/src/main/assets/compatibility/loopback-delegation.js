/* Delegate only loopback access to official frames; preserve explicit site policy. */
(function () {
  'use strict';
  const page = new URL(window.location.href);
  if (page.origin !== 'https://17roco.qq.com' || page.username || page.password) return;
  const directive = 'loopback-network https://17roco.qq.com https://web2.17roco.qq.com';
  function delegate(frame) {
    const current = frame.getAttribute('allow') || '';
    // An explicit website decision, including none, takes precedence.
    if (current.split(';').some(part => part.trim().split(/\s+/)[0] === 'loopback-network')) return;
    frame.setAttribute('allow', current ? current + '; ' + directive : directive);
  }
  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches('iframe')) delegate(node);
    for (const frame of node.querySelectorAll('iframe')) delegate(frame);
  }
  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) scan(node);
  });
  observer.observe(document, {childList: true, subtree: true});
  for (const frame of document.querySelectorAll('iframe')) delegate(frame);
  window.addEventListener('pagehide', () => observer.disconnect(), {once: true});
})();
