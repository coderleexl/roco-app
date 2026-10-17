const {test} = require('node:test');
const assert = require('node:assert/strict');
const {safeUrl, requestEvent} = require('../app/src/main/assets/diagnostics/privacy.js');

test('URLs never retain credentials, query, fragment or opaque path tokens', () => {
  assert.equal(safeUrl('https://user:pass@17roco.qq.com/cgi-bin/login?ticket=SECRET#SECRET'), 'https://17roco.qq.com/cgi-bin/login');
  assert.equal(safeUrl('https://example.com/sub/SECRET_TOKEN_abcdefghijklmnopqrstuvwxyz'), 'https://example.com/[redacted]/[redacted]');
  assert.equal(safeUrl('javascript:alert("SECRET")'), '[non-web]');
});
test('request telemetry discards headers, bodies and private fields', () => {
  const e = requestEvent({url:'https://17roco.qq.com/iframe.html?ticket=SECRET',statusCode:200,timeStamp:120,requestHeaders:[{value:'SECRET'}],requestBody:'SECRET'}, 100);
  assert.deepEqual(e, {kind:'request',url:'https://17roco.qq.com/iframe.html',status:200,ms:20});
  assert(!JSON.stringify(e).includes('SECRET'));
});
