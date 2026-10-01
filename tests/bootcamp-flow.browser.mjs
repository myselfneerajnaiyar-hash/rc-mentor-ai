// Focused workout, persistence, report-route, and client-wait regression coverage.
import { chromium } from 'playwright-core'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import dotenv from 'dotenv'
import { harness,student,fixture } from './helpers/bootcamp-db.mjs'

const base=process.env.BOOTCAMP_TEST_BASE_URL||'http://localhost:3111'
const source=fixture(),env=dotenv.parse(await readFile('.env.local','utf8'))
const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||path.join(os.homedir(),'.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe'),headless:true})
const ctx=await browser.newContext({viewport:{width:1280,height:900}})
const user={id:student,email:'bootcamp-flow@example.test'}
const session={access_token:student,refresh_token:'local-flow-refresh',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,user}
const branding={brandName:'Auctor',logoUrl:'/logo.png',faviconUrl:'/icon-192.png',primaryColor:'#4f46e5',secondaryColor:'#0ea5e9',isInstitute:false}
const context={user,profile:{user_id:student,name:'Boot Camp Student',exam:'CAT'},tenant:{kind:'b2c'},branding,exam:'CAT',capabilities:{isCAT:true,showDailyRC:true,showCATSectionals:true},entitlement:{hasAccess:true,isPremium:true},access:'allowed'}
await ctx.addInitScript(({ref,session})=>localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session)),{ref,session})
let h=await harness(source),failNextAnswer=false,delayNextAnswerMs=0
const calls=[],errors=[]
await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),fulfill=(json,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(json)})
  if(url.pathname.startsWith('/api/bootcamp')) {
    const suffix=url.pathname.slice('/api/bootcamp'.length),parts=suffix.split('/').filter(Boolean)
    const params={id:parts[0]==='attempts'?parts[1]:undefined,key:parts[2]==='blocks'?parts[3]:undefined}
    const op=suffix===''?'home':suffix==='/enroll'?'enroll':suffix==='/chat'?'chat':parts[0]==='attempts'?(parts[2]==='blocks'?({start:'block_start',responses:'responses',finish:'finish',review:'review'})[parts[4]]:parts[2]||'get'):parts[0]==='days'?'start':parts[0]
    if(op==='responses'&&Object.hasOwn(JSON.parse(req.postData()||'{}'),'response')&&delayNextAnswerMs){const delay=delayNextAnswerMs;delayNextAnswerMs=0;await new Promise(resolve=>setTimeout(resolve,delay))}
    if(op==='responses'&&failNextAnswer&&Object.hasOwn(JSON.parse(req.postData()||'{}'),'response')){failNextAnswer=false;return fulfill({error:'Injected persistence failure.'},503)}
    const started=performance.now(),before=h.calls.length
    const response=await h.handle(new Request(req.url(),{method:req.method(),headers:req.headers(),...(req.postData()?{body:req.postData()}:{})}),op,params)
    const data=await response.json()
    calls.push({op,status:response.status,durationMs:Number((performance.now()-started).toFixed(2)),dbOps:h.calls.length-before})
    return fulfill(data,response.status)
  }
  if(url.pathname==='/api/tenant-context')return fulfill({tenant:context.tenant,branding})
  if(url.pathname==='/api/session-context')return fulfill(context)
  if(url.pathname==='/auth/v1/token')return fulfill(session)
  if(url.pathname==='/auth/v1/user')return fulfill(user)
  if(url.origin===base)return route.continue()
  return route.abort()
})
const page=await ctx.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message))
const click=async name=>page.getByRole('button',{name,exact:true}).click()
let checks=0
const check=(condition,message)=>{assert.ok(condition,message);checks++;console.log('PASS',message)}
try {
  await page.goto(`${base}/boot-camp/day/1`)
  await click('Start today’s session →');await click('Begin Day 1');await click('Start Warm-up')
  const blocks=[{key:'warmup',questions:source.document.content.warmup},...source.document.content.passages.map((passage,i)=>({key:`rc${i+1}`,questions:passage.questions})),{key:'va',questions:source.document.content.verbalAbility}]
  const observedQuestionMs=[],answerUiWaitMs=[]
  for(const [bi,block] of blocks.entries()) {
    if(bi>0)await click(`Start ${block.key==='va'?'Verbal Ability':`RC ${bi}`}`)
    for(const [qi,q] of block.questions.entries()) {
      const ready=performance.now()
      await page.getByRole('heading',{name:q.text,exact:true}).waitFor()
      observedQuestionMs.push(Number((performance.now()-ready).toFixed(2)))
      const answerStarted=performance.now()
      if(q.mode==='MCQ') {const answer=q.options.find(option=>option.id===q.answer);await page.getByRole('button',{name:`${answer.id} ${answer.text}`,exact:true}).click()}
      else if(q.type==='Para Jumble')for(const number of q.answer)await click(String(number))
      else await click(q.type==='Sentence Placement'?`[${q.answer}]`:String(q.answer))
      await page.getByRole('status').filter({hasText:'Answer saved'}).waitFor()
      answerUiWaitMs.push(Number((performance.now()-answerStarted).toFixed(2)))
      if(qi<block.questions.length-1)await click('Next question →')
    }
    const label=block.key==='warmup'?'Warm-up':block.key==='va'?'Verbal Ability':`RC ${bi}`
    await click(`Finish ${label}`);await click('Finish and review')
    await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
    await page.getByRole('button',{name:['Continue to RC 1','Continue to RC 2','Continue to RC 3','Continue to Verbal Ability','Continue to Day Report'][bi],exact:true}).waitFor()
    await page.getByRole('button',{name:['Continue to RC 1','Continue to RC 2','Continue to RC 3','Continue to Verbal Ability','Continue to Day Report'][bi],exact:true}).click()
    if(bi===4)break
  }
  await page.getByRole('region',{name:'Training complete'}).waitFor()
  await page.getByRole('button',{name:'See my Day 01 report',exact:true}).waitFor()
  await click('See my Day 01 report')
  await page.getByRole('heading',{name:'Day 1 results',exact:true}).waitFor()
  await page.waitForTimeout(5500)
  check(new URL(page.url()).pathname==='/boot-camp/day/1/report','completion settles on the report without a competing redirect')
  check(await page.getByRole('region',{name:'Day 1 training report'}).isVisible(),'final report remains visible after route settles')
  check((await h.service.home(student)).attempt.report.score===25,'report reflects all persisted answers')
  await page.reload();await page.getByRole('heading',{name:'Day 1 results',exact:true}).waitFor()
  check((await h.service.home(student)).attempt.report.score===25,'direct report refresh reloads saved results')
  await page.getByRole('link',{name:/Back to Boot Camp/}).click();await page.waitForURL('**/boot-camp');await page.getByRole('link',{name:'View Day 01 Report',exact:true}).waitFor()
  await page.getByRole('link',{name:'View Day 01 Report',exact:true}).click();await page.waitForURL('**/boot-camp/day/1/report');await page.getByRole('heading',{name:'Day 1 results',exact:true}).waitFor()
  check(true,'Back to Boot Camp and reopening the completed day returns to its report')
  const answerCalls=calls.filter(call=>call.op==='responses'),finishCalls=calls.filter(call=>call.op==='finish')
  console.log('Measured local browser/API-handler calls (PGlite, mocked auth):',JSON.stringify({answerCalls:answerCalls.length,answerMeanMs:answerCalls.length?Number((answerCalls.reduce((n,c)=>n+c.durationMs,0)/answerCalls.length).toFixed(2)):null,answerUiWaitMeanMs:Number((answerUiWaitMs.reduce((a,b)=>a+b,0)/answerUiWaitMs.length).toFixed(2)),answerDbOps:answerCalls[0]?.dbOps,finishCalls:finishCalls.length,finishMeanMs:finishCalls.length?Number((finishCalls.reduce((n,c)=>n+c.durationMs,0)/finishCalls.length).toFixed(2)):null,questionReadyMeanMs:Number((observedQuestionMs.reduce((a,b)=>a+b,0)/observedQuestionMs.length).toFixed(2)),questionReadyMaxMs:Math.max(...observedQuestionMs)},null,2))
  check(errors.length===0,'full completion/report path has no browser exceptions')

  await h.close();h=await harness(source);await page.goto(`${base}/boot-camp/day/1`)
  await click('Start today’s session →');await click('Begin Day 1');await click('Start Warm-up')
  const first=source.document.content.warmup[0],wrong=first.options.find(option=>option.id!==first.answer)
  failNextAnswer=true;delayNextAnswerMs=300
  const failedChoice=page.getByRole('button',{name:`${wrong.id} ${wrong.text}`,exact:true})
  await failedChoice.click()
  check(await failedChoice.getAttribute('aria-pressed')==='true'&&(await h.service.home(student)).attempt.activity.responses[0].response===null,'answer selection updates immediately while server persistence is pending')
  await page.getByRole('button',{name:'Retry saving answer',exact:true}).waitFor()
  check((await h.service.home(student)).attempt.activity.responses[0].response===null,'failed answer remains unsaved rather than falsely reported')
  await click('Retry saving answer');await page.getByRole('status').filter({hasText:'Answer saved'}).waitFor()
  check((await h.service.home(student)).attempt.activity.responses[0].response===wrong.id,'retry persists the original answer')
  await page.reload();await page.getByRole('heading',{name:first.text,exact:true}).waitFor()
  check((await h.service.home(student)).attempt.activity.responses[0].response===wrong.id,'refresh recovers the persisted answer')
  console.log(`Focused browser flow passed ${checks} checks.`)
} finally {await browser.close();await h.close()}
