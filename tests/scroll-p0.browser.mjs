import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import dotenv from 'dotenv';
const out='exports/scroll-p0';
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
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
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

const decoderAnalysis={cleanedPassage:Array.from({length:12},(_,i)=>({text:`Paragraph ${i+1}. `+'Evidence supports careful reading. '.repeat(25)})),paragraphs:[],passageFlow:[],vocabulary:[]};
await ctx.route('**/api/get-birbal-session?*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({analysis:decoderAnalysis})}));
const cdp=await ctx.newCDPSession(page);
const states=[];
async function state(label){const s=await page.evaluate(()=>{
 function info(e){const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,cls:e.className,inline:e.getAttribute('style'),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,scrollTop:e.scrollTop,overflow:s.overflow,overflowY:s.overflowY,position:s.position,top:s.top,height:s.height,touchAction:s.touchAction,pointerEvents:s.pointerEvents,box:{x:r.x,y:r.y,w:r.width,h:r.height}};}
 const hit=document.elementFromPoint(innerWidth/2,400);const ancestors=[];for(let e=hit;e;e=e.parentElement)ancestors.push(info(e));
 return {url:location.href,y:scrollY,html:info(document.documentElement),body:info(document.body),main:[...document.querySelectorAll('main,.root-content,.passage-pane-scroll')].map(info),ancestors,fixed:[...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).position==='fixed'&&e.getBoundingClientRect().height>0).map(info)};
});states.push({label,...s});await writeFile(out+'/runtime.json',JSON.stringify(states,null,2));console.log(label,s.y,s.body.scrollTop,s.body.overflowY,s.ancestors[0]?.cls);return s;}
async function swipe(up=true,x=180){const y1=up?650:200,y2=up?200:650;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]});for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/12}]});await page.waitForTimeout(25);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);}

