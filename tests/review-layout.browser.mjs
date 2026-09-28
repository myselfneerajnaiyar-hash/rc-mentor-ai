import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import dotenv from 'dotenv';
const out='exports/review-layout-fixes';
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
async function top(){await page.evaluate(()=>{document.body.scrollTop=0;document.documentElement.scrollTop=0;document.querySelectorAll('main').forEach(e=>e.scrollTop=0)});}
async function widths(name){for(const width of [320,360,375,390,414]){await page.setViewportSize({width,height:844});await top();await snap(name+'-'+width);}}

const sizes=[[320,568],[320,844],[360,844],[375,844],[390,844],[414,844],[768,844],[800,844],[899,844],[900,844],[1024,844],[1440,900]];
async function go(path){await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(700);}
async function fits(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No page overflow '+page.url());}
async function visible(locator){await locator.waitFor({state:'visible'});}


const review={attempt:{id:'review-fixture',user_id:user.id,daily_rc_set_id:'audit-rc',correct_count:1,incorrect_count:1,unanswered_count:2,score:2,accuracy:50,time_taken:120},rcSet:{...challenge,passage:Array.from({length:25},(_,i)=>`Paragraph ${i+1}. `+'Reading relies on evidence and thoughtful interpretation. '.repeat(12)).join('\n\n'),passage_enrichment:{passageFlowMap:[{title:'Argument',description:'Evidence supports the conclusion.',paragraph:1}]}},questions:challenge.questions.map(q=>({...q,question_text:q.question,correct_answer:1,question_enrichment:{correctExplanation:'Explanation. '.repeat(200)}})),responses:[{question_id:1,selected_option:'A',is_correct:true}]};
let failReview=false, delayReview=false, reviewRequests=0;
await ctx.route('**/api/daily-rc-review?*',async route=>{reviewRequests++;if(delayReview)await new Promise(r=>setTimeout(r,1500));return route.fulfill({status:failReview?503:200,contentType:'application/json',body:JSON.stringify(failReview?{error:'Review fixture unavailable'}:review)}).catch(()=>{});});

async function scrollPosition(){return page.evaluate(()=>scrollY+document.body.scrollTop)}
async function reachable(locator){await locator.scrollIntoViewIfNeeded();assert.ok(await locator.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),'Control is visible and unobscured');}
try{
 for(const width of [375,390,430,1440]){
  await page.setViewportSize({width,height:844});
  await go('/daily-challenge/result?attemptId=review-fixture');
  await page.getByRole('button',{name:'Detailed Review',exact:true}).click();
  const loadedRequests=reviewRequests;
  const pane=page.locator('.passage-pane-scroll');
  await pane.scrollIntoViewIfNeeded();
  if(width<900){
   const before=await scrollPosition();
   const box=await pane.boundingBox();await page.mouse.move(box.x+box.width/2,400);await page.mouse.wheel(0,500);
   await page.waitForFunction(y=>scrollY>y+100,before);
  }else{
   await pane.evaluate(e=>e.scrollTop=0);
   const before=await scrollPosition(); assert.ok(before>100);
   const box=await pane.boundingBox();await page.mouse.move(box.x+box.width/2,Math.max(150,box.y+100));await page.mouse.wheel(0,-500);
   await page.waitForFunction(y=>scrollY+document.body.scrollTop<y-100,before);
  }
  await snap('review-scroll-'+width);
  const sections=page.getByRole('navigation',{name:'Detailed review sections'});
  for(const name of ['Blueprint','Paragraphs','Vocabulary','Questions','Passage & Argument']){
   const button=sections.getByRole('button',{name,exact:true});await reachable(button);await button.click();await fits();
  }
  assert.equal(reviewRequests,loadedRequests,'Section changes reuse loaded review data');
  await sections.getByRole('button',{name:'Questions',exact:true}).click();
  await page.getByRole('button',{name:'Question 2: Unattempted',exact:true}).click();
  await visible(page.getByRole('heading',{name:'What does the passage suggest? (2)',exact:true}));
  if(width<900){
   const next=page.locator('.detailed-rc-review article>footer').getByRole('button',{name:'Next',exact:true});await reachable(next);await snap('review-last-action-'+width);await next.click();
  }
  await page.getByRole('button',{name:'Detailed Review',exact:true}).click();
  assert.equal(await page.locator('.detailed-rc-review').count(),0);
  await page.getByRole('link',{name:'Back to Arena',exact:true}).click();await page.waitForURL('**/daily-challenge');
  await go('/?view=workout');
  for(const name of ['Start','Analytics','History','Performance']){
   const tab=page.getByRole('tab',{name,exact:true});await reachable(tab);await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');await fits();
   if(width<900){const r=await tab.boundingBox();assert.ok(r.height>=44);assert.ok(await tab.evaluate(e=>e.scrollWidth<=e.clientWidth),'Tab label fits');}
  }
  await page.getByRole('tab',{name:'Start',exact:true}).click();
  await reachable(page.getByRole('button',{name:/Start Workout/}));await snap('workout-tabs-'+width);
  // Keep Radix arrow-key activation working with the responsive tab layout.
  await page.getByRole('tab',{name:'Start',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('[role=tab][data-state=active]')?.textContent.trim()==='Analytics');
  await go('/daily-challenge/test');await visible(page.locator('.daily-passage-panel'));
  if(width<900){
   const header=page.locator('.daily-test-mobile-header');const h=await header.boundingBox();const p=await page.locator('.daily-passage-panel').boundingBox();assert.equal(h.y,0);assert.ok(p.y>=h.height);
   await page.getByRole('tab',{name:/Questions/}).click();await page.getByRole('button',{name:/A Evidence matters/}).click();
   await page.getByRole('tab',{name:'Passage',exact:true}).click();await page.evaluate(()=>scrollTo(0,500));
   await page.getByRole('tab',{name:/Questions/}).click();
   assert.equal(await page.getByRole('button',{name:/A Evidence matters/}).getAttribute('aria-pressed'),'true');
   const q=await page.locator('.daily-question-panel').boundingBox();assert.equal(p.width,q.width);
   await reachable(page.locator('.daily-mobile-submit button'));assert.equal(await page.locator('.auctor-mobile-nav').count(),0);
   await snap('daily-rc-'+width);
  }
 }
 await page.setViewportSize({width:390,height:844});
 failReview=true;await go('/detailed-review?attemptId=review-fixture');await visible(page.getByRole('button',{name:'Retry review'}));
 failReview=false;await page.getByRole('button',{name:'Retry review'}).click();await visible(page.locator('.detailed-rc-review'));
 delayReview=true;await page.goto(base+'/daily-challenge/result?attemptId=review-fixture');await visible(page.getByRole('status'));
 await page.getByRole('link',{name:'Back to RC History'}).click();await page.waitForURL('**/rc-history');delayReview=false;
 assert.deepEqual(errors,[]);console.log('PASS: review scrolling/sections/exit/retry/loading exit; Workout four tabs and keyboard; RC alignment, answers, submit at 375/390/430/1440.');
}finally{await writeFile(out+'/measurements.json',JSON.stringify({results,errors,calls},null,2));await browser.close();}




