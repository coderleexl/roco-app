const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {adaptPublicAssetHeaders, requestPatterns} = require('../app/src/main/assets/compatibility/public-swf.js');
function request(extra={}) {
  return {url:'https://res.17roco.qq.com/swf/ROCO-Z8.swf?b123',originUrl:'https://17roco.qq.com/default.html?123',method:'GET',type:'xmlhttprequest',statusCode:200,responseHeaders:[{name:'Content-Type',value:'application/x-shockwave-flash'},{name:'Cache-Control',value:'public,max-age=3600'}],...extra};
}
test('only the verified public SWF read by official page receives a missing origin header',()=>{
  const input=request(),before=structuredClone(input);
  assert.deepEqual(adaptPublicAssetHeaders(input),{responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'https://17roco.qq.com'}]});
  assert.deepEqual(input,before);
  assert(!adaptPublicAssetHeaders(input).responseHeaders.some(h=>h.name.toLowerCase()==='access-control-allow-credentials'));
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
  ]) assert.equal(adaptPublicAssetHeaders(request(extra)),undefined,JSON.stringify(extra));
});
test('existing server CORS policy is retained and documentUrl fallback is restricted',()=>{
  for(const value of ['*','https://another.example','']) {
    const input=request();input.responseHeaders.push({name:'access-control-allow-origin',value});
    assert.equal(adaptPublicAssetHeaders(input),undefined);
  }
  for(const value of ['true','false']) {
    const input=request();input.responseHeaders.push({name:'Access-Control-Allow-Credentials',value});
    assert.equal(adaptPublicAssetHeaders(input),undefined);
  }
  assert(adaptPublicAssetHeaders(request({originUrl:undefined,documentUrl:'https://17roco.qq.com/default.html'})));
  assert.equal(adaptPublicAssetHeaders(request({originUrl:undefined,documentUrl:'https://login.qq.com/'})),undefined);
});

test('observed homepage preloader and post-scan main movie allow only their official source',()=>{
  for(const [path,originUrl,origin] of [
    ['/preloader.swf','https://17roco.qq.com/','https://17roco.qq.com'],
    ['/main.swf','https://web2.17roco.qq.com/official-callback','https://web2.17roco.qq.com']
  ]) {
    const input=request({url:'https://res.17roco.qq.com'+path,originUrl});
    assert.deepEqual(adaptPublicAssetHeaders(input),{responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:origin}]});
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
    ]) assert.equal(adaptPublicAssetHeaders({...input,...extra}),undefined);
  }
  assert.equal(adaptPublicAssetHeaders(request({url:'https://res.17roco.qq.com/main.swf'})),undefined);
  assert.equal(adaptPublicAssetHeaders(request({url:'https://res.17roco.qq.com/preloader.swf',originUrl:'https://web2.17roco.qq.com/'})),undefined);
});

test('observed public version config accepts only octet-stream and exact game origin',()=>{
  const input=request({url:'https://res.17roco.qq.com/ver.config?v=public-version',originUrl:'https://web2.17roco.qq.com/official-callback',responseHeaders:[{name:'Content-Type',value:'application/octet-stream'}]});
  assert.deepEqual(adaptPublicAssetHeaders(input),{responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'https://web2.17roco.qq.com'}]});
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
  ]) assert.equal(adaptPublicAssetHeaders({...input,...extra}),undefined,JSON.stringify(extra));
  assert(adaptPublicAssetHeaders({...input,originUrl:undefined,documentUrl:input.originUrl}));
  assert.equal(adaptPublicAssetHeaders(request({responseHeaders:input.responseHeaders})),undefined);
});