function position(s){return s.y+s.body.scrollTop;}
async function unlocked(label){const s=await state(label);assert.notEqual(s.body.overflowY,'hidden',label);assert.equal(await page.locator('.driver-overlay,[role=dialog],.driver-popover').count(),0,label+' stale overlays');return s;}
async function scrollPage(label){const a=await state(label+'-start');await swipe();await swipe();await swipe();const b=await state(label+'-down');assert.ok(position(b)>position(a)+300,label+' down movement');await swipe(false);const c=await state(label+'-up');assert.ok(position(c)<position(b)-100,label+' upward movement');}
const message={id:'fixture-message',title:'Scroll regression message',preview:'Open long message',type:'SYSTEM',source:'Auctor',created_at:'2026-09-28T00:00:00Z',read_at:'2026-09-28T01:00:00Z',body:'Long inbox content.\n'.repeat(200),metadata:{actionLabel:'Open review'},action_url:'/detailed-review?attemptId=review-fixture'};
await ctx.route('**/api/inbox**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(new URL(r.request().url()).pathname==='/api/inbox/fixture-message'?{message}:{messages:[message],unreadCount:0,hasMore:false})}));
await ctx.route('**/api/birbal',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({reply:'Carefully compare the evidence with each claim. '.repeat(20)})}));
try{
 // This assertion fails on the previous implementation: the hidden chat retains overflow:hidden.
 await page.setViewportSize({width:1440,height:844});await go('/');await page.locator('.birbal-launcher').click({force:true});await visible(page.getByRole('button',{name:'Close Birbal conversation'}));assert.equal((await state('chat-open')).body.overflowY,'hidden');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await unlocked('chat-hidden-after-resize');await scrollPage('home-after-resize');
 await page.getByRole('link',{name:'Practice',exact:true}).click();await unlocked('practice-after-chat');
 for(const width of [375,390,430,1440]){
  await page.setViewportSize({width,height:844});
  for(let repeat=0;repeat<3;repeat++){
   await go('/daily-challenge/result?attemptId=review-fixture');await page.getByRole('button',{name:'Detailed Review',exact:true}).click();await unlocked(`review-${width}-${repeat}`);
   if(width<900){await page.locator('.passage-pane-scroll').scrollIntoViewIfNeeded();await scrollPage(`review-content-${width}-${repeat}`);}else{
    const pane=page.locator('.passage-pane-scroll');await pane.scrollIntoViewIfNeeded();const r=await pane.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+100);await page.mouse.wheel(0,1200);await page.waitForTimeout(300);const down=await pane.evaluate(e=>e.scrollTop);assert.ok(down>500);await page.mouse.wheel(0,-600);await page.waitForTimeout(300);assert.ok(await pane.evaluate(e=>e.scrollTop)<down);console.log('desktop review inner',down,await pane.evaluate(e=>e.scrollTop));
   }
   const sections=page.getByRole('navigation',{name:'Detailed review sections'});await sections.getByRole('button',{name:'Questions',exact:true}).click();await page.getByRole('button',{name:'Question 2: Unattempted'}).click();
   await page.getByRole('button',{name:'Detailed Review',exact:true}).click();assert.equal(await page.locator('.detailed-rc-review').count(),0);
   await page.getByRole('link',{name:'Back to Arena',exact:true}).click();await page.waitForURL('**/daily-challenge');await unlocked(`review-exit-${width}-${repeat}`);
   await go('/birbal-v2?session=fixture');await visible(page.getByRole('heading',{name:'Extracted Editorial'}));await page.waitForTimeout(200);await unlocked(`decoder-${width}-${repeat}`);await scrollPage(`decoder-content-${width}-${repeat}`);
   await page.getByRole('textbox',{name:'Message Birbal'}).scrollIntoViewIfNeeded();await page.waitForTimeout(150);const start=await state(`decoder-bottom-${width}-${repeat}`);await swipe(false);const up=await state(`decoder-bottom-up-${width}-${repeat}`);assert.ok(position(up)<position(start)-50,'Decoder can leave bottom including contextual chat');
   await page.getByRole('button',{name:'History',exact:true}).click();await page.waitForURL('**/history');await unlocked(`decoder-exit-${width}-${repeat}`);
  }
  // Tour cleanup on close and on client-side route change.
  await go('/');await page.getByRole('button',{name:/Tour/}).first().click();await visible(page.locator('.driver-popover'));await page.getByRole('button',{name:'Skip Tour'}).click();await unlocked('tour-closed-'+width);
  if(width<900)await scrollPage('home-after-tour-'+width);
  // Inbox uses the same body-lock owner utility; content must scroll while background is locked.
  await go('/inbox');await page.getByRole('button',{name:/Scroll regression message/}).first().click();const dialog=page.getByRole('dialog');await visible(dialog);assert.equal((await state('inbox-open-'+width)).body.overflowY,'hidden');
  const box=await dialog.boundingBox();await page.mouse.move(box.x+box.width/2,400);await page.mouse.wheel(0,900);await page.waitForTimeout(250);assert.ok(await dialog.evaluate(e=>e.scrollTop)>0,'Inbox reader scrolls inside lock');
  await dialog.getByRole('button',{name:'Open review'}).click();await page.waitForURL('**/detailed-review?attemptId=review-fixture');await unlocked('inbox-route-cleanup-'+width);if(width<900)await scrollPage('review-after-inbox-'+width);
  await page.screenshot({path:out+'/review-'+width+'.png'});
 }
 await page.setViewportSize({width:390,height:844});await go('/birbal-v2?session=fixture');await visible(page.getByRole('textbox',{name:'Message Birbal'}));await page.getByRole('textbox',{name:'Message Birbal'}).fill('Explain the article');await page.getByRole('button',{name:'Send message'}).click();await page.waitForTimeout(500);
 const typingBefore=await state('decoder-typing-before');await swipe(false,8);const typingAfter=await state('decoder-typing-after-upward-gesture');assert.ok(position(typingAfter)<position(typingBefore)-100,'Typing must not pull the document back down');await page.waitForTimeout(500);const later=await state('decoder-typing-later');assert.ok(position(later)<=position(typingAfter)+1,'No document autoscroll during reply');
 await page.screenshot({path:out+'/decoder-typing.png'});
 await go('/');await unlocked('navigation-during-reply');await scrollPage('home-after-reply');
 assert.deepEqual(errors,[]);console.log('PASS: touch/desktop review and decoder repeated scroll/open/exit, chat hidden-lock regression, inbox navigation cleanup, tour close, streaming document-scroll regression.');
}finally{await browser.close();}

