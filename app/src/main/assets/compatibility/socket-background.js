'use strict';
// Register before initial navigation, with a fresh in-memory loopback capability.
let socketRegistration;
async function native(kind) {
  let timer;
  try {
    return await Promise.race([
      browser.runtime.sendNativeMessage('time_casket_socket', {kind}),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Native startup timeout')), 500); })
    ]);
  } finally { clearTimeout(timer); }
}
async function prepareSockets() {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const response = await native('config');
      const config = typeof response === 'string' ? JSON.parse(response) : response;
      if (!config || !Array.isArray(config.proxies)) throw new Error('Not ready');
      if (!socketRegistration) {
        const source = await (await fetch(browser.runtime.getURL('socket-config.js'))).text();
        socketRegistration = await browser.contentScripts.register({
          matches: ['https://web2.17roco.qq.com/*'],
          allFrames: true, runAt: 'document_start', world: 'MAIN',
          js: [{code: source + '\ninstallTimeCasketSocketConfig(' + JSON.stringify(config.proxies) + ');'}]
        });
      }
      await native('ready');
      return;
    } catch (_) { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  native('failed').catch(() => {});
}
prepareSockets();