test('homepage animation fragments stay within the official movie family',()=>{
  const input=request({url:'https://res.17roco.qq.com/swf/ceils/ROCO-Z8_Ceil_3.swf'});
  assert.deepEqual(adaptPublicAssetHeaders(input),{responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'https://17roco.qq.com'}]});
  for(const extra of [
    {url:'https://res.17roco.qq.com/swf/ceils/unrelated.swf'},
    {url:input.url+'.evil'},
    {originUrl:'https://login.qq.com/'},
    {originUrl:'https://17roco.qq.com/unrelated.html'},
    {originUrl:'https://evil.example/',documentUrl:input.originUrl},
    {url:'http://res.17roco.qq.com/swf/ceils/ROCO-Z8_Ceil_3.swf'},
    {url:'https://res.17roco.qq.com:8443/swf/ceils/ROCO-Z8_Ceil_3.swf'},
    {method:'POST'}, {statusCode:404}, {type:'image'},
    {responseHeaders:[{name:'Content-Type',value:'application/octet-stream'}]},
    {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'*'}]},
    {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Credentials',value:'true'}]}
  ]) assert.equal(adaptPublicAssetHeaders({...input,...extra}),undefined);
});

test('shared static policy covers dynamic resource families without allowing arbitrary endpoints',()=>{
  for(const [path,mime,originUrl] of [
    ['/swf/ceils/ROCO-Z8_Ceil_4.swf','application/x-shockwave-flash','https://17roco.qq.com/default.html'],
    ['/swf/new-module.swf','application/x-shockwave-flash','https://web2.17roco.qq.com/game'],
    ['/libs/new-library.swf','application/x-shockwave-flash','https://web2.17roco.qq.com/game'],
    ['/conf/new.config','application/octet-stream','https://web2.17roco.qq.com/game'],
    ['/res/scene/123/map.swf','application/x-shockwave-flash','https://web2.17roco.qq.com/game'],
    ['/res/item/123.png','image/png','https://web2.17roco.qq.com/game'],
    ['/res/scene/bg.jpg','image/jpeg','https://web2.17roco.qq.com/game'],
    ['/res/npc/config.xml','text/xml','https://web2.17roco.qq.com/game'],
    ['/res/task2/data.bin','application/octet-stream','https://web2.17roco.qq.com/game'],
    ['/res/magic/sound.mp3','audio/mpeg','https://web2.17roco.qq.com/game']
  ]) {
    const input=request({url:'https://res.17roco.qq.com'+path,originUrl,responseHeaders:[{name:'Content-Type',value:mime}]});
    assert(adaptPublicAssetHeaders(input),path);
    assert.equal(adaptPublicAssetHeaders({...input,responseHeaders:[{name:'Content-Type',value:'text/html'}]}),undefined);
  }
  for(const path of ['/cgi-bin/login','/fcgi-bin/login2','/res/auth.php','/res/unknown.exe','/libs/private.json','/conf/login.php','/swf/../cgi-bin/test.swf','/res/%2fsecret.swf','/res/crossdomain.xml','/res/cgi-bin/login.swf','/res/.hidden/a.swf']) {
    assert.equal(adaptPublicAssetHeaders(request({url:'https://res.17roco.qq.com'+path,originUrl:'https://web2.17roco.qq.com/game'})),undefined,path);
  }
});

test('official Global bootstrap references pass shared policy with observed MIME',()=>{
  for(const [path,mime] of [
    ['/Global.xml','text/xml'],
    ['/swf/bb.swf','application/x-shockwave-flash'],
    ['/libs/AngelClientLibs_s.swf','application/x-shockwave-flash'],
    ['/libs/AngelProtocal.swf','application/x-shockwave-flash'],
    ['/conf/Angel.config','application/octet-stream']
  ]) {
    const input=request({url:'https://res.17roco.qq.com'+path,originUrl:'https://web2.17roco.qq.com/official-callback',responseHeaders:[{name:'Content-Type',value:mime+'; charset=utf-8'}]});
    assert.deepEqual(adaptPublicAssetHeaders(input),{responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'https://web2.17roco.qq.com'}]},path);
    for(const extra of [
      {url:input.url+'.evil'},
      {url:'https://res.17roco.qq.com/unlisted.config'},
      {url:input.url.replace('https:','http:')},
      {url:input.url.replace('res.17roco.qq.com','res.17roco.qq.com:8443')},
      {url:input.url.replace('res.17roco.qq.com','res.17roco.qq.com.evil.example')},
      {originUrl:'https://17roco.qq.com/'},
      {originUrl:'https://evil.example/',documentUrl:input.originUrl},
      {originUrl:'http://web2.17roco.qq.com/'},
      {originUrl:undefined,documentUrl:undefined},
      {method:'POST'}, {statusCode:403}, {type:'image'},
      {responseHeaders:[{name:'Content-Type',value:'text/html'}]},
      {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Credentials',value:'true'}]},
      {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'*'}]}
    ]) assert.equal(adaptPublicAssetHeaders({...input,...extra}),undefined,path+JSON.stringify(extra));
  }
});

