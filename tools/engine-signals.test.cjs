const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function install(url) {
  const calls=[];
  const window={location:{href:url},console:Object.fromEntries(['log','warn','error'].map(level=>[level,(...args)=>calls.push([level,...args])]))};
  const source=fs.readFileSync(require.resolve('../app/src/main/assets/compatibility/engine-signals.js'),'utf8');
  vm.runInNewContext(source,{window,URL});
  return {window,calls};
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
test('non-game origins are untouched and script declaration covers the signal collector',()=>{
  for(const url of ['https://17roco.qq.com/','https://evil.example/','http://web2.17roco.qq.com/','https://web2.17roco.qq.com:8443/','https://user:pass@web2.17roco.qq.com/']) {
    const {window}=install(url);
    assert.equal(window.__timeCasketEngineSignals,undefined,url);
  }
  const manifest=require('../app/src/main/assets/compatibility/manifest.json');
  assert(manifest.content_scripts.some(script=>script.world==='MAIN'&&script.js.includes('engine-signals.js')));
});
