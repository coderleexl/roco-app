const {test}=require('node:test');
const assert=require('node:assert/strict');
const {install,endpoints}=require('../app/src/main/assets/compatibility/game-http.js');
function fixture({origin='https://web2.17roco.qq.com',home='https://17roco.qq.com/',reject=false,
  probeHeaders={},probeStatus=200,probeError=false,probeRedirected=false,probeGate}={}) {
  class GameRequest extends Request {} class HomeRequest extends Request {}
  class GameResponse extends Response {} class HomeResponse extends Response {}
  const forwarded=[],fallback=[],probed=[];
  const top={location:{href:home},Request:HomeRequest,async fetch(request){
    assert.equal(this,top);assert(request instanceof HomeRequest);
    if(request.method==='HEAD') {
      probed.push(request);
      if(probeGate)await probeGate;
      if(probeError)throw Error('private probe failure SECRET');
      const response=new HomeResponse(null,{status:probeStatus,headers:probeHeaders});
      Object.defineProperty(response,'redirected',{value:probeRedirected});return response;
    }
    forwarded.push(request);
    if(reject)throw Error('private failure SECRET');
    const response=new HomeResponse('<data>original bytes</data>',{status:request.url.includes('forbidden')?403:200,headers:{'Content-Type':'text/xml'}});
    Object.defineProperty(response,'url',{value:request.url});return response;
  }};
  const win={location:{href:origin+'/game'},top,Request:GameRequest,Response:GameResponse,fetch(...args){fallback.push(args);return Promise.resolve('original');}};
  const original=win.fetch;install(win);
  return {win,top,original,forwarded,fallback,probed,GameRequest,HomeRequest,GameResponse,HomeResponse};
}
test('verified activity Requests use home origin and return a game-realm streaming Response',async()=>{
  const f=fixture(),url='https://17roco.qq.com/cgi-bin/online_present?angel_key=SECRET';
  const abort=new AbortController();
  const request=new f.GameRequest(url,{credentials:'same-origin',headers:{'X-Fixture':'value'},signal:abort.signal});
  const response=await f.win.fetch(request);
  assert(response instanceof f.GameResponse);assert(!(response instanceof f.HomeResponse));
  assert.equal(response.url,url);assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'text/xml');
  assert.equal(await response.text(),'<data>original bytes</data>');
  const sent=f.forwarded[0];assert.equal(sent.url,url);assert.equal(sent.method,'GET');
  assert.equal(sent.mode,'same-origin');assert.equal(sent.redirect,'error');assert.equal(sent.credentials,'same-origin');
  assert.equal(sent.headers.get('X-Fixture'),'value');abort.abort();assert.equal(sent.signal.aborted,true);
  assert.equal(f.fallback.length,0);assert.equal(f.win.__timeCasketHttpState.httpBridgeComplete,1);
  assert(!JSON.stringify(f.win.__timeCasketHttpState).includes('SECRET'));
});
test('all verified endpoints share the rule, preserve HTTP failure and do not retry after sending',async()=>{
  const f=fixture();
  for(const name of ['discovery','mend_shape','dawn_hymn'])assert(endpoints.includes(name));
  for(const endpoint of endpoints)assert.equal((await f.win.fetch('https://17roco.qq.com/cgi-bin/'+endpoint)).status,200);
  const response=await f.win.fetch('https://17roco.qq.com/cgi-bin/online_present?forbidden=1');
  assert.equal(response.status,403);assert.equal(response.ok,false);
  const broken=fixture({reject:true});await assert.rejects(broken.win.fetch('https://17roco.qq.com/cgi-bin/online_present'));
  assert.equal(broken.forwarded.length,1);assert.equal(broken.fallback.length,0);
  assert.equal(broken.win.__timeCasketHttpState.httpBridgeFailed,1);
});

