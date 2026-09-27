// Production UI + actual Boot Camp handlers + local PostgreSQL; no live data writes.
import { chromium } from 'playwright-core'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import dotenv from 'dotenv'
import { adaptDay } from '../lib/bootcamp/content.mjs'
import { harness,student,fixture } from './helpers/bootcamp-db.mjs'
const base=process.env.BOOTCAMP_TEST_BASE_URL || 'http://localhost:3111'
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname))
const source=process.env.BOOTCAMP_SOURCE_FILE ? JSON.parse(await readFile(process.env.BOOTCAMP_SOURCE_FILE,'utf8')) : fixture()
const chatEvidence=[]
let today='2026-10-01'
const h=await harness(source,async()=>{throw Error('Exercise coaching fallback')},async(context,messages)=>{
  chatEvidence.push({context,messages})
  return context.focus ? `Let's discuss ${context.focus.label}, question 3. Your saved answer was ${context.focus.questions[2].response}.` : 'Your training starts with five warm-up questions, followed by three RC passages and verbal ability.'
},{now:()=>today})
const env=dotenv.parse(await readFile('.env.local'))
const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || path.join(os.homedir(),'.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe'),headless:true})
const ctx=await browser.newContext({viewport:{width:1440,height:1000}})
const user={id:student,email:'bootcamp-browser@example.test'}
const session={access_token:student,refresh_token:'local-test-refresh',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,user}
const branding={brandName:'Auctor',logoUrl:'/logo.png',faviconUrl:'/icon-192.png',primaryColor:'#4f46e5',secondaryColor:'#0ea5e9',isInstitute:false}
const context={user,profile:{user_id:student,name:'Boot Camp Student',exam:'CAT'},tenant:{kind:'b2c'},branding,exam:'CAT',capabilities:{isCAT:true,showDailyRC:true,showCATSectionals:true},entitlement:{hasAccess:true,isPremium:true},access:'allowed'}
await ctx.addInitScript(({ref,session})=>localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session)),{ref,session})
const errors=[],leaks=[],calls=[]
let failNextAnswer=false, failNextChat=false
await ctx.route('**/*',async route=> {
  const req=route.request(),url=new URL(req.url())
  const fulfill=(json,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(json)})
  if(url.pathname.startsWith('/api/bootcamp')) {
    const suffix=url.pathname.slice('/api/bootcamp'.length),parts=suffix.split('/').filter(Boolean)
    const params={day:parts[0]==='days'?parts[1]:undefined,id:parts[0]==='attempts'?parts[1]:undefined,key:parts[2]==='blocks'?parts[3]:undefined}
    const op=suffix==='/analytics'?'analytics':suffix===''?'home':suffix==='/chat'?'chat':suffix==='/enroll'?'enroll':parts[0]==='days'&&parts[2]==='start'?'start':parts[2]==='blocks'?({start:'block_start',responses:'responses',finish:'finish',review:'review'})[parts[4]]:parts[2]||'get'
    if(op==='chat' && failNextChat){failNextChat=false;return fulfill({error:'Birbal could not reply just now. Please retry your message.'},503)}
    if (op==='responses' && failNextAnswer && Object.hasOwn(JSON.parse(req.postData() || '{}'),'response')) { failNextAnswer=false; return fulfill({error:'Temporary test connection failure. Please retry.'},503) }
    const r=await h.handle(new Request(req.url(),{method:req.method(),headers:req.headers(),...(req.postData()?{body:req.postData()}: {})}),op,params)
    const data=await r.json();calls.push({op,status:r.status})
    if(data.activity) {const json=JSON.stringify(data);for(const key of ['"answer":','"sourceAnswer":','"correctPosition":','"explanation":','"snapshot"']) if(json.includes(key)) leaks.push(key)}
    return fulfill(data,r.status)
  }
  if(url.pathname==='/api/tenant-context')return fulfill({tenant:context.tenant,branding})
  if(url.pathname==='/api/session-context')return fulfill(context)
  if(url.pathname==='/auth/v1/token')return fulfill(session)
  if(url.pathname==='/auth/v1/user')return fulfill(user)
  if(url.origin===base)return route.continue()
  return route.abort()
})
const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000)
const output=path.join(os.tmpdir(),'auctor-bootcamp-overall-acceptance');await mkdir(output,{recursive:true})
let checks=0
const check=(condition,message)=>{assert.ok(condition,message);checks++;console.log('PASS',message)}
for(let day=2;day<=10;day++){const row=fixture(day);await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[row.id,row.day_number,row.document,row.lock_token,row.updated_at])}

