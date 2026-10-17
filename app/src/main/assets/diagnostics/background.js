'use strict';
const started = new Map();
const urls = ['*://17roco.qq.com/*', '*://*.17roco.qq.com/*'];
function send(event) {
  browser.runtime.sendNativeMessage('roco_diagnostics', event).catch(() => {});
}
browser.webRequest.onBeforeRequest.addListener(d => {
  if (started.size > 2000) started.clear();
  started.set(d.requestId, d.timeStamp);
}, {urls});
browser.webRequest.onCompleted.addListener(d => {
  const time = started.get(d.requestId);
  started.delete(d.requestId);
  if (time !== undefined) send(RocoPrivacy.requestEvent(d, time));
}, {urls});
browser.webRequest.onErrorOccurred.addListener(d => {
  const time = started.get(d.requestId);
  started.delete(d.requestId);
  if (time !== undefined) send(RocoPrivacy.requestEvent({...d, statusCode: 0}, time));
}, {urls});
