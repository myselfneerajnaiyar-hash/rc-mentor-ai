// Production UI + actual Boot Camp handlers + local PostgreSQL; no live data writes.
import { chromium } from 'playwright-core'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import dotenv from 'dotenv'
import { harness,student,fixture } from './helpers/bootcamp-db.mjs'
const base=process.env.BOOTCAMP_TEST_BASE_URL || 'http://localhost:3111'
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname))
const source=process.env.BOOTCAMP_SOURCE_FILE ? JSON.parse(await readFile(process.env.BOOTCAMP_SOURCE_FILE,'utf8')) : fixture()
const chatEvidence=[]
let today='2026-10-05'
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
    const op=suffix===''?'home':suffix==='/chat'?'chat':suffix==='/enroll'?'enroll':parts[0]==='leaderboard'?'leaderboard':parts[0]==='days'&&parts[2]==='start'?'start':parts[2]==='blocks'?({start:'block_start',responses:'responses',finish:'finish',review:'review'})[parts[4]]:parts[2]||'get'
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
const output=path.join(os.tmpdir(),'auctor-bootcamp-calendar-acceptance');await mkdir(output,{recursive:true})
let checks=0
const check=(condition,message)=>{assert.ok(condition,message);checks++;console.log('PASS',message)}
async function click(name) {await page.getByRole('button',{name,exact:true}).click()}
for(let day=2;day<=50;day++){const row=fixture(day);await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[row.id,row.day_number,row.document,row.lock_token,row.updated_at])}
try {
  for(const [date,day,opened] of [['2026-10-05',1,1],['2026-10-09',5,5],['2026-10-29',25,25],['2026-11-23',50,50],['2026-11-24',null,50],['2026-12-03',null,50]]) {
    today=date
    await page.goto(base+'/boot-camp')
  check(await page.getByRole('link',{name:/Browse Days/}).getAttribute('href')==='#bootcamp-calendar','Browse Days jumps to the existing calendar')
  check(await page.getByRole('link',{name:'Leaderboards',exact:true}).getAttribute('href')==='#bootcamp-leaderboards','leaderboard has a clear calendar entry point')
  check(await page.getByRole('link',{name:/Overall Analytics/}).getAttribute('href')==='/boot-camp/analytics','Overall Analytics opens the existing Boot Camp analytics route')
  const board=page.locator('#bootcamp-leaderboards')
  await board.getByRole('tab',{name:'Daily'}).waitFor()
  check(await board.getByText(new RegExp(`Date: ${date} IST`)).count()===1,date+' daily leaderboard shows its IST date')
  await board.getByRole('tab',{name:'Weekly'}).click()
  await board.getByText(/Week: 2026-\d\d-\d\d.*2026-\d\d-\d\d IST/).waitFor()
    const calendar=page.getByRole('region',{name:'50-day training calendar'})
    if(day)await page.getByRole('link',{name:`Enter Day ${String(day).padStart(2,'0')}`,exact:true}).waitFor()
    else await page.getByRole('heading',{name:'Time to catch up and review.',exact:true}).waitFor()
    let links=0,buffers=0,currents=0
    for(const name of ['October 2026','November 2026','December 2026']) {
      await page.getByRole('tab',{name,exact:true}).click()
      links+=await calendar.getByRole('link').count()
      buffers+=await calendar.locator('[data-buffer=true]').count()
      currents+=await calendar.locator('[aria-current=date]').count()
      check(await calendar.locator('[data-training-day="51"]').count()===0,date+' has no Day 51')
    }
    check(links===opened,`${date}: ${opened} open calendar links`)
    check(currents===(day?1:0),date+' has exactly the mapped current mission')
    check(buffers===10,date+' has ten buffer dates without curriculum numbers')
    check(!/you missed|days behind|broken streak/i.test(await page.locator('body').innerText()),date+' has neutral language')
    await page.getByRole('tab',{name:date.startsWith('2026-10')?'October 2026':date.startsWith('2026-11')?'November 2026':'December 2026',exact:true}).click()
    for(const width of [1440,390,320]){await page.setViewportSize({width,height:width===1440?1000:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),date+' fits '+width);await page.screenshot({path:path.join(output,`${date}-${width}.png`),fullPage:true})}
    await page.setViewportSize({width:1440,height:1000})
  }
  today='2026-10-29';await page.goto(base+'/boot-camp');await page.getByRole('link',{name:'Enter Day 25',exact:true}).click();await page.getByRole('button',{name:/Start today/}).click();await page.getByRole('button',{name:'Begin my warm-up',exact:true}).waitFor()
  check((await h.service.home(student)).attempt.dayNumber===25,'late join starts today without completing earlier days')
  await page.goto(base+'/boot-camp/day/26');await page.getByRole('alert').filter({hasText:'opens on 2026-10-26'}).waitFor()
  check(await page.getByRole('button',{name:/Start today/}).count()===0,'direct future route exposes no start button')
  today='2026-10-31';await page.goto(base+'/boot-camp');await page.getByRole('link',{name:'Enter Day 27',exact:true}).waitFor()
  check(await page.getByRole('link',{name:'Day 26 - AVAILABLE',exact:true}).isVisible(),'return after a gap leaves October 26 open')
  await page.getByRole('link',{name:'Day 23 - AVAILABLE',exact:true}).click();await page.getByRole('button',{name:/Start today/}).click();await click('Begin my warm-up')
  for(const [key,label,next] of [['warmup','Warm-up','RC 1'],['rc1','RC 1','RC 2']]){await click(`Start ${label}`);await click('Finish this block early');await click('Finish and review');await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor();await click(`Continue to ${next}`);check((await h.service.home(student,23)).attempt.currentBlock!==key,'completed block persists '+key)}
  const before=(await h.service.home(student,23)).attempt
  await page.goto(base+'/boot-camp');await page.getByRole('link',{name:'Enter Day 27',exact:true}).waitFor();await page.getByRole('link',{name:'Day 23 - ATTEMPTED / IN PROGRESS',exact:true}).click();await page.getByRole('button',{name:'Start RC 2',exact:true}).waitFor()
  await page.reload();await page.getByRole('button',{name:'Start RC 2',exact:true}).waitFor()
  check((await h.service.home(student,23)).attempt.id===before.id,'two-block partial day resumes the original attempt after refresh')
  let state=(await h.service.home(student,23)).attempt
  const act=async(action,input={})=>state=await h.service.act(student,state.id,action,{revision:state.revision,...input})
  for(const key of ['rc2','rc3','va']){await act('block_start',{key});await act('finish',{key});await act('advance',{reviewed:true})}
  await page.goto(base+'/boot-camp');await page.getByRole('link',{name:'Day 23 - COMPLETED',exact:true}).click();await page.getByRole('region',{name:'Day 23 training report'}).waitFor()
  check(await page.getByRole('button',{name:/Start again|Retry day|Reset|Start today/}).count()===0,'completed day opens its report with no retry CTA')
  check(await page.getByRole('link',{name:/Go to today's mission: Day 27/}).isVisible(),'backlog report directs attention back to today')
  check((await h.service.start(student,23)).id===before.id,'start API cannot create a second official attempt')
  today='2027-02-04';await page.goto(base+'/boot-camp');await page.getByRole('heading',{name:'Your practice library is open.',exact:true}).waitFor();check((await h.service.home(student)).days.every(d=>d.unlocked),'January library keeps all 50 days open')
  today='2027-02-05';await page.goto(base+'/boot-camp');await page.getByRole('heading',{name:'This Boot Camp has ended.',exact:true}).waitFor();check(await page.getByRole('region',{name:'50-day training calendar'}).getByRole('link').count()===0,'practice closes after January access window')
  today='2026-10-04';await page.goto(base+'/boot-camp');await page.getByRole('heading',{name:'Training starts 05 Oct 2026.',exact:true}).waitFor();check(await page.getByRole('link',{name:/Enter Day/}).count()===0,'before launch no premature day access')
  check(errors.length===0,'no browser runtime exceptions')
  await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,calls},null,2))
  console.log('Calendar browser passed:',checks,'checks. Artifacts:',output)
} catch(e){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw e}
finally{await browser.close();await h.close()}
