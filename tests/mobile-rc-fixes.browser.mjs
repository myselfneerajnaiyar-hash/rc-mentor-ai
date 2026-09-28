import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import dotenv from 'dotenv';
const out='exports/mobile-ux-fixes';
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
const calls=[],errors=[],results=[];
let workoutFail=false, speedFail=true, saveFail=true, rcFail=false, complete=false;
const challenge={id:'audit-rc',title:'Daily Reading Challenge',timer_minutes:8,source_year:'CAT 2023',difficulty:'Moderate',passage:'Reading requires distinguishing evidence from assumptions. '.repeat(70),questions:[1,2,3,4].map(i=>({id:i,question:`What does the passage suggest? (${i})`,options:['Evidence matters','All claims are true','Reading is unnecessary','Assumptions prove claims'],answer:'A',explanation:'Evidence supports conclusions.'}))};
await ctx.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/rest/')||u.pathname.startsWith('/auth/'))calls.push({path:u.pathname,method:req.method(),body:req.postDataJSON?.()});
 if(u.pathname==='/api/product-tour')return json({completed:true});
 if(u.pathname==='/api/daily-status')return json({activities:[...(context.capabilities.showDailyRC?[{id:'daily_rc',name:'Daily RC Challenge',description:'One passage. Build your reading accuracy.',time:'8 min',available:true,completed:false,href:'/daily-challenge/instructions'}]:[]),{id:'workout',name:'Daily Workout',description:'Reading, vocabulary and speed in one guided session.',time:'25-30 min',available:true,completed:complete,href:'/?view=workout'},{id:'hangman',name:'Word Hunt',description:'A quick daily vocabulary puzzle.',time:'5 min',available:true,completed:false,href:'/?view=hangman'}],recent:null});
 if(u.pathname==='/api/tenant-context')return json({tenant:context.tenant,branding});
 if(u.pathname==='/api/session-context')return json(context);
 if(u.pathname==='/auth/v1/user')return json(user);
 if(u.pathname==='/auth/v1/token')return json(session);
 if(u.pathname.startsWith('/rest/v1/')){const table=u.pathname.split('/').at(-1);const single=req.headers().accept?.includes('object');if(table==='daily_hangman')return json(single?{id:'puzzle',max_lives:10,words:[{answer:'READ',hint:'Use text'}],passage:'Read carefully. Evidence matters.',level:'easy'}:[]);if(table==='daily_rc_attempts'&&req.method()==='POST'){await new Promise(resolve=>setTimeout(resolve,500));return saveFail?json({message:'Save unavailable'},503):json({id:'saved-rc'});}if(table==='daily_rc_sets')return rcFail?json({message:'Unavailable'},503):json(challenge);if(table==='daily_rc_questions')return json(challenge.questions.map(q=>({...q,question_text:q.question,option_a:q.options[0],option_b:q.options[1],option_c:q.options[2],option_d:q.options[3],correct_answer:1})));return json(table==='profiles'?(single?profile:[profile]):(single?null:[]));}
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
async function snap(name){
 await page.waitForTimeout(500);
 const data=await page.evaluate(()=>({url:location.pathname+location.search,width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,scrollY,bodyScroll:document.body.scrollTop,bodyHeight:document.body.scrollHeight,scrollers:[...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+100&&['auto','scroll','hidden'].includes(getComputedStyle(e).overflowY)).map(e=>({tag:e.tagName,cls:e.className,top:e.scrollTop,h:e.clientHeight,total:e.scrollHeight})).slice(0,8),nav:[...document.querySelectorAll('nav')].filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).display!=='none').map(e=>e.innerText),headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>({text:e.innerText,y:Math.round(e.getBoundingClientRect().top+scrollY)})),controls:[...document.querySelectorAll('button,a,input,select,textarea')].filter(e=>e.getBoundingClientRect().height).map(e=>{let r=e.getBoundingClientRect();return {text:(e.innerText||e.getAttribute('aria-label')||e.getAttribute('placeholder')||'').slice(0,90),x:Math.round(r.x),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height)}}),text:document.body.innerText.slice(0,16000)}));
 results.push({name,...data});await page.screenshot({path:`${out}/${name}.png`,fullPage:false});await writeFile(`${out}/measurements.json`,JSON.stringify({results,errors,calls},null,2));console.log(name, data.scrollWidth,data.scrollHeight);
}


