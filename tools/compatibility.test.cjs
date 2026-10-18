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

test('observed homepage preloader and post-scan main movie allow only their official source',()=>{
  for(const [path,originUrl,origin] of [
    ['/preloader.swf','https://17roco.qq.com/','https://17roco.qq.com'],
    ['/main.swf','https://web2.17roco.qq.com/official-callback','https://web2.17roco.qq.com']
  ]) {
    const input=request({url:'https://res.17roco.qq.com'+path,originUrl});
    assert.deepEqual(adaptPublicSwfHeaders(input),{responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:origin}]});
    for(const extra of [
      {originUrl:'https://evil.example/'},
      {originUrl:'https://web2.17roco.qq.com.evil.example/'},
      {originUrl:'http://web2.17roco.qq.com/'},
      {originUrl:'https://web2.17roco.qq.com:8443/'},
      {originUrl:'https://user:pass@web2.17roco.qq.com/'},
      {url:'https://res.17roco.qq.com'+path+'.evil'},
      {url:'https://res.17roco.qq.com/other.swf'},
      {method:'POST'}, {statusCode:403}, {type:'image'},
      {responseHeaders:[{name:'Content-Type',value:'text/html'}]},
      {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Credentials',value:'true'}]},
      {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'*'}]}
    ]) assert.equal(adaptPublicSwfHeaders({...input,...extra}),undefined);
  }
  assert.equal(adaptPublicSwfHeaders(request({url:'https://res.17roco.qq.com/main.swf'})),undefined);
  assert.equal(adaptPublicSwfHeaders(request({url:'https://res.17roco.qq.com/preloader.swf',originUrl:'https://web2.17roco.qq.com/'})),undefined);
});

test('observed public version config accepts only octet-stream and exact game origin',()=>{
  const input=request({url:'https://res.17roco.qq.com/ver.config?v=public-version',originUrl:'https://web2.17roco.qq.com/official-callback',responseHeaders:[{name:'Content-Type',value:'application/octet-stream'}]});
  assert.deepEqual(adaptPublicSwfHeaders(input),{responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'https://web2.17roco.qq.com'}]});
  for(const extra of [
    {url:'https://res.17roco.qq.com/ver.config.evil'},
    {url:'https://res.17roco.qq.com/other.config'},
    {url:'http://res.17roco.qq.com/ver.config'},
    {url:'https://res.17roco.qq.com:8443/ver.config'},
    {url:'https://res.17roco.qq.com.evil.example/ver.config'},
    {originUrl:'https://17roco.qq.com/'},
    {originUrl:'https://evil.example/',documentUrl:input.originUrl},
    {originUrl:undefined,documentUrl:undefined},
    {originUrl:'http://web2.17roco.qq.com/'},
    {originUrl:'https://web2.17roco.qq.com:8443/'},
    {originUrl:'https://web2.17roco.qq.com.evil.example/'},
    {originUrl:'https://user:pass@web2.17roco.qq.com/'},
    {method:'POST'}, {statusCode:302}, {statusCode:404}, {type:'image'},
    {responseHeaders:[{name:'Content-Type',value:'text/html'}]},
    {responseHeaders:[{name:'Content-Type',value:'application/x-shockwave-flash'}]},
    {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'*'}]},
    {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Credentials',value:'true'}]}
  ]) assert.equal(adaptPublicSwfHeaders({...input,...extra}),undefined,JSON.stringify(extra));
  assert(adaptPublicSwfHeaders({...input,originUrl:undefined,documentUrl:input.originUrl}));
  assert.equal(adaptPublicSwfHeaders(request({responseHeaders:input.responseHeaders})),undefined);
});
