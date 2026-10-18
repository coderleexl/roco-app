const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/compatibility/game-control.js'),'utf8');
function install({origin='https://web2.17roco.qq.com',movie='https://res.17roco.qq.com/main.swf',reload=()=>Promise.resolve(),ready=2,viewWorks=true,child=false,path='/'}={}) {
  const sent=[],events={};let receiver,disconnect,interval,cleared=0,closed=0,calls=0,connections=0;
  const config={url:movie};
  Object.defineProperty(config,'parameters',{get(){throw Error('must not read authentication');}});
  const api={readyState:ready,loadedConfig:config,reload(...args){assert.equal(args.length,0);calls++;return reload();}};
  const player={wrappedJSObject:{ruffle:()=>api}};
  const port={postMessage:m=>sent.push(m),onMessage:{addListener:f=>receiver=f},onDisconnect:{addListener:f=>disconnect=f},disconnect(){closed++;}};
  const window={location:{origin,pathname:path,reload(){throw Error('document reload forbidden');}},setInterval(f){interval=f;return 7;},clearInterval(id){assert.equal(id,7);cleared++;},addEventListener:(type,f)=>events[type]=f};
  window.top=child?{}:window;
  const document={baseURI:origin+'/',querySelectorAll:()=>[player]};
  const browser={runtime:{connectNative(name){assert.equal(name,'time_casket_game_control');connections++;return port;}}};
  let viewCalls=0,exits=0;
  const createTimeCasketGameView=()=>({enterGame:()=>{viewCalls++;return viewWorks&&(origin==='https://17roco.qq.com'||api.readyState===2);},exit:()=>exits++});
  vm.runInNewContext(source,{window,document,browser,URL,Promise,createTimeCasketGameView});
  return {window,sent,api,request:(message={kind:'reload'})=>receiver(message),events,tick:()=>interval(),disconnect:()=>disconnect(),get calls(){return calls;},get connections(){return connections;},get cleared(){return cleared;},get closed(){return closed;},get viewCalls(){return viewCalls;},get exits(){return exits;}};
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

test('standalone game view waits for the main movie and restores presentation without reloading',()=>{
  const env=install({ready:0});env.request({kind:'game-view',enabled:true});assert.equal(env.viewCalls,1);
  env.api.readyState=2;env.tick();assert.equal(env.viewCalls,2);
  assert(env.sent.some(m=>m.kind==='game-view-state'&&m.enabled===true));
  env.request({kind:'game-view',enabled:false});assert.equal(env.sent.at(-1).enabled,false);
  assert.equal(env.calls,0);assert(env.exits>0);
  assert(!JSON.stringify(env.sent).includes('parameters'));
});

test('homepage presents the game/login window before main is ready and cannot reload its preloader',()=>{
  const env=install({origin:'https://17roco.qq.com',movie:'https://res.17roco.qq.com/preloader.swf'});
  assert.equal(env.sent[0].ready,false);
  env.request({kind:'game-view',enabled:true});
  assert(env.sent.some(m=>m.kind==='game-view-state'&&m.enabled===true));
  env.request();assert.equal(env.calls,0);assert.equal(env.sent.at(-1).kind,'reload-unavailable');
  env.request({kind:'game-view',enabled:false});assert(env.exits>0);
});

test('child game scripts retain reload capability but never compete with the top presentation owner',async()=>{
  const env=install({child:true});env.request({kind:'game-view',enabled:true});assert.equal(env.viewCalls,0);
  env.request();await Promise.resolve();assert.equal(env.calls,1);
  assert.equal(install({origin:'https://17roco.qq.com',child:true}).connections,0);
  assert.equal(install({origin:'https://17roco.qq.com',path:'/other'}).connections,0);
});

test('invalid presentation commands and failed page presentation never report fullscreen',()=>{
  const env=install({viewWorks:false});env.request({kind:'game-view',enabled:'SECRET'});assert.equal(env.viewCalls,0);
  env.request({kind:'game-view',enabled:true});assert.equal(env.viewCalls,1);
  assert(!env.sent.some(m=>m.kind==='game-view-state'&&m.enabled===true));
  assert.equal(env.sent.at(-1).kind,'game-view-failed');
  const before=env.sent.length;env.tick();assert.equal(env.sent.length,before);
  env.events.pagehide();assert(env.exits>0);assert.equal(env.calls,0);
});
