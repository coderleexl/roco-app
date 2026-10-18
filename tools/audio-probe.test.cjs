const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/probe/audio.js'),'utf8');
function install({cold=0,fail=false,silent=false,zero=false}={}) {
  const events=[],listeners={},elements={status:{},web:{},flash:{},movie:{appendChild(){}}};
  let checks=0,loads=0,removed=0;
  class Context {
    constructor(){this.state='running';this.currentTime=0;this.destination={};}
    addEventListener(){} resume(){this.state='running';return Promise.resolve();} close(){return Promise.resolve();}
    createBufferSource(){return {buffer:{numberOfChannels:1,getChannelData:()=>new Float32Array(zero?[0,0,0]:[0,.5,0])},start(){}};}
  }
  let window;
  const api={readyState:0,load(){loads++;if(fail)return Promise.reject(new TypeError('SECRET ticket=SECRET'));
    this.readyState=2;if(!silent)new window.AudioContext().createBufferSource().start();return Promise.resolve();}};
  const player={ruffle:()=>api,remove(){removed++;}};
  window={AudioContext:Context,navigator:{userActivation:{hasBeenActive:true}},location:{href:'http://127.0.0.1:12345/audio.html'},
    addEventListener:(n,f)=>listeners[n]=f,RufflePlayer:{newest(){return checks++<cold?null:{createPlayer:()=>player};}}};
  const document={getElementById:id=>elements[id],title:''};
  vm.runInNewContext(source,{window,document,Set,Proxy,Reflect,Promise,URL,Error,fetch(url){events.push(url);return Promise.resolve();},setTimeout(fn){fn();}});
  return {elements,events,document,listeners,get loads(){return loads;},get removed(){return removed;}};
}
test('cold Ruffle startup is awaited and PCM source start is required',async()=>{
  const env=install({cold:3});await env.elements.flash.onclick();
  assert.equal(env.loads,1);assert.equal(env.document.title,'ROCO:audio-flash-started');
  assert(env.events.some(e=>e.includes('event=audio-buffer-started')));
});
test('metadata alone never reports audio start; timeout remains retryable',async()=>{
  const env=install({silent:true});await env.elements.flash.onclick();
  assert(env.events.some(e=>e.includes('event=audio-flash-timeout')));
  assert.notEqual(env.document.title,'ROCO:audio-flash-started');assert.equal(env.removed,1);
  await env.elements.flash.onclick();assert.equal(env.loads,2);
});
test('silent mixer buffers cannot be mistaken for the test tone',async()=>{
  const env=install({zero:true});await env.elements.flash.onclick();
  assert(env.events.some(e=>e.includes('event=audio-buffer-started')));
  assert(!env.events.some(e=>e.includes('event=audio-buffer-nonzero')));
  assert(env.events.some(e=>e.includes('event=audio-flash-timeout')));
});
test('failed loads export only fixed stage/error codes, not exception text',async()=>{
  const env=install({fail:true});await env.elements.flash.onclick();
  assert(env.events.some(e=>e.includes('event=audio-flash-failed&value=3')));
  assert(!JSON.stringify(env.events).includes('SECRET'));
  for(const url of env.events)assert.match(url,/^\/audio-event\?event=audio-[a-z-]+&value=\d{1,4}$/);
});
