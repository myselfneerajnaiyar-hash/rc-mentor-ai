import { chromium } from 'playwright-core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import dotenv from 'dotenv';
const out='exports/mobile-ux-audit';
await mkdir(out,{recursive:true});
const env=dotenv.parse(await readFile('.env.local'));
const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const base='http://localhost:3112';
const browser=await chromium.launch({executablePath:'C:/Users/NERAJ/.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe',headless:true});
const user={id:'11111111-1111-4111-8111-111111111111',email:'audit@example.test'};
const session={access_token:'local-audit-only',refresh_token:'local-audit-only',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,user};
const profile={user_id:user.id,name:'New Student',exam:'CAT',streak_count:0,daily_rc_streak:0,is_premium:true,birbal_credits:30,birbal_credit_month:'2026-9'};
const branding={brandName:'Auctor',logoUrl:'/logo.png',faviconUrl:'/icon-192.png',primaryColor:'#4f46e5',secondaryColor:'#0ea5e9',isInstitute:false};
const context={user,profile,tenant:{kind:'b2c'},branding,exam:'CAT',capabilities:{exam:'CAT',isCAT:true,showDailyRC:true,showCATSectionals:true},entitlement:{hasAccess:true,isPremium:true,isInstituteStudent:false},access:'allowed'};
const ctx=await browser.newContext({viewport:{width:390,height:844}});
await ctx.addInitScript(({ref,session})=>localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session)),{ref,session});
const calls=[],errors=[],results=[];
const challenge={id:'audit-rc',title:'Daily Reading Challenge',timer_minutes:8,source_year:'CAT 2023',difficulty:'Moderate',passage:'Reading requires distinguishing evidence from assumptions. '.repeat(70),questions:[1,2,3,4].map(i=>({id:i,question:`What does the passage suggest? (${i})`,options:['Evidence matters','All claims are true','Reading is unnecessary','Assumptions prove claims'],answer:'A',explanation:'Evidence supports conclusions.'}))};
await ctx.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/rest/')||u.pathname.startsWith('/auth/'))calls.push({path:u.pathname,method:req.method()});
 if(u.pathname==='/api/tenant-context')return json({tenant:context.tenant,branding});
 if(u.pathname==='/api/session-context')return json(context);
 if(u.pathname==='/auth/v1/user')return json(user);
 if(u.pathname==='/auth/v1/token')return json(session);
 if(u.pathname.startsWith('/rest/v1/')){const table=u.pathname.split('/').at(-1);const single=req.headers().accept?.includes('object');return json(table==='profiles'?(single?profile:[profile]):(single?null:[]));}
 if(u.pathname==='/api/birbal-context')return json({analytics:{overallAccuracy:0,averageWPM:0,readingIQ:0,readerType:'New reader',skills:[],strongestSkill:'Not enough data',weakestSkill:'Not enough data'},recommendations:[]});
 if(u.pathname==='/api/birbal-coach')return json({coach:null});
 if(u.pathname==='/api/hangman-streak')return json({streak:0,isActiveToday:false});
 if(u.pathname==='/api/get-daily-rc')return json({challenge});
 if(u.pathname==='/api/bootcamp')return json({calendar:{period:'UPCOMING',todayDay:null},attempt:null});
 if(u.pathname.startsWith('/api/'))return json({error:'Audit fixture: unavailable',items:[],messages:[],count:0},503);
 if(u.origin===base)return route.continue();
 return route.abort();
});
const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(120000);
async function snap(name){
 await page.waitForTimeout(500);
 const data=await page.evaluate(()=>({url:location.pathname+location.search,width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,scrollY,nav:[...document.querySelectorAll('nav')].filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).display!=='none').map(e=>e.innerText),headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>({text:e.innerText,y:Math.round(e.getBoundingClientRect().top+scrollY)})),controls:[...document.querySelectorAll('button,a,input,select,textarea')].filter(e=>e.getBoundingClientRect().height).map(e=>{let r=e.getBoundingClientRect();return {text:(e.innerText||e.getAttribute('aria-label')||e.getAttribute('placeholder')||'').slice(0,90),x:Math.round(r.x),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height)}}),text:document.body.innerText.slice(0,16000)}));
 results.push({name,...data});await page.screenshot({path:`${out}/${name}.png`,fullPage:true});await writeFile(`${out}/measurements.json`,JSON.stringify({results,errors,calls},null,2));console.log(name, data.scrollWidth,data.scrollHeight);
}
try{
 await page.goto(base);await page.getByRole('button',{name:'Home',exact:true}).waitFor();
 for(const width of [320,360,375,390,414,800,1440]){await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo(0,0));await snap(`home-${width}`);}
 await page.setViewportSize({width:390,height:844});
 for(const [name,action] of [['workout',()=>page.getByRole('button',{name:'Start Workout',exact:true}).click()],['rc',()=>page.getByRole('button',{name:'Practice',exact:true}).click()],['vocab',()=>page.getByRole('button',{name:'Vocab',exact:true}).click()],['speed',()=>page.getByRole('button',{name:'Speed',exact:true}).click()],['precision',()=>page.getByRole('button',{name:/Precision/}).click()],['grammar',()=>page.getByRole('button',{name:'Grammar',exact:true}).click()],['profile',()=>page.getByRole('button',{name:'Profile',exact:true}).click()],['birbal',()=>page.getByRole('button',{name:'Birbal',exact:true}).click()]]){
 try{await action();await snap(`${name}-390`);}catch(e){console.log(name,e.message.slice(0,160));}
 }
 for(const path of ['/daily-challenge','/daily-challenge/instructions','/daily-challenge/test','/?view=cat','/birbal-v2','/birbal-editorial-decoder','/rc-history','/history','/inbox','/pricing','/workout','/rc/drill','/login','/signup','/welcome','/boot-camp','/daily-challenge/result','/detailed-review','/cognition-diagnosis','/rc-session/test','/rc-session/audit','/arena/result/audit']){
 try{await page.goto(base+path);await page.waitForTimeout(1200);await snap(path.replace(/[^a-z0-9]/gi,'-')+'-390');}catch(e){console.log(path,e.message.slice(0,160));}
 }
}finally{await writeFile(`${out}/measurements.json`,JSON.stringify({results,errors,calls},null,2));await browser.close();}

