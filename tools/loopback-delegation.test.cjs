const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/compatibility/loopback-delegation.js'),'utf8');
function frame(value='') {return {nodeType:1,value,matches:s=>s==='iframe',querySelectorAll:()=>[],getAttribute(){return this.value;},setAttribute(key,value){assert.equal(key,'allow');this.value=value;}};}
function install(url,frames=[]) {
  let mutation,disconnected=false;
  const events={};
  class Observer {constructor(fn){mutation=fn;}observe(){}disconnect(){disconnected=true;}}
  const window={location:{href:url},addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(source,{window,document:{querySelectorAll:()=>frames},MutationObserver:Observer,URL});
  return {events,added:node=>mutation([{addedNodes:[node]}]),get active(){return !!mutation;},get disconnected(){return disconnected;}};
}
test('delegation preserves unrelated allow directives and limits recipients to official origins',()=>{
  const f=frame('fullscreen');const env=install('https://17roco.qq.com/iframe.html',[f]);
  assert.equal(f.value,'fullscreen; loopback-network https://17roco.qq.com https://web2.17roco.qq.com');
  assert(!f.value.includes('*'));assert(!f.value.includes('local-network'));assert(!f.value.includes('graph.qq.com'));
  env.events.pagehide();assert.equal(env.disconnected,true);
});
test('dynamic iframe insertion is covered without changing URLs or explicit loopback policy',()=>{
  const denied=frame("loopback-network 'none'; fullscreen"),env=install('https://17roco.qq.com/',[denied]);
  assert.equal(denied.value,"loopback-network 'none'; fullscreen");
  const later=frame();env.added(later);assert.match(later.value,/^loopback-network /);
  const before=later.value;env.added(later);assert.equal(later.value,before);
});
test('other origins, HTTP, credentials and ports receive no delegation',()=>{
  for(const url of ['https://web2.17roco.qq.com/','https://graph.qq.com/','http://17roco.qq.com/','https://17roco.qq.com:8443/','https://u:p@17roco.qq.com/']) {
    const f=frame();assert.equal(install(url,[f]).active,false);assert.equal(f.value,'');
  }
});
