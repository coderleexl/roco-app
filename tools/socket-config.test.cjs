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
 ctx.installTimeCasketSocketConfig(config);
 return window.RufflePlayer.config;
}
test('only game frames get exact directory/stat bridge configuration with warning diagnostics',()=>{
 const config=install('https://web2.17roco.qq.com/game');
 assert.equal(config.socketProxy,proxies);
 assert.equal(config.logLevel,'warn');
 assert.equal(config.autoplay,'on');
 assert.equal(config.preferredRenderer,'webgl');
 for(const url of ['https://17roco.qq.com/','https://evil.example','http://web2.17roco.qq.com/','https://x:y@web2.17roco.qq.com'])assert.equal(install(url).socketProxy,undefined);
});
test('malformed capabilities, arbitrary destinations, ports and proxy URLs are rejected',()=>{
 const mutations=[{host:'evil.example'},{port:80},{proxyUrl:'ws://evil.example/x'},{proxyUrl:'ws://127.0.0.1:31234/guess/dir.17roco.qq.com'},{proxyUrl:proxies[0].proxyUrl+'?secret=x'},{proxyUrl:proxies[0].proxyUrl+'#x'}];
 for(const mutation of mutations)assert.equal(install('https://web2.17roco.qq.com/',[{...proxies[0],...mutation},proxies[1]]).socketProxy,undefined);
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
       return Promise.resolve(JSON.stringify({proxies}));
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
