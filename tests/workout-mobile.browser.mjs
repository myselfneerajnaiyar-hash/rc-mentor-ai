import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import dotenv from 'dotenv';
const out='exports/workout-mobile';
await mkdir(out,{recursive:true});
const env=dotenv.parse(await readFile('.env.local'));
const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const base=process.env.MOBILE_TEST_URL || 'http://localhost:3116';
const browser=await chromium.launch({executablePath:'C:/Users/NERAJ/.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe',headless:true});
const user={id:'11111111-1111-4111-8111-111111111111',email:'audit@example.test'};
const session={access_token:'local-audit-only',refresh_token:'local-audit-only',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,user};
const profile={user_id:user.id,name:'New Student',exam:'CAT',streak_count:0,daily_rc_streak:0,is_premium:true,birbal_credits:30,birbal_credit_month:'2026-9'};
const branding={brandName:'Auctor',logoUrl:'/logo.png',faviconUrl:'/icon-192.png',primaryColor:'#4f46e5',secondaryColor:'#0ea5e9',isInstitute:false};
const context={user,profile,tenant:{kind:'b2c'},branding,exam:'CAT',capabilities:{exam:'CAT',isCAT:true,showDailyRC:true,showCATSectionals:true},entitlement:{hasAccess:true,isPremium:true,isInstituteStudent:false},access:'allowed'};
const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
await ctx.addInitScript(({ref,session})=>localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session)),{ref,session});
const calls=[],errors=[],results=[];
let workoutFail=false, speedFail=true, saveFail=true, rcFail=false, complete=false;
const challenge={id:'audit-rc',title:'Daily Reading Challenge',timer_minutes:8,source_year:'CAT 2023',difficulty:'Moderate',passage:'Reading requires distinguishing evidence from assumptions. '.repeat(70),questions:[1,2,3,4].map(i=>({id:i,question:`What does the passage suggest? (${i})`,options:['Evidence matters','All claims are true','Reading is unnecessary','Assumptions prove claims'],answer:'A',explanation:'Evidence supports conclusions.'}))};
await ctx.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/rest/')||u.pathname.startsWith('/auth/'))calls.push({path:u.pathname,method:req.method()});
 if(u.pathname==='/api/product-tour')return json({completed:true});
 if(u.pathname==='/api/daily-status')return json({activities:[...(context.capabilities.showDailyRC?[{id:'daily_rc',name:'Daily RC Challenge',description:'One passage. Build your reading accuracy.',time:'8 min',available:true,completed:false,href:'/daily-challenge/instructions'}]:[]),{id:'workout',name:'Daily Workout',description:'Reading, vocabulary and speed in one guided session.',time:'25-30 min',available:true,completed:complete,href:'/?view=workout'},{id:'hangman',name:'Word Hunt',description:'A quick daily vocabulary puzzle.',time:'5 min',available:true,completed:false,href:'/?view=hangman'}],recent:null});
 if(u.pathname==='/api/tenant-context')return json({tenant:context.tenant,branding});
 if(u.pathname==='/api/session-context')return json(context);
 if(u.pathname==='/auth/v1/user')return json(user);
 if(u.pathname==='/auth/v1/token')return json(session);
 if(u.pathname.startsWith('/rest/v1/')){const table=u.pathname.split('/').at(-1);const single=req.headers().accept?.includes('object');if(table==='daily_hangman')return json(single?{id:'puzzle',max_lives:10,words:[{answer:'READ',hint:'Use text'}],passage:'Read carefully. Evidence matters.',level:'easy'}:[]);if(table==='daily_rc_attempts'&&req.method()==='POST')return saveFail?json({message:'Save unavailable'},503):json({id:'saved-rc'});if(table==='daily_rc_sets')return rcFail?json({message:'Unavailable'},503):json(challenge);if(table==='daily_rc_questions')return json(challenge.questions.map(q=>({...q,question_text:q.question,option_a:q.options[0],option_b:q.options[1],option_c:q.options[2],option_d:q.options[3],correct_answer:1})));return json(table==='profiles'?(single?profile:[profile]):(single?null:[]));}
 if(u.pathname==='/api/birbal-context')return json({analytics:{overallAccuracy:0,averageWPM:0,readingIQ:0,readerType:'New reader',skills:[],strongestSkill:'Not enough data',weakestSkill:'Not enough data'},recommendations:[]});
 if(u.pathname==='/api/birbal-coach')return json({coach:null});
 if(u.pathname==='/api/hangman-streak')return json({streak:0,isActiveToday:false});
 if(u.pathname==='/api/speed-generate')return speedFail?json({error:'Unavailable'},503):json({paragraphs:['Evidence helps readers think clearly.'],questions:[{question:'What helps?',options:['Evidence','Guessing'],correct:0}]});if(u.pathname==='/api/check-attempt')return json({attempted:complete,attempt:complete?{user_responses:{},total_score:4}:null});if(u.pathname==='/api/get-daily-workout'){if(workoutFail)return json({error:'Unavailable'},503);return json(Object.fromEntries(['speed','vocab','rc1','rc2','micro'].map(k=>[k,{passage:challenge.passage,questions:[{paragraph:'Evidence matters in reading.',question:'What matters?',options:['Evidence','Guessing','Ignoring','Nothing'],correctIndex:0,skill:'inference'}]}])));}if(u.pathname==='/api/get-daily-rc')return json({challenge});
 if(u.pathname==='/api/bootcamp')return json({calendar:{period:'UPCOMING',todayDay:null},attempt:null});
 if(u.pathname.startsWith('/api/'))return json({items:[],messages:[],count:0});
 if(u.origin===base)return route.continue();
 return route.fulfill({status:200,contentType:'application/json',body:'{}',headers:{'access-control-allow-origin':'*'}});
});
const consoleErrors=[];const page=await ctx.newPage();page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});let acceptDialog=true;page.on('dialog',d=>acceptDialog?d.accept():d.dismiss());page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(120000);
async function snap(name){
 await page.waitForTimeout(500);
 const data=await page.evaluate(()=>({url:location.pathname+location.search,width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,scrollY,bodyScroll:document.body.scrollTop,bodyHeight:document.body.scrollHeight,scrollers:[...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+100&&['auto','scroll','hidden'].includes(getComputedStyle(e).overflowY)).map(e=>({tag:e.tagName,cls:e.className,top:e.scrollTop,h:e.clientHeight,total:e.scrollHeight})).slice(0,8),nav:[...document.querySelectorAll('nav')].filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).display!=='none').map(e=>e.innerText),headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>({text:e.innerText,y:Math.round(e.getBoundingClientRect().top+scrollY)})),controls:[...document.querySelectorAll('button,a,input,select,textarea')].filter(e=>e.getBoundingClientRect().height).map(e=>{let r=e.getBoundingClientRect();return {text:(e.innerText||e.getAttribute('aria-label')||e.getAttribute('placeholder')||'').slice(0,90),x:Math.round(r.x),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height)}}),text:document.body.innerText.slice(0,16000)}));
 results.push({name,...data});await page.screenshot({path:`${out}/${name}.png`,fullPage:false});await writeFile(`${out}/measurements.json`,JSON.stringify({results,errors,calls},null,2));console.log(name, data.scrollWidth,data.scrollHeight);
}
async function top(){await page.evaluate(()=>{document.body.scrollTop=0;document.documentElement.scrollTop=0;document.querySelectorAll('main').forEach(e=>e.scrollTop=0)});}
async function widths(name){for(const width of [320,360,375,390,414]){await page.setViewportSize({width,height:844});await top();await snap(name+'-'+width);}}

