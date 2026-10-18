const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/compatibility/game-control.js'),'utf8');
function install({origin='https://web2.17roco.qq.com',movie='https://res.17roco.qq.com/main.swf',reload=()=>Promise.resolve(),ready=2}={}) {
  const sent=[],events={};let receiver,disconnect,interval,cleared=0,closed=0,calls=0,connections=0;
  const config={url:movie};
  Object.defineProperty(config,'parameters',{get(){throw Error('must not read authentication');}});
  const api={readyState:ready,loadedConfig:config,reload(...args){assert.equal(args.length,0);calls++;return reload();}};
  const player={wrappedJSObject:{ruffle:()=>api}};
  const port={postMessage:m=>sent.push(m),onMessage:{addListener:f=>receiver=f},onDisconnect:{addListener:f=>disconnect=f},disconnect(){closed++;}};
  const window={location:{origin,reload(){throw Error('document reload forbidden');}},setInterval(f){interval=f;return 7;},clearInterval(id){assert.equal(id,7);cleared++;},addEventListener:(type,f)=>events[type]=f};
  const document={baseURI:origin+'/',querySelectorAll:()=>[player]};
  const browser={runtime:{connectNative(name){assert.equal(name,'time_casket_game_control');connections++;return port;}}};
  vm.runInNewContext(source,{window,document,browser,URL,Promise});
  return {window,sent,api,request:()=>receiver({kind:'reload'}),events,tick:()=>interval(),disconnect:()=>disconnect(),get calls(){return calls;},get connections(){return connections;},get cleared(){return cleared;},get closed(){return closed;}};
}
test('refresh invokes only ready main Ruffle API without exporting parameters or navigating',async()=>{
  const env=install();assert.equal(env.sent[0].ready,true);
  env.request();await Promise.resolve();
  assert.equal(env.calls,1);assert.equal(env.sent.at(-1).kind,'reloaded');
  assert(!JSON.stringify(env.sent).includes('url'));
  env.events.pagehide();assert.equal(env.closed,1);assert.equal(env.cleared,1);
});
test('native phase telemetry sends validated counters once and never arbitrary fields',()=>{
  const env=install();env.window.__timeCasketEngineSignals={traceAttached:1,configsLoaded:2,loginInitialized:'SECRET',directoryRequests:1001,traceErrors:0,missingSocketProxy:0,cookie:'SECRET'};
  env.tick();const signal=env.sent.at(-1);assert.equal(signal.kind,'signals');
  assert.deepEqual(Object.keys(signal.values).sort(),['configsLoaded','missingSocketProxy','traceAttached','traceErrors']);
  assert(!JSON.stringify(signal).includes('SECRET'));
  const before=env.sent.length;env.tick();assert.equal(env.sent.length,before);
});
test('other origins, movies and unready players cannot become refresh targets',()=>{
  const foreign=install({origin:'https://evil.example'});assert.equal(foreign.connections,0);
  for(const options of [{movie:'https://evil.example/main.swf'},{movie:'https://res.17roco.qq.com/preloader.swf'},{ready:0}]) {
    const env=install(options);assert.equal(env.sent[0].ready,false);env.request();assert.equal(env.calls,0);assert.equal(env.sent.at(-1).kind,'reload-unavailable');
  }
});
test('pending reload is not duplicated and failures allow another request',async()=>{
  let reject;const env=install({reload:()=>new Promise((_,r)=>reject=r)});
  env.request();env.request();assert.equal(env.calls,1);
  reject(Error('SECRET'));await Promise.resolve();assert.equal(env.sent.at(-1).kind,'reload-failed');
  env.request();assert.equal(env.calls,2);assert(!JSON.stringify(env.sent).includes('SECRET'));
  env.disconnect();assert.equal(env.cleared,1);
});
