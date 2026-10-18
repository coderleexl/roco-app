const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/compatibility/socket-config.js'),'utf8');
const proxies=['dir.17roco.qq.com','stat.17roco.qq.com'].map(host=>({host,port:443,proxyUrl:'ws://127.0.0.1:31234/'+'a'.repeat(48)+'/'+host}));
function install(url,config=proxies) {
 const window={location:{href:url},RufflePlayer:{config:{autoplay:'on',preferredRenderer:'webgl'}}};
 const ctx=vm.createContext({window,URL});
 vm.runInContext(source,ctx);
 ctx.installTimeCasketSocketConfig(config,65535);
 return window.RufflePlayer.config;
}
test('only game frames get exact directory/stat bridge configuration with warning diagnostics',()=>{
 const config=install('https://web2.17roco.qq.com/game');
 assert.equal(config.socketProxy.length,65537);
 assert.deepEqual(Array.from(config.socketProxy.slice(0,2)),proxies);
 assert.equal(config.socketProxy[65536].host,'zone65535.17roco.qq.com');
 assert.equal(config.logLevel,'warn');
 assert.equal(config.autoplay,'on');
 assert.equal(config.preferredRenderer,'webgl');
 for(const url of ['https://17roco.qq.com/','https://evil.example','http://web2.17roco.qq.com/','https://x:y@web2.17roco.qq.com'])assert.equal(install(url).socketProxy,undefined);
});
test('malformed capabilities, arbitrary destinations, ports and proxy URLs are rejected',()=>{
 const mutations=[{host:'evil.example'},{port:80},{proxyUrl:'ws://evil.example/x'},{proxyUrl:'ws://127.0.0.1:31234/guess/dir.17roco.qq.com'},{proxyUrl:proxies[0].proxyUrl+'?secret=x'},{proxyUrl:proxies[0].proxyUrl+'#x'}];
 for(const mutation of mutations)assert.equal(install('https://web2.17roco.qq.com/',[{...proxies[0],...mutation},proxies[1]]).socketProxy,undefined);
});

test('numeric zone family expands lazily once and preserves exact host, port and capability',()=>{
 const {window,calls}=routing(),config=window.RufflePlayer.config;
 assert.equal(typeof Object.getOwnPropertyDescriptor(config,'socketProxy').get,'function');
 const start=performance.now(),entries=config.socketProxy;
 assert.equal(entries.length,65537);assert.equal(config.socketProxy,entries);
 assert.equal(Object.getOwnPropertyDescriptor(config,'socketProxy').get,undefined);
 for(const zone of [1,5,7,1234,65535]) {
  const item=entries[zone+1];assert.equal(item.host,'zone'+zone+'.17roco.qq.com');assert.equal(item.port,443);
  assert.equal(item.proxyUrl,proxies[0].proxyUrl.replace('dir.17roco.qq.com',item.host));
  new window.WebSocket(item.proxyUrl);assert.equal(calls.at(-1)[0],'owner');
 }
 for(const host of ['zone0.17roco.qq.com','zone01.17roco.qq.com','zone65536.17roco.qq.com','zone*.17roco.qq.com','zone7.17roco.qq.com.evil.example','zone7.17roco.qq.com:80']) {
  new window.WebSocket(proxies[0].proxyUrl.replace('dir.17roco.qq.com',host));assert.equal(calls.at(-1)[0],'local');
 }
 assert(performance.now()-start<5000,'bounded expansion must complete promptly');
});

test('zone expansion rejects mismatched capability roots and unsupported table limits',()=>{
 const mismatched=[proxies[0],{...proxies[1],proxyUrl:proxies[1].proxyUrl.replace('a'.repeat(48),'b'.repeat(48))}];
 assert.equal(install('https://web2.17roco.qq.com/',mismatched).socketProxy,undefined);
 for(const maxZone of [undefined,0,256,65536,'65535']) {
  const window={location:{href:'https://web2.17roco.qq.com/'}};
  const ctx=vm.createContext({window,URL});vm.runInContext(source,ctx);ctx.installTimeCasketSocketConfig(proxies,maxZone);
  assert.equal(window.RufflePlayer,undefined);
 }
});