async function go(path){await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(900);}

try {
 for(const width of [320,375,390,768,899,900,1440]) {
  await page.setViewportSize({width,height:900});await go('/?view=workout');
  const cards=page.locator('.workout-activity-card');await cards.first().waitFor();assert.equal(await cards.count(),4);
  for(const title of ['Speed Drill','Vocabulary Lab','Reading Comprehension','Micro Skills'])assert.ok(await cards.filter({hasText:title}).isVisible());
  assert.equal(await page.locator('.workout-overview').isVisible(),width>=900);
  assert.equal(await page.locator('.workout-mobile-subtitle').isVisible(),width<900);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const strip=page.locator('.workout-tabs');const tabs=strip.getByRole('tab');assert.equal(await tabs.count(),4);
  const boxes=await tabs.evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));assert.ok(boxes.every(y=>Math.abs(y-boxes[0])<2));
  await snap('start-'+width);
  if(await strip.evaluate(e=>e.scrollWidth>e.clientWidth)){
   const box=await strip.boundingBox();const cdp=await ctx.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width-25,y:box.y+24}]});
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width-25-(box.width-50)*i/12,y:box.y+24}]});await page.waitForTimeout(25);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
   assert.ok(await strip.evaluate(e=>e.scrollLeft)>20,'Touch scroll moves tab strip');assert.equal(await tabs.first().getAttribute('aria-selected'),'true','Swipe does not select content');await cdp.detach();
  }
  for(const name of ['Performance','History','Analytics','Start']){
   const tab=strip.getByRole('tab',{name,exact:true});await tab.click();await page.waitForTimeout(500);
   assert.equal(await tab.getAttribute('aria-selected'),'true');assert.equal(await page.getByRole('tabpanel').getAttribute('aria-labelledby'),await tab.getAttribute('id'));
   const a=await tab.boundingBox(),b=await strip.boundingBox();assert.ok(a.x>=b.x-1&&a.x+a.width<=b.x+b.width+1,'Selected tab visible');
  }
  const cta=page.getByRole('button',{name:/Start Workout/});await cta.scrollIntoViewIfNeeded();await snap('cards-cta-'+width);
  assert.ok(await page.evaluate(()=>{const c=document.querySelector('.workout-start'),a=document.querySelector('.workout-activities');return c.getBoundingClientRect().top>=a.getBoundingClientRect().bottom}));
  await cta.click();await page.locator('.workout-ready').waitFor({state:'detached'});if(width<900)await page.getByRole('button',{name:'Exit activity'}).waitFor();assert.equal(await strip.count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.setViewportSize({width:375,height:844});await go('/?view=workout&tab=performance');
 const selected=page.getByRole('tab',{name:'Performance',exact:true});assert.equal(await selected.getAttribute('aria-selected'),'true');
 await selected.focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(500);assert.equal(await page.getByRole('tab',{name:'History',exact:true}).getAttribute('aria-selected'),'true');
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);console.log('PASS: 375, 390, 1440; touch swipe, four sections, cards, CTA, URL tab, keyboard, overflow, page errors');
} finally {await browser.close();}

