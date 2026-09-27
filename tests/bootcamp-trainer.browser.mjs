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
    const op=suffix===''?'home':suffix==='/chat'?'chat':suffix==='/enroll'?'enroll':parts[0]==='days'&&parts[2]==='start'?'start':parts[2]==='blocks'?({start:'block_start',responses:'responses',finish:'finish',review:'review'})[parts[4]]:parts[2]||'get'
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
const output=path.join(os.tmpdir(),'auctor-bootcamp-trainer-acceptance');await mkdir(output,{recursive:true})
let checks=0
const check=(condition,message)=>{assert.ok(condition,message);checks++;console.log('PASS',message)}
async function click(name) {await page.getByRole('button',{name,exact:true}).click()}
const day2=process.env.BOOTCAMP_DAY2_SOURCE_FILE?JSON.parse(await readFile(process.env.BOOTCAMP_DAY2_SOURCE_FILE,'utf8')):fixture(2)
for(const row of [day2,fixture(3)])await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[row.id,row.day_number,row.document,row.lock_token,row.updated_at])
try {
  await page.goto(base+'/boot-camp/day/1');await page.getByRole('button',{name:/Start today/}).click()
  await page.getByRole('button',{name:'Begin my warm-up',exact:true}).waitFor()
  check(await page.getByText(/Today is our starting point/).isVisible(),'new student briefing invents no history')
  for(const name of ["What I've noticed","What's changed","Today I'm watching","Today's workout"]){check(await page.getByRole('heading',{name,exact:true}).isVisible(),'structured briefing: '+name)}
  let state=(await h.service.home(student,1)).attempt
  const act=async(action,input={})=>state=await h.service.act(student,state.id,action,{revision:state.revision,...input})
  await act('advance')
  for(const block of [{key:'warmup',questions:source.document.content.warmup},...source.document.content.passages.map((p,i)=>({key:`rc${i+1}`,questions:p.questions})),{key:'va',questions:source.document.content.verbalAbility}]){
    await act('block_start',{key:block.key});for(const q of block.questions)await act('responses',{key:block.key,questionId:q.id,presented:true,response:q.answer});await act('finish',{key:block.key});await act('advance',{reviewed:true})
  }
  today='2026-10-02'
  await page.goto(base+'/boot-camp/day/1/report');await page.getByRole('link',{name:/Go to today's mission: Day 02/}).click()
  await page.waitForURL('**/boot-camp/day/2')
  check(page.url().includes('/day/2'),'Day 1 report links to Day 2')
  await page.getByRole('button',{name:/Start today/}).click();await page.getByRole('button',{name:'Begin my warm-up',exact:true}).waitFor()
  check(await page.getByText(/25 correct from 25 attempted/).isVisible(),'Day 2 briefing includes saved Day 1 results')
  for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'briefing fits '+width);await page.screenshot({path:path.join(output,`day2-briefing-${width}.png`),fullPage:true})}
  await page.reload();await page.getByRole('button',{name:'Begin my warm-up',exact:true}).waitFor();check((await h.service.home(student,2)).attempt.commentary.briefing.daysCompleted===1,'Day 2 mission refresh keeps history')
  await page.setViewportSize({width:1440,height:1000});await click('Begin my warm-up')
  const blocks=[{key:'warmup',label:'Warm-up',questions:day2.document.content.warmup},...day2.document.content.passages.map((p,i)=>({key:`rc${i+1}`,label:`RC ${i+1}`,questions:p.questions})),{key:'va',label:'Verbal Ability',questions:day2.document.content.verbalAbility}]
  for(const [bi,block] of blocks.entries()) {
    await click(`Start ${block.label}`)
    for(const [i,q] of block.questions.entries()) {
      await page.getByRole('heading',{name:q.text,exact:true}).waitFor()
      if(q.mode==='MCQ'){const option=q.options.find(o=>o.id===q.answer);await page.getByRole('button',{name:`${option.id} ${option.text}`,exact:true}).click()}
      else if(q.type==='Para Jumble'){for(const n of q.answer)await click(String(n))}
      else await click(q.type==='Sentence Placement'?`[${q.answer}]`:String(q.answer))
      await page.getByRole('status').filter({hasText:'Answer saved'}).waitFor()
      if(i<block.questions.length-1)await page.getByRole('button',{name:/^Next question/}).click()
    }
    await click(`Finish ${block.label}`);await click('Finish and review')
    await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
    const saved=(await h.service.home(student,2)).attempt
    check((await h.service.review(student,saved.id,block.key)).result.correct===block.questions.length,`Day 2 ${block.label} scores and renders review`)
    check(await page.getByRole('button',{name:/Hear Birbal/}).count()===0,'review continuation has no coaching gate')
    await page.reload();await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
    check((await h.service.home(student,2)).attempt.currentBlock===block.key,'refresh resumes '+block.key)
    await click(['Continue to RC 1','Continue to RC 2','Continue to RC 3','Continue to Verbal Ability','Continue to Day Report'][bi])
  }
  await page.getByRole('button',{name:/See my Day 02 report/}).click();await page.getByRole('region',{name:'Day 2 training report'}).waitFor()
  check((await h.service.home(student,2)).attempt.report.correct===25,'Day 2 report preserves 25 saved correct results')
  today='2026-10-03'
  await page.reload()
  await page.getByRole('link',{name:/Go to today's mission: Day 03/}).click();await page.getByRole('button',{name:/Start today/}).click();await page.getByRole('button',{name:'Begin my warm-up',exact:true}).waitFor()
  check(await page.getByText(/50 correct from 50 attempted/).isVisible(),'Day 3 automatically uses Day 1 plus Day 2 history')
  const third=(await h.service.home(student,3)).attempt
  check(third.dayNumber===3 && third.commentary.briefing.daysCompleted===2,'generic third-day route and mission')
  await page.goto(base+'/boot-camp');await page.getByRole('link',{name:'Continue Day 03',exact:true}).waitFor()
  check(await page.getByRole('region',{name:'50-day training calendar'}).getByRole('link').count()===3,'completed days remain available and next day unlocked')
  check(errors.length===0,'no browser runtime exceptions');check(leaks.length===0,'no answer leaks during activities')
  await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,leaks,calls,day2Source:day2.document.source?.fileName || 'synthetic'},null,2))
  console.log('Trainer browser passed:',checks,'checks. Artifacts:',output)
} catch(e){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw e}
finally{await browser.close();await h.close()}
