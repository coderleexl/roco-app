const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const scriptPath='../app/src/main/assets/compatibility/player-options.js';
function run(url,existing,OffscreenCanvas) {
  const window={location:{href:url},OffscreenCanvas};
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

test('game device text uses available system CJK fonts, preserving explicit choices and fallback',()=>{
  class Canvas {getContext(kind){assert.equal(kind,'2d');return {};}}
  assert.equal(run('https://web2.17roco.qq.com/game',null,Canvas).RufflePlayer.config.deviceFontRenderer,'canvas');
  assert.equal(run('https://17roco.qq.com/',null,Canvas).RufflePlayer.config.deviceFontRenderer,undefined);
  assert.equal(run('https://web2.17roco.qq.com/game').RufflePlayer.config.deviceFontRenderer,undefined);
  class Unsupported {getContext(){throw Error('unavailable');}}
  assert.equal(run('https://web2.17roco.qq.com/game',null,Unsupported).RufflePlayer.config.autoplay,'on');
  class Missing {getContext(){return null;}}
  assert.equal(run('https://web2.17roco.qq.com/game',null,Missing).RufflePlayer.config.deviceFontRenderer,undefined);
  const existing={config:{deviceFontRenderer:'embedded',preferredRenderer:'webgl'}};
  assert.equal(run('https://web2.17roco.qq.com/game',existing,Canvas).RufflePlayer.config.deviceFontRenderer,'embedded');
});

test('scoped pages trial the simpler GPU backend while explicit renderer and quality choices remain intact',()=>{
  for(const url of ['https://17roco.qq.com/','https://17roco.qq.com/default.html','https://web2.17roco.qq.com/game']) {
    assert.equal(run(url).RufflePlayer.config.preferredRenderer,'webgl');
    assert.equal(run(url,{config:{preferredRenderer:null}}).RufflePlayer.config.preferredRenderer,'webgl');
    const explicit={config:{preferredRenderer:'wgpu-webgl',quality:'high'}};
    const config=run(url,explicit).RufflePlayer.config;
    assert.equal(config.preferredRenderer,'wgpu-webgl');assert.equal(config.quality,'high');
  }
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
