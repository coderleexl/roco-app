const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/compatibility/audio-unlock.js'),'utf8');
function install(url='https://web2.17roco.qq.com/game',active=false) {
  const events={}; let calls=0;
  class Context {
    constructor(){this.state='suspended';this.listeners={};}
    addEventListener(name,handler){this.listeners[name]=handler;}
    resume(){calls++;if(this.deny)return Promise.reject(new Error('SECRET'));this.state='running';this.listeners.statechange?.();return Promise.resolve();}
  }
  const window={location:{href:url},AudioContext:Context,navigator:{userActivation:{hasBeenActive:active}},
    addEventListener(type,handler){events[type]=handler;}};
  vm.runInNewContext(source,{window,URL,Proxy,Reflect,Promise,Set});
  return {window,events,get calls(){return calls;},Context};
}
test('audio contexts resume on repeated trusted gestures, never a synthetic click',async()=>{
  const env=install();
  const context=new env.window.AudioContext();
  await Promise.resolve();
  assert.equal(env.calls,0);
  env.events.click({isTrusted:false});
  assert.equal(env.calls,0);
  env.events.touchend({isTrusted:true});
  assert.equal(env.calls,1);
  assert.equal(context.state,'running');
  context.state='suspended';
  env.events.click({isTrusted:true});
  assert.equal(env.calls,2);
  assert.equal(env.window.__timeCasketAudioState.running,1);
  assert(context instanceof env.Context);
});
test('contexts created after activation resume; original APIs and unrelated origins preserved',async()=>{
  const env=install('https://17roco.qq.com/default.html',true);
  new env.window.AudioContext();
  await Promise.resolve();
  assert.equal(env.calls,1);
  for(const url of ['https://17roco.qq.com/other','https://evil.example','http://web2.17roco.qq.com','https://web2.17roco.qq.com:8443/','https://a:b@web2.17roco.qq.com']) {
    const e=install(url);
    assert.equal(e.window.AudioContext,e.Context);
    assert.equal(e.window.__timeCasketAudioState,undefined);
  }
});
test('diagnostics retain fixed counters only and context tracking is bounded',async()=>{
  const env=install();
  for(let i=0;i<24;i++)new env.window.AudioContext({anything:'SECRET'});
  await Promise.resolve();
  assert.equal(env.window.__timeCasketAudioState.created,16);
  assert.equal(env.window.__timeCasketAudioState.suspended,16);
  assert(!JSON.stringify(env.window.__timeCasketAudioState).includes('SECRET'));
});
test('a rejected resume remains retryable on the next real gesture without retaining its error',async()=>{
  const env=install();
  const context=new env.window.AudioContext();
  await Promise.resolve();
  context.deny=true;
  env.events.click({isTrusted:true});
  await Promise.resolve();
  assert.equal(env.window.__timeCasketAudioState.rejected,1);
  assert.equal(context.state,'suspended');
  context.deny=false;
  env.events.click({isTrusted:true});
  assert.equal(context.state,'running');
  assert(!JSON.stringify(env.window.__timeCasketAudioState).includes('SECRET'));
});
