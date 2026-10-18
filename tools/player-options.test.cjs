const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const scriptPath='../app/src/main/assets/compatibility/player-options.js';
function run(url,existing) {
  const window={location:{href:url}};
  if(existing) window.RufflePlayer=existing;
  vm.runInNewContext(fs.readFileSync(require.resolve(scriptPath),'utf8'),{window,URL});
  return window;
}
test('official game documents request autoplay without changing other player options',()=>{
  for(const url of ['https://17roco.qq.com/','https://17roco.qq.com/default.html?v=1','https://web2.17roco.qq.com/official-game']) {
    const existing={config:{preferredRenderer:'webgl',allowScriptAccess:true,unmuteOverlay:'visible'},other:'keep'};
    const window=run(url,existing);
    assert.equal(window.RufflePlayer,existing);
    assert.equal(window.RufflePlayer.config.autoplay,'on');
    assert.equal(window.RufflePlayer.config.preferredRenderer,'webgl');
    assert.equal(window.RufflePlayer.config.allowScriptAccess,true);
    assert.equal(window.RufflePlayer.config.unmuteOverlay,'visible');
    assert.equal(window.RufflePlayer.other,'keep');
  }
  assert.equal(run('https://17roco.qq.com/').RufflePlayer.config.autoplay,'on');
});
test('unrelated pages, hosts, schemes, ports and userinfo remain untouched',()=>{
  for(const url of ['https://17roco.qq.com/unrelated.html','https://evil.example/','https://web2.17roco.qq.com.evil.example/','http://17roco.qq.com/','https://17roco.qq.com:8443/','https://web2.17roco.qq.com:8443/','https://user:pass@17roco.qq.com/','about:blank']) {
    assert.equal(run(url).RufflePlayer,undefined,url);
  }
});
test('manifest injects player preferences in main world before loading, only official HTTPS hosts',()=>{
  const manifest=require('../app/src/main/assets/compatibility/manifest.json');
  const scripts=manifest.content_scripts.filter(s=>s.js.includes('player-options.js'));
  assert.equal(scripts.length,1);
  assert.equal(scripts[0].world,'MAIN');
  assert.equal(scripts[0].run_at,'document_start');
  assert.equal(scripts[0].all_frames,true);
  assert.deepEqual(scripts[0].matches,['https://17roco.qq.com/*','https://web2.17roco.qq.com/*']);
});
