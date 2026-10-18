const {test}=require('node:test');
const assert=require('node:assert/strict');
const {install,endpoints}=require('../app/src/main/assets/compatibility/game-http.js');
function fixture({origin='https://web2.17roco.qq.com',home='https://17roco.qq.com/',reject=false}={}) {
  class GameRequest extends Request {} class HomeRequest extends Request {}
  class GameResponse extends Response {} class HomeResponse extends Response {}
  const forwarded=[],fallback=[];
  const top={location:{href:home},Request:HomeRequest,async fetch(request){
    assert.equal(this,top);assert(request instanceof HomeRequest);forwarded.push(request);
    if(reject)throw Error('private failure SECRET');
    const response=new HomeResponse('<data>original bytes</data>',{status:request.url.includes('forbidden')?403:200,headers:{'Content-Type':'text/xml'}});
    Object.defineProperty(response,'url',{value:request.url});return response;
  }};
  const win={location:{href:origin+'/game'},top,Request:GameRequest,Response:GameResponse,fetch(...args){fallback.push(args);return Promise.resolve('original');}};
  const original=win.fetch;install(win);
  return {win,top,original,forwarded,fallback,GameRequest,HomeRequest,GameResponse,HomeResponse};
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
  for(const endpoint of endpoints)assert.equal((await f.win.fetch('https://17roco.qq.com/cgi-bin/'+endpoint)).status,200);
  const response=await f.win.fetch('https://17roco.qq.com/cgi-bin/online_present?forbidden=1');
  assert.equal(response.status,403);assert.equal(response.ok,false);
  const broken=fixture({reject:true});await assert.rejects(broken.win.fetch('https://17roco.qq.com/cgi-bin/online_present'));
  assert.equal(broken.forwarded.length,1);assert.equal(broken.fallback.length,0);
  assert.equal(broken.win.__timeCasketHttpState.httpBridgeFailed,1);
});
test('authentication, compliance, unknown routes, methods, origins and malformed destinations retain native fetch',async()=>{
  const f=fixture();
  for(const url of ['https://17roco.qq.com/cgi-bin/login','https://17roco.qq.com/cgi-bin/chenmi_report',
    'https://17roco.qq.com/cgi-bin/privacy_agreement','https://17roco.qq.com/cgi-bin/unknown',
    'https://17roco.qq.com/fcgi-bin/online_present','http://17roco.qq.com/cgi-bin/online_present',
    'https://17roco.qq.com:8443/cgi-bin/online_present','https://u:p@17roco.qq.com/cgi-bin/online_present',
    'https://evil.example/cgi-bin/online_present','https://res.17roco.qq.com/activity/ui.swf']) {
    assert.equal(await f.win.fetch(url),'original');
  }
  assert.equal(await f.win.fetch('https://17roco.qq.com/cgi-bin/online_present',{method:'POST',body:'SECRET'}),'original');
  assert.equal(f.forwarded.length,0);assert.equal(f.win.__timeCasketHttpState.httpBridgeAttempt,0);
  for(const origin of ['https://17roco.qq.com','http://web2.17roco.qq.com','https://web2.17roco.qq.com:8443','https://u:p@web2.17roco.qq.com']) {
    const x=fixture({origin});assert.equal(x.win.fetch,x.original);
  }
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