test('character backpack guide requests keep their command and credentials through the existing bridge',async()=>{
  const f=fixture();
  for(const cmd of [7,8]) {
    const url='https://17roco.qq.com/cgi-bin/flaunt_suit_rank?cmd='+cmd+'&angel_key=SECRET';
    const response=await f.win.fetch(new f.GameRequest(url,{credentials:'include'}));
    assert(response instanceof f.GameResponse);
    assert.equal(f.forwarded.at(-1).url,url);
    assert.equal(f.forwarded.at(-1).credentials,'include');
    assert.equal(await response.text(),'<data>original bytes</data>');
  }
  assert.equal(f.fallback.length,0);
  assert(!JSON.stringify(f.win.__timeCasketHttpState).includes('SECRET'));
  assert.equal(await f.win.fetch('https://17roco.qq.com/cgi-bin/flaunt_suit_rank',{method:'POST'}),'original');
  assert.equal(f.forwarded.length,2);
});
test('authentication, compliance, unknown routes, methods, origins and malformed destinations retain native fetch',async()=>{
  const f=fixture();
  for(const url of ['https://17roco.qq.com/cgi-bin/login','https://17roco.qq.com/cgi-bin/chenmi_report',
    'https://17roco.qq.com/cgi-bin/privacy_agreement','https://17roco.qq.com/cgi-bin/warehouse_security_code','https://17roco.qq.com/cgi-bin/unknown',
    'https://17roco.qq.com/fcgi-bin/online_present','http://17roco.qq.com/cgi-bin/online_present',
    'https://17roco.qq.com:8443/cgi-bin/online_present','https://u:p@17roco.qq.com/cgi-bin/online_present',
    'https://evil.example/cgi-bin/online_present','https://res.17roco.qq.com/activity/ui.swf']) {
    assert.equal(await f.win.fetch(url),'original');
  }
  assert.equal(await f.win.fetch('https://17roco.qq.com/cgi-bin/online_present',{method:'POST',body:'SECRET'}),'original');
  assert.equal(f.forwarded.length,0);assert.equal(f.win.__timeCasketHttpState.httpBridgeAttempt,0);
  assert.equal(f.probed.length,1); // Only /unknown is a discovery candidate.
  for(const origin of ['https://17roco.qq.com','http://web2.17roco.qq.com','https://web2.17roco.qq.com:8443','https://u:p@web2.17roco.qq.com']) {
    const x=fixture({origin});assert.equal(x.win.fetch,x.original);
  }
});

const gamePolicy={'Content-Type':'text/xml; charset=utf-8','Access-Control-Allow-Origin':'https://res.17roco.qq.com','Access-Control-Allow-Credentials':'true'};

test('new game CGI contracts are discovered anonymously and cached across commands without replaying the GET',async()=>{
  const f=fixture({probeHeaders:gamePolicy});
  for(const cmd of [1,2]) {
    const url='https://17roco.qq.com/cgi-bin/angel_info_tools?cmd='+cmd+'&angel_key=SECRET';
    const response=await f.win.fetch(new f.GameRequest(url,{credentials:'include',headers:{'X-Fixture':'SECRET'}}));
    assert(response instanceof f.GameResponse);
    assert.equal(await response.text(),'<data>original bytes</data>');
    assert.equal(f.forwarded.at(-1).url,url);
    assert.equal(f.forwarded.at(-1).credentials,'include');
    assert.equal(f.forwarded.at(-1).headers.get('X-Fixture'),'SECRET');
  }
  assert.equal(f.probed.length,1);assert.equal(f.forwarded.length,2);assert.equal(f.fallback.length,0);
  const probe=f.probed[0];
  assert.equal(probe.url,'https://17roco.qq.com/cgi-bin/angel_info_tools');
  assert.equal(probe.method,'HEAD');assert.equal(probe.credentials,'omit');assert.equal(probe.cache,'no-store');
  assert.equal(probe.referrer,'');assert.equal(probe.referrerPolicy,'no-referrer');
  assert.equal(probe.mode,'same-origin');assert.equal(probe.redirect,'error');assert.equal([...probe.headers].length,0);
  assert.equal(f.win.__timeCasketHttpState.httpBridgeProbeAccepted,1);
  assert(!JSON.stringify(f.win.__timeCasketHttpState).includes('SECRET'));
});

test('discovery never delegates an undeclared contract, HTTP error, redirect or failed probe',async()=>{
  for(const options of [
    {probeHeaders:{...gamePolicy,'Access-Control-Allow-Origin':'*'}},
    {probeHeaders:{...gamePolicy,'Access-Control-Allow-Credentials':'false'}},
    {probeHeaders:{...gamePolicy,'Content-Type':'text/html'}},
    {probeHeaders:gamePolicy,probeStatus:404},
    {probeHeaders:gamePolicy,probeRedirected:true},
    {probeError:true}
  ]) {
    const f=fixture(options);
    for(let i=0;i<2;i++)assert.equal(await f.win.fetch('https://17roco.qq.com/cgi-bin/new_game_activity?key=SECRET'),'original');
    assert.equal(f.probed.length,1);assert.equal(f.forwarded.length,0);assert.equal(f.fallback.length,2);
    assert.equal(f.win.__timeCasketHttpState.httpBridgeProbeRejected,options.probeError?0:1);
    assert.equal(f.win.__timeCasketHttpState.httpBridgeProbeFailed,options.probeError?1:0);
    assert(!JSON.stringify(f.win.__timeCasketHttpState).includes('SECRET'));
  }
});