async function go(path){await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(700);}
async function fits(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No page overflow '+page.url());}
async function visible(locator){await locator.waitFor({state:'visible'});}

try {
 for(const width of [375,390,1440]){
  await page.setViewportSize({width,height:900});
  await go('/');await visible(page.locator('.home-footer a'));
  const pricing=page.locator('.home-footer a');
  assert.equal(await pricing.textContent(),'Pricing');
  await pricing.scrollIntoViewIfNeeded();await snap('home-pricing-'+width);
  await pricing.click();await page.waitForURL('**/pricing');await snap('pricing-'+width);
  await go('/daily-challenge/test');
  await visible(page.locator('.daily-passage-panel'));
  await fits();
  if(width<900){
   const header=page.locator('.daily-test-mobile-header');
   assert.equal(await page.getByRole('button',{name:'Exit activity',exact:true}).count(),1);
   const h=await header.boundingBox(),p=await page.locator('.daily-passage-panel').boundingBox();
   assert.ok(h.y>=0&&h.y<2,'Header starts at viewport top');
   assert.ok(p.y>=h.y+h.height,'Passage starts below toolbar');
   await snap('passage-top-'+width);
   acceptDialog=false;await header.getByRole('button',{name:'Submit Answers',exact:true}).click();acceptDialog=true;
   await header.getByRole('button',{name:'Exit activity',exact:true}).click();
   await page.waitForURL(/view=today/);await go('/daily-challenge/test');
   await visible(page.getByRole('tab',{name:'Passage',exact:true}));
   await page.evaluate(()=>window.scrollTo(0,500));
   assert.ok(Math.abs((await header.boundingBox()).y)<2,'Toolbar stays at top when scrolling');
   await snap('passage-scroll-'+width);
   await page.getByRole('tab',{name:/Questions/}).click();
   assert.equal(await page.locator('.daily-passage-panel').isVisible(),false);
   assert.ok((await page.locator('.daily-question-panel').boundingBox()).y>=(await header.boundingBox()).height);
   await fits();
   await page.getByRole('button',{name:/A Evidence matters/}).click();
   await page.getByRole('tab',{name:'Passage',exact:true}).click();
   await page.waitForFunction(()=>scrollY>=490);
   await page.getByRole('tab',{name:/Questions/}).click();
   assert.equal(await page.getByRole('button',{name:/A Evidence matters/}).getAttribute('aria-pressed'),'true');
   const submit=page.locator('.daily-mobile-submit button');
   await submit.scrollIntoViewIfNeeded();
   assert.ok(await submit.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),'Submit unobscured');
   await snap('question-submit-'+width);
   acceptDialog=false;await submit.click();
   assert.equal(calls.filter(c=>c.path==='/rest/v1/daily_rc_attempts'&&c.method==='POST').length,width===375?0:2);
   acceptDialog=true;saveFail=true;await submit.click();
   await visible(page.getByRole('button',{name:'Saving…',exact:true}).first());
   assert.equal(await submit.isDisabled(),true);
   await visible(page.getByRole('button',{name:'Retry',exact:true}));
   assert.equal(await page.getByRole('button',{name:/A Evidence matters/}).getAttribute('aria-pressed'),'true');
   saveFail=false;await page.getByRole('button',{name:'Retry',exact:true}).click();
   await page.waitForURL(/daily-challenge\/result\?attemptId=saved-rc/);
   const responses=calls.filter(c=>c.path==='/rest/v1/daily_rc_question_attempts'&&c.method==='POST').at(-1).body;
   assert.equal(responses[0].selected_option,'A');
   assert.equal(responses[1].selected_option,null);
  }else{
   assert.equal(await page.locator('.daily-test-mobile-header').isVisible(),false);
   assert.equal(await page.locator('.daily-question-panel').isVisible(),true);
   await snap('daily-desktop-'+width);
   await page.getByRole('button',{name:/A Evidence matters/}).click();
   saveFail=false;await page.getByRole('button',{name:'Submit Test',exact:true}).click();
   await page.waitForURL(/daily-challenge\/result\?attemptId=saved-rc/);
  }
 }
 await page.setViewportSize({width:390,height:844});
 await go('/daily-challenge/test');await visible(page.locator('.daily-test-mobile-header'));
 const cdp=await ctx.newCDPSession(page);
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:24,bottom:20,left:0,right:0}});
 assert.ok(await page.locator('.daily-test-mobile-header').evaluate(e=>parseFloat(getComputedStyle(e).paddingTop)>=32),'Safe area included in toolbar');
 await page.evaluate(()=>window.scrollTo(0,500));
 assert.ok(await page.locator('.daily-test-header-row').first().evaluate(e=>e.getBoundingClientRect().top>=24),'Controls stay below simulated safe area while scrolling');
 await snap('safe-area-390');
 assert.deepEqual(errors,[]);
 console.log('PASS: 375/390/1440 pricing, layout, scrolling, pane state, submit cancellation/loading/failure/retry/success and desktop submission');
}finally{await writeFile(out+'/measurements.json',JSON.stringify({results,errors,calls},null,2));await browser.close();}
