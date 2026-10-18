const {test} = require('node:test');
const assert = require('node:assert/strict');
const {adaptPublicSwfHeaders} = require('../app/src/main/assets/compatibility/public-swf.js');
function request(extra={}) {
  return {url:'https://res.17roco.qq.com/swf/ROCO-Z8.swf?b123',originUrl:'https://17roco.qq.com/default.html?123',method:'GET',type:'xmlhttprequest',statusCode:200,responseHeaders:[{name:'Content-Type',value:'application/x-shockwave-flash'},{name:'Cache-Control',value:'public,max-age=3600'}],...extra};
}
test('only the verified public SWF read by official page receives a missing origin header',()=>{
  const input=request(),before=structuredClone(input);
  assert.deepEqual(adaptPublicSwfHeaders(input),{responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'https://17roco.qq.com'}]});
  assert.deepEqual(input,before);
  assert(!adaptPublicSwfHeaders(input).responseHeaders.some(h=>h.name.toLowerCase()==='access-control-allow-credentials'));
});
test('origin, resource, method, request type and response type boundaries fail closed',()=>{
  for(const extra of [
    {url:'http://res.17roco.qq.com/swf/ROCO-Z8.swf'},
    {url:'https://res.17roco.qq.com:8443/swf/ROCO-Z8.swf'},
    {url:'https://res.17roco.qq.com.evil.example/swf/ROCO-Z8.swf'},
    {url:'https://res.17roco.qq.com/swf/ROCO-Z8.swf.evil'},
    {url:'https://res.17roco.qq.com/swf/other.swf'},
    {url:'https://user:pass@res.17roco.qq.com/swf/ROCO-Z8.swf'},
    {originUrl:'https://evil.example/',documentUrl:'https://17roco.qq.com/default.html'},
    {originUrl:'http://17roco.qq.com/default.html'},
    {originUrl:'https://17roco.qq.com:8443/default.html'},
    {originUrl:'https://17roco.qq.com/unrelated.html'},
    {originUrl:undefined,documentUrl:undefined},
    {method:'POST'}, {statusCode:403}, {statusCode:302}, {type:'image'},
    {responseHeaders:[{name:'Content-Type',value:'text/html'}]}, {responseHeaders:undefined}
  ]) assert.equal(adaptPublicSwfHeaders(request(extra)),undefined,JSON.stringify(extra));
});
test('existing server CORS policy is retained and documentUrl fallback is restricted',()=>{
  for(const value of ['*','https://another.example','']) {
    const input=request();input.responseHeaders.push({name:'access-control-allow-origin',value});
    assert.equal(adaptPublicSwfHeaders(input),undefined);
  }
  for(const value of ['true','false']) {
    const input=request();input.responseHeaders.push({name:'Access-Control-Allow-Credentials',value});
    assert.equal(adaptPublicSwfHeaders(input),undefined);
  }
  assert(adaptPublicSwfHeaders(request({originUrl:undefined,documentUrl:'https://17roco.qq.com/default.html'})));
  assert.equal(adaptPublicSwfHeaders(request({originUrl:undefined,documentUrl:'https://login.qq.com/'})),undefined);
});
