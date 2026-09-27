import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { readFile, mkdir } from 'node:fs/promises';
import dotenv from 'dotenv';
const out='.tmp-tour-header';
await mkdir(out,{recursive:true});
const env=dotenv.parse(await readFile('.env.local'));
const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const base=process.env.MOBILE_TEST_URL || 'http://localhost:3112';
const browser=await chromium.launch({executablePath:'C:/Users/NERAJ/.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe',headless:true});
const user={id:'11111111-1111-4111-8111-111111111111',email:'audit@example.test'};
const session={access_token:'local-audit-only',refresh_token:'local-audit-only',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,user};
const profile={user_id:user.id,name:'New Student',exam:'CAT',streak_count:0,daily_rc_streak:0,is_premium:true,birbal_credits:30,birbal_credit_month:'2026-9'};
const branding={brandName:'Auctor',logoUrl:'/logo.png',faviconUrl:'/icon-192.png',primaryColor:'#4f46e5',secondaryColor:'#0ea5e9',isInstitute:false};
const context={user,profile,tenant:{kind:'b2c'},branding,exam:'CAT',capabilities:{exam:'CAT',isCAT:true,showDailyRC:true,showCATSectionals:true},entitlement:{hasAccess:true,isPremium:true,isInstituteStudent:false},access:'allowed'};
const ctx=await browser.newContext({viewport:{width:390,height:844}});
await ctx.addInitScript(({ref,session})=>!localStorage.getItem(`sb-${ref}-auth-token`)&&localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session)),{ref,session});
const calls=[],errors=[];let tourCompleted=false,saveTourFails=false,dailyDelay=0;let statusCalls=0,tourSaves=0,tourStatusCalls=0,statusUnavailable=false,holdDaily=false;
let workoutFail=false, speedFail=true, saveFail=true, rcFail=false, complete=false;
const challenge={id:'audit-rc',title:'Daily Reading Challenge',timer_minutes:8,source_year:'CAT 2023',difficulty:'Moderate',passage:'Reading requires distinguishing evidence from assumptions. '.repeat(70),questions:[1,2,3,4].map(i=>({id:i,question:`What does the passage suggest? (${i})`,options:['Evidence matters','All claims are true','Reading is unnecessary','Assumptions prove claims'],answer:'A',explanation:'Evidence supports conclusions.'}))};
await ctx.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/rest/')||u.pathname.startsWith('/auth/'))calls.push({path:u.pathname,method:req.method()});
 if(u.pathname==='/api/product-tour'){if(req.method()==='POST'){tourSaves++;if(saveTourFails)return json({error:'Unavailable'},503);tourCompleted=true;profile.birbal_onboarded=true;}else{tourStatusCalls++;if(statusUnavailable)return json({error:'Missing persistence'},503);}return json({completed:tourCompleted});}
 if(u.pathname==='/api/daily-status'){statusCalls++;while(holdDaily)await new Promise(resolve=>setTimeout(resolve,20));await new Promise(resolve=>setTimeout(resolve,dailyDelay));return json({activities:[...(context.capabilities.showDailyRC?[{id:'daily_rc',name:'Daily RC Challenge',description:'One passage. Build your reading accuracy.',time:'8 min',available:true,completed:false,href:'/daily-challenge/instructions'}]:[]),{id:'workout',name:'Daily Workout',description:'Reading, vocabulary and speed in one guided session.',time:'25-30 min',available:true,completed:complete,href:'/?view=workout'},{id:'hangman',name:'Word Hunt',description:'A quick daily vocabulary puzzle.',time:'5 min',available:true,completed:false,href:'/?view=hangman'}],recent:null});}
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
 if(u.pathname.startsWith('/api/'))return json({error:'Audit fixture: unavailable',items:[],messages:[],count:0},503);
 if(u.origin===base)return route.continue();
 return route.abort();
});
const page=await ctx.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});let acceptDialog=true;page.on('dialog',d=>acceptDialog?d.accept():d.dismiss());page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(120000);
await page.addInitScript(()=>{const append=Node.prototype.appendChild;Node.prototype.appendChild=function(child){if(window.__failTour&&child.classList?.contains('driver-popover')){window.__failTour=false;throw Error('Fixture: tour initialization failed');}return append.call(this,child);};});
async function go(path='/'){await page.goto(base+path,{waitUntil:'domcontentloaded'});}
let account=111111111111;
async function freshAccount(){user.id='11111111-1111-4111-8111-'+String(account++).padStart(12,'0');profile.user_id=user.id;profile.birbal_onboarded=false;profile.profile_completed=true;tourCompleted=false;if(page.url().startsWith(base))await page.evaluate(({ref,session})=>localStorage.setItem('sb-'+ref+'-auth-token',JSON.stringify(session)),{ref,session});}
async function finishTour(){const titles=[];let n=0;while(await page.locator('.driver-popover').count()){
 assert.equal(await page.locator('.driver-popover').count(),1);titles.push(await page.locator('.driver-popover-title').textContent());
 const target=page.locator('.driver-active-element:not(#driver-dummy-element)');if(await target.count())assert.ok(await target.first().evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.width>0;}));
 for(const button of await page.locator('.driver-popover button:visible').all())assert.ok(await button.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}),'Every tour control fits');
 await page.locator('.driver-popover-next-btn').click();await page.waitForTimeout(80);if(++n>15)throw Error('Tour did not finish');
}return titles;}
try {
 for(const width of [320,375,390,430,768,1024,1440]){
  await freshAccount();await page.setViewportSize({width,height:width===320?568:844});const before=statusCalls,saves=tourSaves;
  holdDaily=true;dailyDelay=0;await go();await page.locator('[data-daily-ready]').waitFor();
  assert.equal(await page.locator('.product-tour-button:visible').count(),1,'Permanent header button');
  assert.equal(await page.locator('[data-daily-ready][aria-busy=true]').count(),1,'Daily status is independent');holdDaily=false;
  await page.locator('.driver-popover').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:out+'/tour-'+width+'.png'});const titles=await finishTour();assert.ok(titles.includes('Precision Training'));await page.waitForTimeout(150);assert.equal(tourCompleted,true);assert.equal(tourSaves-saves,1);assert.equal(statusCalls-before,1);console.log('PASS header and first-time tour '+width);
 }
 dailyDelay=0;await go();await page.locator('[data-daily-ready=true]').waitFor();assert.equal(await page.locator('.driver-popover').count(),0);
 statusUnavailable=true;const checks=tourStatusCalls;await page.locator('.product-tour-button:visible').click();await page.locator('.driver-popover').waitFor();assert.equal(tourStatusCalls,checks,'Manual launch never fetches status');await page.getByRole('button',{name:'Skip Tour',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await freshAccount();await go();await page.locator('.driver-popover').waitFor();assert.equal(await page.locator('.tour-notice').count(),0,'Unavailable status does not disable tour');await page.getByRole('button',{name:'Skip Tour',exact:true}).click();assert.equal(tourCompleted,false);
 await page.getByRole('link',{name:'Today',exact:true}).click();await page.getByRole('link',{name:'Home',exact:true}).click();await page.locator('[data-daily-ready=true]').waitFor();await page.waitForTimeout(100);assert.equal(await page.locator('.driver-popover').count(),0,'No repeat across remount');
 await page.reload();await page.locator('[data-daily-ready=true]').waitFor();assert.equal(await page.locator('.driver-popover').count(),0,'Skip lasts for the tab session');
 await page.evaluate(()=>{window.__failTour=true;});await page.locator('.product-tour-button:visible').click();await page.getByRole('button',{name:'Retry Tour',exact:true}).waitFor();assert.equal(await page.locator('.product-tour-button:visible').count(),1);assert.equal(await page.locator('.driver-popover').count(),0);
 await page.getByRole('button',{name:'Retry Tour',exact:true}).click();await page.locator('.driver-popover').waitFor();await page.getByRole('button',{name:'Skip Tour',exact:true}).click();
 saveTourFails=true;await page.locator('.product-tour-button:visible').click();await page.locator('.driver-popover').waitFor();await finishTour();await page.locator('.tour-notice').waitFor();assert.equal(tourCompleted,false);assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('auctor:product-tour:'+id)).pending,user.id),true);
 saveTourFails=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await page.waitForFunction(id=>JSON.parse(localStorage.getItem('auctor:product-tour:'+id)).pending===false,user.id);assert.equal(tourCompleted,true);
 const firstId=user.id;await freshAccount();await go();await page.locator('.driver-popover').waitFor();assert.notEqual(user.id,firstId);assert.equal(tourCompleted,false,'Second account has its own state');await finishTour();
 await go('/?view=profile');await page.getByRole('link',{name:'Replay Product Tour'}).click();await page.locator('.driver-popover').waitFor();await finishTour();
 assert.deepEqual(errors,[]);console.log('PASS completed user, offline status, skip/remount, initialization retry, offline finish sync, account switch and Profile replay');
}finally{holdDaily=false;await browser.close();}