test('concurrent commands share one public HEAD while each game GET is sent once',async()=>{
  let release;const gate=new Promise(resolve=>release=resolve);
  const f=fixture({probeHeaders:gamePolicy,probeGate:gate});
  const a=f.win.fetch('https://17roco.qq.com/cgi-bin/new_game_activity?cmd=1');
  const b=f.win.fetch('https://17roco.qq.com/cgi-bin/new_game_activity?cmd=2');
  assert.equal(f.probed.length,1);assert.equal(f.forwarded.length,0);release();
  await Promise.all([a,b]);assert.equal(f.forwarded.length,2);assert.equal(f.fallback.length,0);
});

test('a homepage navigation while discovery is pending cannot send the game GET through the new page',async()=>{
  let release;const gate=new Promise(resolve=>release=resolve);
  const f=fixture({probeHeaders:gamePolicy,probeGate:gate});
  const pending=f.win.fetch('https://17roco.qq.com/cgi-bin/new_game_activity');
  f.top.location.href='https://17roco.qq.com/login.html';release();
  assert.equal(await pending,'original');assert.equal(f.forwarded.length,0);
  assert.equal(f.win.__timeCasketHttpState.httpBridgeUnavailable,1);
});

test('sensitive and noncanonical CGI paths are never probed even if the server would opt in',async()=>{
  const f=fixture({probeHeaders:gamePolicy});
  for(const path of ['login','oauth','chenmi_report','privacy_agreement','warehouse_security_code','account_password',
    'payment','purchase_item','realname','user_identity','captcha','logout','session','flaunt_suit_rank/extra',
    'AngelInfoTools','%61ngel_info_tools','angel_info_tools.json']) {
    assert.equal(await f.win.fetch('https://17roco.qq.com/cgi-bin/'+path),'original',path);
  }
  assert.equal(f.probed.length,0);assert.equal(f.forwarded.length,0);
});

test('discovery has a fixed per-page budget and does not probe an already-aborted request',async()=>{
  const f=fixture({probeHeaders:gamePolicy});
  const controller=new AbortController();controller.abort();
  assert.equal(await f.win.fetch('https://17roco.qq.com/cgi-bin/angel_info_tools',{signal:controller.signal}),'original');
  assert.equal(f.probed.length,0);
  for(let i=0;i<129;i++)await f.win.fetch('https://17roco.qq.com/cgi-bin/activity_'+i);
  assert.equal(f.probed.length,128);assert.equal(f.forwarded.length,128);assert.equal(f.fallback.length,2);
  assert.equal(f.win.__timeCasketHttpState.httpBridgeProbeLimited,1);
  // Verified legacy paths still work after the discovery budget is exhausted.
  await f.win.fetch('https://17roco.qq.com/cgi-bin/online_present');assert.equal(f.forwarded.length,129);
});

test('discovered game HTTP failures remain failures and never retry on another transport',async()=>{
  const f=fixture({probeHeaders:gamePolicy});
  const response=await f.win.fetch('https://17roco.qq.com/cgi-bin/angel_info_tools?forbidden=1');
  assert.equal(response.status,403);assert.equal(response.ok,false);
  assert.equal(f.win.__timeCasketHttpState.httpBridgeHttpErrors,1);assert.equal(f.fallback.length,0);
  const broken=fixture({probeHeaders:gamePolicy,reject:true});
  await assert.rejects(broken.win.fetch('https://17roco.qq.com/cgi-bin/angel_info_tools'));
  assert.equal(broken.forwarded.length,1);assert.equal(broken.fallback.length,0);
});
test('inaccessible or untrusted home keeps native failure, and installation is idempotent',async()=>{
  for(const home of ['https://graph.qq.com/','https://17roco.qq.com/other','http://17roco.qq.com/','https://u:p@17roco.qq.com/']) {
    const f=fixture({home});assert.equal(await f.win.fetch('https://17roco.qq.com/cgi-bin/online_present'),'original');assert.equal(f.forwarded.length,0);
  }
  const f=fixture(),patched=f.win.fetch;install(f.win);assert.equal(f.win.fetch,patched);
  Object.defineProperty(f.win,'top',{get(){throw Error('not accessible SECRET');}});
  assert.equal(await f.win.fetch('https://17roco.qq.com/cgi-bin/online_present'),'original');
  assert.equal(f.win.__timeCasketHttpState.httpBridgeUnavailable,1);
  assert(!JSON.stringify(f.win.__timeCasketHttpState).includes('SECRET'));
});

test('foreign Requests are accepted by native brand while shadowed URLs cannot route authentication',async()=>{
  const f=fixture();
  const foreign=new f.HomeRequest('https://17roco.qq.com/cgi-bin/online_present');
  assert(!(foreign instanceof f.GameRequest));assert.equal((await f.win.fetch(foreign)).status,200);
  const disguised=new f.GameRequest('https://17roco.qq.com/cgi-bin/login');
  Object.defineProperty(disguised,'url',{value:'https://17roco.qq.com/cgi-bin/online_present'});
  assert.equal(await f.win.fetch(disguised),'original');assert.equal(f.forwarded.length,1);
});