function routing(topUrl='https://17roco.qq.com/') {
 const calls=[];
 class LocalSocket {constructor(url){calls.push(['local',url]);this.listeners=[];}addEventListener(...args){this.listeners.push(args);}}
 class OwnerSocket {constructor(url){calls.push(['owner',url]);this.listeners=[];}addEventListener(...args){this.listeners.push(args);}}
 const window={location:{href:'https://web2.17roco.qq.com/game'},WebSocket:LocalSocket,
  top:{location:{href:topUrl},WebSocket:OwnerSocket}};
 const ctx=vm.createContext({window,URL});vm.runInContext(source,ctx);ctx.installTimeCasketSocketConfig(proxies,65535);
 return {window,ctx,calls,LocalSocket};
}

test('only exact app bridge capabilities use the accessible official top constructor',()=>{
 const {window,calls,LocalSocket}=routing();
 const socket=new window.WebSocket(proxies[0].proxyUrl);assert(socket instanceof LocalSocket);
 assert.equal(calls[0][0],'owner');assert.equal(socket.listeners[0][0],'message');assert.equal(socket.listeners[0][2].capture,true);
 for(const address of ['wss://other.example/',proxies[0].proxyUrl.replace(':31234',':31235'),proxies[0].proxyUrl.replace('a'.repeat(48),'b'.repeat(48)),new URL(proxies[0].proxyUrl)]) {
  new window.WebSocket(address);assert.equal(calls.at(-1)[0],'local');
 }
});

test('foreign binary messages become same-realm ArrayBuffers without changing bytes',()=>{
 const {window,ctx}=routing(),socket=new window.WebSocket(proxies[0].proxyUrl);
 const event={data:new Uint8Array([0,255,3,128,0]).buffer};
 window.received=event;assert.equal(vm.runInContext('window.received.data instanceof ArrayBuffer',ctx),false);
 socket.listeners[0][1](event);
 assert.equal(vm.runInContext('window.received.data instanceof ArrayBuffer',ctx),true);
 assert.deepEqual(Array.from(new Uint8Array(event.data)),[0,255,3,128,0]);
 const text={data:'text'};socket.listeners[0][1](text);assert.equal(text.data,'text');
});

test('untrusted, inaccessible and non-homepage owners retain original frame behavior',()=>{
 for(const url of ['https://graph.qq.com/','https://17roco.qq.com/other','http://17roco.qq.com/','https://17roco.qq.com:8443/','https://u:p@17roco.qq.com/']) {
  const {window,calls}=routing(url);new window.WebSocket(proxies[0].proxyUrl);assert.equal(calls[0][0],'local');
 }
 const {window,calls}=routing();Object.defineProperty(window.top,'location',{get(){throw Error('inaccessible');}});
 new window.WebSocket(proxies[0].proxyUrl);assert.equal(calls[0][0],'local');
});
test('background retries a lost early native request and registers before readiness acknowledgement',async()=>{
 let requests=0,registered=0;
 let ready;
 const done=new Promise(resolve=>{ready=resolve;});
 const browser={runtime:{
   getURL:path=>'moz-extension://fixture/'+path,
   sendNativeMessage:(_app,message)=>{
     if(message.kind==='config') {
       if(++requests===1)return new Promise(()=>{});
       return Promise.resolve(JSON.stringify({proxies,maxZone:65535}));
     }
     assert.equal(message.kind,'ready');assert.equal(registered,1);ready();return Promise.resolve({});
   }
 },contentScripts:{register:async options=>{
   registered++;assert.equal(options.world,'MAIN');assert.equal(options.runAt,'document_start');
   assert.deepEqual(Array.from(options.matches),['https://web2.17roco.qq.com/*']);
   assert(options.js[0].code.includes('installTimeCasketSocketConfig('));
   return {unregister(){}};
 }}};
 const background=fs.readFileSync(require.resolve('../app/src/main/assets/compatibility/socket-background.js'),'utf8');
 vm.runInNewContext(background,{browser,fetch:async()=>({text:async()=>source}),JSON,Promise,
   setTimeout:(fn)=>setTimeout(fn,1),clearTimeout});
 await Promise.race([done,new Promise((_,reject)=>setTimeout(()=>reject(Error('Readiness timeout')),200))]);
 assert.equal(requests,2);
});