test('browser hook and manifest apply the shared policy without page script overrides',()=>{
  const assetDir='../app/src/main/assets/compatibility/';
  const manifest=require(assetDir+'manifest.json');
  for(const pattern of requestPatterns) assert(manifest.permissions.includes(pattern),pattern);
  const calls=[];
  const context={URL,browser:{webRequest:{onHeadersReceived:{addListener:(...args)=>calls.push(args)}}}};
  vm.runInNewContext(fs.readFileSync(require.resolve(assetDir+'public-swf.js'),'utf8'),context);
  assert.equal(calls.length,1);
  const [callback,filter,options]=calls[0];
  assert.deepEqual(Array.from(filter.urls),requestPatterns);
  assert.deepEqual(Array.from(filter.types),['xmlhttprequest']);
  assert.deepEqual(Array.from(options),['blocking','responseHeaders']);
  const input=request({url:'https://res.17roco.qq.com/Global.xml',originUrl:'https://web2.17roco.qq.com/game',responseHeaders:[{name:'Content-Type',value:'text/xml'}]});
  assert.equal(callback(input).responseHeaders.at(-1).value,'https://web2.17roco.qq.com');
  assert.equal(callback({...input,originUrl:'https://evil.example/'}),undefined);
});

test('version inventory plugin/activity/app/video families share typed policy and retain boundaries',()=>{
  for(const [path,mime] of [
    ['/plugins/Effect/EffectPluginLib.swf','application/x-shockwave-flash'],
    ['/plugins/Other/Config.xml','text/xml'],
    ['/plugins/Other/text.txt','text/plain'],
    ['/plugins/Other/font.fint','application/octet-stream'],
    ['/activity/3989/ui3989.swf','application/x-shockwave-flash'],
    ['/activity/3989/image.png','image/png'],
    ['/apps/Other/Main.swf','application/x-shockwave-flash'],
    ['/apps/Other/Config.xml','application/xml'],
    ['/video/intro.swf','application/x-shockwave-flash'],
    ['/video/intro.mp4','video/mp4']
  ]) {
    const input=request({url:'https://res.17roco.qq.com'+path,originUrl:'https://web2.17roco.qq.com/game',responseHeaders:[{name:'Content-Type',value:mime}]});
    assert(adaptPublicAssetHeaders(input),path);
    for(const extra of [
      {originUrl:'https://17roco.qq.com/'},
      {originUrl:'https://evil.example/'},
      {url:input.url+'.evil'},
      {method:'POST'}, {type:'image'}, {statusCode:404},
      {responseHeaders:[{name:'Content-Type',value:'text/html'}]},
      {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Credentials',value:'true'}]},
      {responseHeaders:[...input.responseHeaders,{name:'Access-Control-Allow-Origin',value:'*'}]}
    ]) assert.equal(adaptPublicAssetHeaders({...input,...extra}),undefined,path);
  }
  for(const path of ['/plugins/cgi-bin/login.swf','/plugins/Effect/backup.bak','/plugins/Effect/code.js','/plugins/Effect/page.html','/activity2/Main.swf','/apps2/Main.swf','/h5/game.js','/video/config.xml']) {
    assert.equal(adaptPublicAssetHeaders(request({url:'https://res.17roco.qq.com'+path,originUrl:'https://web2.17roco.qq.com/game'})),undefined,path);
  }
});