try {
 today='2026-10-10'
 await page.goto(base+'/boot-camp/analytics');await page.getByText('Your accuracy trajectory',{exact:true}).waitFor()
 check(await page.getByText('Your training profile is taking shape.',{exact:false}).count()>0,'empty profile renders without fabricated accuracy')
 await h.service.enroll(student)
 for(const day of [1,2,3,5,6,7,8,9,10]) {
  let state=await h.service.start(student,day)
  const act=async(action,input={})=>state=await h.service.act(student,state.id,action,{revision:state.revision,...input})
  await act('advance')
  for(const block of adaptDay(fixture(day)).snapshot.blocks) {
   await act('block_start',{key:block.key})
   const q=block.questions[0];await act('responses',{key:block.key,questionId:q.id,presented:true,response:day<5&&q.mode==='MCQ'?'A':q.answer})
   if(day===7)break
   await act('finish',{key:block.key});await act('advance',{reviewed:true})
  }
  check((await h.service.start(student,day)).id===state.id,'Day '+day+' has one official resumable attempt')
  if(day===1){await page.reload();await page.getByText('2% of your curriculum',{exact:true}).waitFor();check(await page.locator('.recharts-line-dot').count()===1,'one completed day renders exactly one point');await page.locator('.recharts-line-dot').first().hover();await page.getByText('Day 1',{exact:true}).waitFor();check(true,'chart tooltip shows the observed training day')}
 }
 await assert.rejects(h.service.start(student,11),/opens on/)
 const data=await h.service.getBootCampOverallAnalytics(student)
 check(data.daysCompleted===8&&data.questionsAttempted===40,'actual stored attempts aggregate eight completed days and forty answers')
 check(data.partialDays.length===1&&data.partialDays[0].day===7,'Day 7 remains partial')
 check(!data.accuracyByDay.some(d=>d.day===4||d.day===7),'missing and partial days do not manufacture chart points')
 check((await h.service.getBootCampOverallAnalytics('00000000-0000-4000-8000-000000000002')).daysCompleted===0,'other student has no access to history')
 await page.reload();await page.getByText('16% of your curriculum',{exact:true}).waitFor()
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:1000})
  for(const tab of ['Overview','Performance','Skills','Consistency']) {
   await page.getByRole('button',{name:tab,exact:true}).click()
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),tab+' no page overflow at '+width)
   await page.screenshot({path:path.join(output,tab+'-'+width+'.png'),fullPage:true})
  }
 }
 await page.getByRole('link',{name:/Resume Day 7/}).click();await page.getByRole('button',{name:/Submit|Next/}).first().waitFor()
 check((await h.service.home(student,7)).attempt.phase==='activity','partial Day 7 resumes after analytics navigation')
 await page.goto(base+'/boot-camp/day/10/report');await page.getByRole('region',{name:'Day 10 training report'}).waitFor()
 await page.getByRole('tab',{name:'analytics',exact:true}).click();await page.getByText('Day 10 performance',{exact:true}).waitFor()
 check(true,'daily analytics label uses actual Day 10')
 await ctx.route('**/api/bootcamp/analytics',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Test analytics unavailable'})}))
 await page.goto(base+'/boot-camp/analytics');await page.getByRole('alert').filter({hasText:'Test analytics unavailable'}).waitFor();check(await page.getByRole('button',{name:'Try again',exact:true}).isVisible(),'failed fetch exposes an explicit retry state')
 await ctx.unroute('**/api/bootcamp/analytics');await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByText('16% of your curriculum',{exact:true}).waitFor();check(true,'retry restores saved analytics')
 check(errors.length===0,'no browser runtime exceptions')
 await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,calls},null,2));console.log('Overall analytics browser passed:',checks,'checks. Artifacts:',output)
} catch(e){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw e}
finally{await browser.close();await h.close()}
