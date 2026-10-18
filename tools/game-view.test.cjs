const {test}=require('node:test');
const assert=require('node:assert/strict');
const create=require('../app/src/main/assets/compatibility/game-view.js');
function fixture(topUrl='https://17roco.qq.com/') {
  function document() {
    const doc={styles:[],createElement(){return {remove(){doc.styles.splice(doc.styles.indexOf(this),1);}};}};
    function node(parent=null) {
      const attrs=new Map();return {ownerDocument:doc,parentElement:parent,
        getAttribute:n=>attrs.has(n)?attrs.get(n):null,setAttribute:(n,v)=>attrs.set(n,v),removeAttribute:n=>attrs.delete(n),
        style:{values:{},setProperty(n,v,p){assert.equal(p,'important');this.values[n]=v;}}};
    }
    doc.documentElement=node();doc.body=node(doc.documentElement);doc.head={appendChild:s=>doc.styles.push(s)};doc.node=node;return doc;
  }
  const topDoc=document(),gameDoc=document();
  const events={};const top={location:{href:topUrl},document:topDoc,innerWidth:1920,innerHeight:1120,
    addEventListener:(n,f)=>events[n]=f,removeEventListener:n=>delete events[n]};top.top=top;
  const frame=topDoc.node(topDoc.node(topDoc.body));frame.setAttribute('style','original-frame-style');
  Object.defineProperty(frame,'src',{get(){throw Error('must not read authentication URLs');}});
  const win={location:{href:'https://web2.17roco.qq.com/game'},document:gameDoc,top,parent:top,frameElement:frame};
  const player=gameDoc.node(gameDoc.body);player.ruffle=()=>({metadata:{width:960,height:560}});
  return {topDoc,gameDoc,top,win,frame,player,events};
}

function homepageFixture() {
  const f=fixture();f.frame.tagName='IFRAME';f.frame.contentWindow=f.win;
  f.topDoc.getElementById=id=>id==='mainiframe'?f.frame:null;
  f.topDoc.baseURI='https://17roco.qq.com/';f.gameDoc.baseURI='https://web2.17roco.qq.com/';
  f.gameDoc.querySelectorAll=()=>[];
  return f;
}

test('homepage immediately isolates the game frame during cross-origin login without reading its URL',()=>{
  const f=homepageFixture();
  f.frame.contentWindow={get location(){throw Error('cross-origin login');}};
  f.topDoc.querySelectorAll=()=>{throw Error('must not choose hidden homepage preloader');};
  const view=create(f.top);assert.equal(view.enterGame(),true);
  assert.equal(f.frame.style.values.transform,'scale(2)');
  assert.equal(f.topDoc.styles.length,1);assert.equal(f.gameDoc.styles.length,0);
  view.exit();assert.equal(f.frame.getAttribute('style'),'original-frame-style');
});

test('presentation switches from the login frame to ready main and back during reload, then restores',()=>{
  const f=homepageFixture(),view=create(f.top);assert.equal(view.enterGame(),true);
  let ready=0;
  f.player.ruffle=()=>({readyState:ready,metadata:{width:960,height:560},loadedConfig:{url:'https://res.17roco.qq.com/main.swf'}});
  f.gameDoc.querySelectorAll=selector=>selector==='iframe'?[]:[f.player];
  assert.equal(view.enterGame(),true);assert.equal(f.gameDoc.styles.length,0);
  ready=2;assert.equal(view.enterGame(),true);assert.equal(f.gameDoc.styles.length,1);
  assert.equal(f.topDoc.styles.length,1);
  ready=0;assert.equal(view.enterGame(),true);assert.equal(f.gameDoc.styles.length,0);
  view.exit();assert.equal(f.topDoc.styles.length,0);
  assert.equal(f.frame.getAttribute('style'),'original-frame-style');
});

test('missing game container and non-top presenters cannot activate a homepage crop',()=>{
  const f=homepageFixture();f.topDoc.getElementById=()=>null;
  assert.equal(create(f.top).enterGame(),false);assert.equal(f.topDoc.styles.length,0);
  assert.equal(create(f.win).enterGame(),false);assert.equal(f.gameDoc.styles.length,0);
});

test('an inaccessible movie ancestor falls back to the existing outer game surface',()=>{
  const f=homepageFixture();
  f.player.ruffle=()=>({readyState:2,loadedConfig:{url:'https://res.17roco.qq.com/main.swf'}});
  f.gameDoc.querySelectorAll=selector=>selector==='iframe'?[]:[f.player];
  Object.defineProperty(f.win,'frameElement',{get(){throw Error('inaccessible');}});
  const view=create(f.top);assert.equal(view.enterGame(),true);
  assert.equal(f.topDoc.styles.length,1);assert.equal(f.gameDoc.styles.length,0);
  view.exit();assert.equal(f.topDoc.styles.length,0);
});
test('only game chain is shown, proportionally fitted and fully restored without navigation',()=>{
  const f=fixture(),view=create(f.win);assert.equal(view.enter(f.player),true);
  assert.equal(f.frame.style.values.transform,'scale(2)');
  assert.equal(f.topDoc.styles.length,1);assert.equal(f.gameDoc.styles.length,1);
  assert(f.topDoc.styles[0].textContent.includes('visibility:hidden'));
  f.top.innerWidth=1200;f.top.innerHeight=560;f.events.resize();
  assert.equal(f.frame.style.values.transform,'scale(1)');assert.equal(f.frame.style.values.left,'120px');
  view.exit();assert.equal(f.frame.getAttribute('style'),'original-frame-style');
  assert.equal(f.frame.getAttribute('data-time-casket-target'),null);assert.equal(f.topDoc.styles.length,0);
  assert.equal(f.gameDoc.documentElement.getAttribute('data-time-casket-view'),null);assert.equal(f.events.resize,undefined);
});
test('same player is idempotent and a replacement player receives a clean presentation',()=>{
  const f=fixture(),view=create(f.win);view.enter(f.player);view.enter(f.player);assert.equal(f.topDoc.styles.length,1);
  const replacement=f.gameDoc.node(f.gameDoc.body);replacement.ruffle=f.player.ruffle;
  assert.equal(view.enter(replacement),true);assert.equal(f.player.getAttribute('data-time-casket-target'),null);
  assert.equal(f.topDoc.styles.length,1);view.exit();view.exit();assert.equal(f.topDoc.styles.length,0);
});
test('untrusted or inaccessible ancestors are rejected before any document changes',()=>{
  for(const url of ['https://graph.qq.com/','http://17roco.qq.com/','https://u:p@17roco.qq.com/','https://17roco.qq.com:8443/']) {
    const f=fixture(url);assert.equal(create(f.win).enter(f.player),false);assert.equal(f.gameDoc.styles.length,0);
  }
  const f=fixture();Object.defineProperty(f.win,'frameElement',{get(){throw Error('inaccessible');}});
  assert.equal(create(f.win).enter(f.player),false);assert.equal(f.topDoc.styles.length,0);
});
test('a partial failure restores prior attributes and does not leave the page hidden',()=>{
  const f=fixture();f.topDoc.createElement=()=>{throw Error('unavailable');};
  assert.equal(create(f.win).enter(f.player),false);assert.equal(f.gameDoc.styles.length,0);
  assert.equal(f.gameDoc.documentElement.getAttribute('data-time-casket-view'),null);
  assert.equal(f.frame.getAttribute('data-time-casket-target'),null);
});
