import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { readFile, mkdir } from 'node:fs/promises';
import dotenv from 'dotenv';
const out='.tmp-practice-arena';
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
await ctx.addInitScript(({ref,session})=>localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session)),{ref,session});
const calls=[],errors=[];
const sectionalFixtures=[{id:'free-pyq',test_type:'pyq',exam:'CAT',exam_year:2024,exam_slot:1,is_free:true},{id:'locked-pyq',test_type:'pyq',exam:'CAT',exam_year:2023,exam_slot:2,is_free:false},{id:'review-pyq',test_type:'pyq',exam:'CAT Reading Comprehension and Verbal Ability Extended Title',exam_year:2022,exam_slot:3,is_free:false},{id:'free-mock',test_type:'mock',test_number:1,is_free:true}];
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
 if(u.pathname==='/rest/v1/sectional_test_content')return json(sectionalFixtures);
 if(u.pathname==='/rest/v1/mentor_test_attempts')return json([{id:'review-attempt',test_id:'review-pyq'}]);
 if(u.pathname==='/rest/v1/subscriptions')return json(null);
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
async function go(path){await page.goto(base+path,{waitUntil:'domcontentloaded'});}
async function fits(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');}
try {
 for(const width of [360,390,430,768,1024,1440]) {
  await page.setViewportSize({width,height:844});await go('/?view=practice');
  await page.getByRole('button',{name:/Daily RC Challenge/}).waitFor();
  assert.equal(await page.locator('.practice-row').count(),3);
  for(const [label,count] of [['Reading',3],['Verbal & Speed',2],['Testing',1],['Your Tools',3],['Daily Practice',3]]) {
   await page.getByRole('tab',{name:label,exact:true}).click();
   await page.waitForFunction(label=>[...document.querySelectorAll('[role=tab]')].some(e=>e.textContent===label&&e.getAttribute('aria-selected')==='true'),label);
   assert.equal(await page.locator('.practice-row').count(),count);
   assert.equal(await page.getByRole('tab',{name:label,exact:true}).getAttribute('aria-selected'),'true');await fits();
   assert.ok(await page.getByRole('tab',{name:label,exact:true}).evaluate(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right;}),'Selected tab is visible');
  }
  await page.screenshot({path:out+'/practice-'+width+'.png',fullPage:true});
  await go('/?view=cat');await page.getByRole('heading',{name:'CAT 2024 · Slot 1',exact:true}).waitFor();await fits();
  assert.equal(await page.locator('.sectional-card').count(),3);
  assert.equal(await page.locator('.sectional-badge').allTextContents().then(v=>v.join(',')),'Free,Premium,Attempted');
  const cards=page.locator('.sectional-card');for(let i=0;i<await cards.count();i++)assert.ok(await cards.nth(i).evaluate(card=>[...card.querySelectorAll('h3,button,.sectional-meta,.sectional-badge')].every(e=>{const a=e.getBoundingClientRect(),b=card.getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&e.scrollWidth<=e.clientWidth+1;})),'Card content fits');
  await page.screenshot({path:out+'/sectionals-'+width+'.png',fullPage:true});
  await page.getByRole('tab',{name:'Auctor Mocks',exact:true}).click();await page.getByRole('heading',{name:'Auctor Mock 1',exact:true}).waitFor();assert.equal(await page.locator('.sectional-card').count(),1);
  await page.getByRole('tab',{name:'Official CAT PYQs',exact:true}).click();
  if(width<900){let message='';page.once('dialog',d=>{message=d.message();});await page.getByRole('button',{name:'Start Test',exact:true}).click();assert.match(message,/only on desktop/);}
  console.log('PASS Practice and Sectionals '+width);
 }
 await page.setViewportSize({width:390,height:844});await go('/?view=practice&tab=reading');await page.getByRole('tab',{name:'Reading',exact:true}).waitFor();await page.reload();assert.equal(await page.getByRole('tab',{name:'Reading',exact:true}).getAttribute('aria-selected'),'true');
 await page.getByRole('tab',{name:'Reading',exact:true}).focus();await page.keyboard.press('ArrowRight');await page.getByRole('button',{name:/Vocabulary Lab/}).waitFor();
 for(const [tab,name,path] of [['daily','Daily RC Challenge','/daily-challenge'],['daily','Daily Workout','/?view=today&activity=workout'],['daily','Word Hunt','/?view=today&activity=hangman'],['reading','RC Practice & Generator','/?view=rc'],['testing','CAT Sectional Tests','/?view=cat']]){await go('/?view=practice&tab='+tab);await page.getByRole('button',{name:new RegExp(name)}).click();await page.waitForURL(url=>url.pathname+url.search===path);}
 context.entitlement.hasAccess=false;await go('/?view=practice&tab=verbal');await page.getByRole('button',{name:/Vocabulary Lab/}).click();await page.getByRole('dialog').waitFor();await page.getByRole('link',{name:'Try free daily practice'}).click();await page.waitForURL(/view=today/);
 await go('/?view=cat');await page.getByRole('button',{name:'Review Analysis',exact:true}).click();await page.waitForURL(/arena\/result\/review-attempt/);
 await page.setViewportSize({width:1440,height:900});await go('/?view=cat');await page.getByRole('button',{name:'Unlock Premium',exact:true}).click();await page.waitForURL(/pricing/);
 await go('/?view=cat');await page.getByRole('button',{name:'Start Test',exact:true}).click();await page.locator('.sectional-arena').waitFor({state:'detached'});
 assert.deepEqual(errors,[]);console.log('PASS keyboard, reload, access locks, review, desktop start and pricing actions');
} finally {await browser.close();}
