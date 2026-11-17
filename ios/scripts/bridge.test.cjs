const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {webcrypto} = require('node:crypto');
const source = fs.readFileSync('ios/TimeCasket/bridge.js', 'utf8');
class CloseEvent extends Event { constructor(type, options) { super(type); Object.assign(this, options); } }
function fixture(origin = 'https://web2.17roco.qq.com') {
  const calls = []; let receive;
  const win = {location: {origin}, crypto: webcrypto, Request, Response, atob, btoa,
    fetch: async () => new Response('original'), WebSocket: class {},
    webkit: {messageHandlers: {timeCasket: {postMessage: async item => {
      calls.push(item);
      if (item.command === 'fetch' || item.command === 'asset') return {data: btoa('bytes'), type: 'application/wasm', status: 200};
      if (item.command === 'receive') return await new Promise(resolve => { receive = resolve; });
      return {ok:true};
    }}}}};
  vm.runInNewContext(source, {window:win, EventTarget, Event, MessageEvent, CloseEvent, Blob, ArrayBuffer, Uint8Array, URL, TextEncoder, DOMException});
  return {win, calls, deliver: item => receive(item)};
}
const tick = () => new Promise(resolve => setImmediate(resolve));
test('unrelated origins cannot install the native adapter', () => {
  const {win} = fixture('https://example.com'); assert.equal(win.RufflePlayer, undefined);
});
test('auth and CGI requests keep browser fetch; public resources use anonymous native fetch', async () => {
  const {win,calls} = fixture();
  assert.equal(await (await win.fetch('https://17roco.qq.com/cgi-bin/login')).text(), 'original');
  assert.equal(await (await win.fetch('https://res.17roco.qq.com/main.swf')).text(), 'bytes');
  assert.equal(calls.length, 1); assert.equal(calls[0].command, 'fetch');
});
test('embedded wasm uses the bundle bridge and preserves response URL/MIME', async () => {
  const {win} = fixture(); const u='tc-extension://runtime/dist/assets/ruffle_web_bg.wasm';
  const r=await win.fetch(u); assert.equal(r.url,u); assert.equal(r.headers.get('Content-Type'),'application/wasm');
});
test('aborted requests are not sent', async () => {
  const {win,calls} = fixture(); const c=new AbortController(); c.abort();
  await assert.rejects(win.fetch('https://res.17roco.qq.com/main.swf', {signal:c.signal}), {name:'AbortError'});
  assert.equal(calls.length,0);
});
test('restricted socket sends in order and receives an ArrayBuffer', async () => {
  const {win,calls,deliver} = fixture(); const socket = new win.WebSocket('tc-socket://dir.17roco.qq.com');
  socket.binaryType='arraybuffer'; await tick(); assert.equal(socket.readyState,1);
  socket.send(new Uint8Array([1,2])); socket.send(new Uint8Array([3])); await tick();
  assert.deepEqual(calls.filter(c=>c.command==='send').map(c=>c.data),['AQI=','Aw==']);
  const message = new Promise(resolve => socket.onmessage=resolve);
  deliver({data:'BAU=',closed:true}); assert.deepEqual([...new Uint8Array((await message).data)],[4,5]);
  await tick(); assert.equal(socket.readyState,3);
});
test('unknown hosts and out-of-range zones are rejected', () => {
  const {win}=fixture();
  for(const host of ['localhost','zone0.17roco.qq.com','zone65536.17roco.qq.com','dir.17roco.qq.com.evil'])
    assert.throws(()=>new win.WebSocket('tc-socket://'+host),{name:'SecurityError'});
});
test('socket proxy mapping includes the bootstrap and numeric zone bounds', () => {
  const {win}=fixture(); const entries=win.RufflePlayer.config.socketProxy;
  assert.equal(entries.length,65537); assert.equal(entries[2].host,'zone1.17roco.qq.com');
  assert.equal(entries.at(-1).host,'zone65535.17roco.qq.com');
});
