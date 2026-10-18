const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function install(url,WebSocket) {
  const calls=[];
  const events={};
  const window={WebSocket,location:{href:url},document:{baseURI:url,addEventListener:(name,fn)=>events[name]=fn},console:Object.fromEntries(['log','warn','error'].map(level=>[level,(...args)=>calls.push([level,...args])]))};
  const source=fs.readFileSync(require.resolve('../app/src/main/assets/compatibility/engine-signals.js'),'utf8');
  vm.runInNewContext(source,{window,URL});
  return {window,calls,events};
}
test('engine signal snapshot classifies failures without retaining raw messages or auth data',()=>{
  const {window,calls}=install('https://web2.17roco.qq.com/game');
  window.console.warn('No socket proxy for dir.17roco.qq.com; token=SECRET');
  window.console.error('AVM2 error: Error #2032 cookie=SECRET');
  window.console.log('Encountered stub: some.api key=SECRET');
  window.console.error({password:'SECRET',toString(){throw Error('must not inspect objects');}});
  assert.equal(calls.length,4);
  const state=window.__timeCasketEngineSignals;
  assert.equal(state.socketMentions,1);
  assert.equal(state.missingSocketProxy,1);
  assert.equal(state.scriptErrors,1);
  assert.equal(state.unsupportedFeatures,1);
  assert.equal(state.socketHosts[0],'dir.17roco.qq.com');
  assert.equal(state.errorCodes[0],2032);
  assert(!JSON.stringify(state).includes('SECRET'));
  for(let i=0;i<1100;i++)window.console.warn('Socket failed');
  assert.equal(state.socketMentions,1000);
});
test('WebSocket diagnostics observe only exact bridge destinations without retaining capabilities',()=>{
  class Socket {constructor(url){this.url=url;this.events={};}addEventListener(k,fn){this.events[k]=fn;}}
  const {window}=install('https://web2.17roco.qq.com/game',Socket);
  const capability='a'.repeat(48),address='ws://127.0.0.1:12345/'+capability+'/dir.17roco.qq.com';
  const socket=new window.WebSocket(address);assert(socket instanceof Socket);
  socket.events.open();socket.events.error();socket.events.close();
  const state=window.__timeCasketEngineSignals;
  assert.equal(state.dirWsAttempt,1);assert.equal(state.dirWsOpen,1);assert.equal(state.dirWsError,1);assert.equal(state.dirWsClose,1);
  new window.WebSocket('wss://other.example/SECRET');
  assert.equal(state.dirWsAttempt,1);assert(!JSON.stringify(state).includes(capability));assert(!JSON.stringify(state).includes('SECRET'));
});
test('movie traces retain fixed milestones only and ignore other movies',()=>{
  const {window,events}=install('https://web2.17roco.qq.com/game');
  const api={loadedConfig:{url:'https://res.17roco.qq.com/main.swf'}};
  const player={matches:()=>true,ruffle:()=>api};
  events.loadedmetadata({target:player});
  const state=window.__timeCasketEngineSignals;
  assert.equal(state.traceAttached,1);
  for(const text of ['[AngelAppInstall] 程序相关的配置文件加载完毕!!','LoginPlugin Debug version initialize!!','推荐请求:SECRET','TypeError: Error #1009 SECRET','SECRET'])api.traceObserver(text);
  api.traceObserver({toString(){throw Error('never inspect trace objects');}});
  assert.equal(state.traceMessages,5);assert.equal(state.configsLoaded,1);assert.equal(state.loginInitialized,1);assert.equal(state.directoryRequests,1);assert.equal(state.traceErrors,1);
  assert(!JSON.stringify(state).includes('SECRET'));
  const foreign={loadedConfig:{url:'https://evil.example/main.swf'}};
  events.loadedmetadata({target:{matches:()=>true,ruffle:()=>foreign}});
  assert.equal(foreign.traceObserver,undefined);
  assert.equal(state.traceAttached,1);
});
test('non-game origins are untouched and script declaration covers the signal collector',()=>{
  for(const url of ['https://17roco.qq.com/','https://evil.example/','http://web2.17roco.qq.com/','https://web2.17roco.qq.com:8443/','https://user:pass@web2.17roco.qq.com/']) {
    const {window}=install(url);
    assert.equal(window.__timeCasketEngineSignals,undefined,url);
  }
  const manifest=require('../app/src/main/assets/compatibility/manifest.json');
  assert(manifest.content_scripts.some(script=>script.world==='MAIN'&&script.js.includes('engine-signals.js')));
});

test('IO and loader HTTP failures retain only bounded counts, never their paths or credentials',()=>{
  const {window,events}=install('https://web2.17roco.qq.com/game');
  const api={loadedConfig:{url:'https://res.17roco.qq.com/main.swf'}};
  events.loadedmetadata({target:{matches:()=>true,ruffle:()=>api}});
  api.traceObserver('IOErrorEvent https://res.17roco.qq.com/activity/SECRET.swf?ticket=SECRET');
  api.traceObserver('[NewLoader] >>>>>>>>>>>>>http code:404 SECRET');
  api.traceObserver('[NewLoader] >>>>>>>>>>>>>http code:200 SECRET');
  window.console.error('ioError token=SECRET');
  const state=window.__timeCasketEngineSignals;
  assert.equal(state.ioErrors,2);assert.equal(state.httpErrors,1);
  assert(!JSON.stringify(state).includes('SECRET'));
  for(let i=0;i<1100;i++)api.traceObserver('IOError http code:500');
  assert.equal(state.ioErrors,1000);assert.equal(state.httpErrors,1000);
});

test('fixed script error and missing-font categories are observed in both traces and console without raw text',()=>{
  const {window,events}=install('https://web2.17roco.qq.com/game');
  const api={loadedConfig:{url:'https://res.17roco.qq.com/main.swf'}};
  events.loadedmetadata({target:{matches:()=>true,ruffle:()=>api}});
  api.traceObserver('TypeError: Error #1010 SECRET');
  window.console.error('AVM2 error Error #1009 SECRET');
  window.console.error('IOError Error #2032 SECRET');
  window.console.warn('Font SECRET not found');
  window.console.warn('Loading font SECRET');
  const state=window.__timeCasketEngineSignals;
  assert.equal(state.undefinedAccessErrors,1);assert.equal(state.nullObjectErrors,1);
  assert.equal(state.streamErrors,1);assert.equal(state.fontWarnings,1);
  api.traceObserver('Error #10101 SECRET');assert.equal(state.undefinedAccessErrors,1);
  assert(!JSON.stringify(state).includes('SECRET'));
});
