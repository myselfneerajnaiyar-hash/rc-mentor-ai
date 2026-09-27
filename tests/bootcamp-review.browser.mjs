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
let h=await harness(source,async()=>{throw Error('Exercise coaching fallback')},async(context,messages)=>{
  chatEvidence.push({context,messages})
  return context.focus ? `Let's discuss ${context.focus.label}, question 3. Your saved answer was ${context.focus.questions[2].response}.` : 'Your training starts with five warm-up questions, followed by three RC passages and verbal ability.'
})
const env=dotenv.parse(await readFile('.env.local'))
const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || path.join(os.homedir(),'.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe'),headless:true})
const ctx=await browser.newContext({viewport:{width:1440,height:1000}})
const user={id:student,email:'bootcamp-browser@example.test'}
const session={access_token:student,refresh_token:'local-test-refresh',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,user}
const branding={brandName:'Auctor',logoUrl:'/logo.png',faviconUrl:'/icon-192.png',primaryColor:'#4f46e5',secondaryColor:'#0ea5e9',isInstitute:false}
const context={user,profile:{user_id:student,name:'Boot Camp Student',exam:'CAT'},tenant:{kind:'b2c'},branding,exam:'CAT',capabilities:{isCAT:true,showDailyRC:true,showCATSectionals:true},entitlement:{hasAccess:true,isPremium:true},access:'allowed'}
await ctx.addInitScript(({ref,session})=>{if(location.protocol==='http:')localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session))},{ref,session})
const errors=[],leaks=[],calls=[]
let failNextAnswer=false, failNextChat=false
let reviewIssue=null, unexpectedCoach=0
await ctx.route('**/*',async route=> {
  const req=route.request(),url=new URL(req.url())
  const fulfill=(json,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(json)})
  if(url.pathname.startsWith('/api/bootcamp')) {
    const suffix=url.pathname.slice('/api/bootcamp'.length),parts=suffix.split('/').filter(Boolean)
    const params={id:parts[0]==='attempts'?parts[1]:undefined,key:parts[2]==='blocks'?parts[3]:undefined}
    const op=suffix===''?'home':suffix==='/chat'?'chat':suffix==='/enroll'?'enroll':suffix==='/days/1/start'?'start':parts[2]==='blocks'?({start:'block_start',responses:'responses',finish:'finish',review:'review'})[parts[4]]:parts[2]||'get'
    if(op==='coach') {
      const current=(await h.service.home(student)).attempt
      if(['review','commentary'].includes(current?.phase)) {unexpectedCoach++;return fulfill({error:'Coaching is deliberately unavailable in this review regression test.'},503)}
    }
    if(op==='review' && reviewIssue==='network') {reviewIssue=null;return fulfill({error:'Review could not be loaded. Retry your saved progress.'},503)}
    if(op==='chat' && failNextChat){failNextChat=false;return fulfill({error:'Birbal could not reply just now. Please retry your message.'},503)}
    if (op==='responses' && failNextAnswer && Object.hasOwn(JSON.parse(req.postData() || '{}'),'response')) { failNextAnswer=false; return fulfill({error:'Temporary test connection failure. Please retry.'},503) }
    const r=await h.handle(new Request(req.url(),{method:req.method(),headers:req.headers(),...(req.postData()?{body:req.postData()}: {})}),op,params)
    const data=await r.json();calls.push({op,status:r.status,id:params.id,key:params.key,phase:data.phase})
    if(data.activity) {const json=JSON.stringify(data);for(const key of ['"answer":','sourceAnswer','correctPosition','explanation','"snapshot"']) if(json.includes(key)) leaks.push(key)}
    if(op==='review' && reviewIssue==='missing') {reviewIssue=null;data.questions=[]}
    if(op==='review' && reviewIssue==='render') {reviewIssue=null;data.questions[0].analysis.explanation={invalid:'content shape'}}
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
const output=path.join(os.tmpdir(),'auctor-bootcamp-acceptance');await mkdir(output,{recursive:true})
let checks=0
const check=(condition,message)=>{assert.ok(condition,message);checks++;console.log('PASS',message)}
async function click(name) {await page.getByRole('button',{name,exact:true}).click()}

async function seedActive(key) {
  await page.waitForLoadState('networkidle');await page.goto('about:blank')
  await h.close(); h=await harness(source)
  await h.service.enroll(student)
  let state=await h.service.start(student)
  state=await h.service.coach(student,state.id)
  state=await h.service.act(student,state.id,'advance',{revision:state.revision})
  for(const current of ['warmup','rc1','rc2','rc3','va']) {
    state=await h.service.act(student,state.id,'block_start',{key:current,revision:state.revision})
    if(current===key) return state
    state=await h.service.act(student,state.id,'finish',{key:current,revision:state.revision})
    state=await h.service.act(student,state.id,'advance',{revision:state.revision,reviewed:true})
  }
}
async function submit(key) {
  const state=await seedActive(key)
  await page.goto(base+'/boot-camp/day/1')
  await click('Finish this block early'); await click('Finish and review')
  return state
}
try {
  const next={rc1:['Continue to RC 2','RC 2','rc2'],rc2:['Continue to RC 3','RC 3','rc3'],rc3:['Continue to Verbal Ability','Verbal Ability','va'],va:['Continue to Day Report']}
  for(const key of Object.keys(next)) {
    const state=await submit(key)
    await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
    check(new URL(page.url()).pathname==='/boot-camp/day/1',key+': review renders in the correct day route')
    check(calls.some(c=>c.op==='finish'&&c.id===state.id&&c.key===key&&c.phase==='review'),key+': click handler submits the correct attempt and block')
    check(calls.some(c=>c.op==='review'&&c.id===state.id&&c.key===key&&c.status===200),key+': matching authorized review data loads')
    check((await h.service.home(student)).attempt.phase==='review',key+': review load leaves saved state at review')
    check(await page.getByRole('button',{name:next[key][0],exact:true}).isEnabled(),key+': continuation is ready without coaching')
    const review=await h.service.review(student,state.id,key)
    for(let index=0;index<review.questions.length;index++) {
      await page.getByRole('button',{name:new RegExp('^Question '+(index+1)+':')}).click()
      await click('View full question analysis')
      await page.getByRole('dialog',{name:'Detailed question analysis'}).waitFor()
      check(await page.getByRole('dialog').getByText(review.questions[index].text,{exact:true}).isVisible(),key+': detailed question '+(index+1)+' opens')
      await click('Back to review')
    }
    if(review.passage) {
      await click('Open detailed passage analysis')
      await page.getByRole('dialog',{name:'Detailed passage analysis'}).waitFor()
      await page.getByRole('dialog').getByRole('button',{name:'Blueprint',exact:true}).click()
      check(await page.getByRole('dialog').getByText(review.passageAnalysis.coreTheme,{exact:true}).isVisible(),key+': detailed passage opens')
      await click('Back to review')
    }
    await page.reload();await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
    check((await h.service.home(student)).attempt.phase==='review',key+': refresh preserves review checkpoint')
    await click(next[key][0])
    if(key==='va') {
      await page.getByRole('heading',{name:'DAY 01 COMPLETE',exact:true}).waitFor()
      check((await h.service.home(student)).attempt.status==='completed','VA Continue completes the day')
      await click('See my Day 01 report');await page.waitForURL('**/boot-camp/day/1/report')
    } else {
      await page.getByRole('button',{name:'Start '+next[key][1],exact:true}).waitFor()
      check((await h.service.home(student)).attempt.currentBlock===next[key][2],key+': single Continue reaches the correct next block')
    }
  }
  check(unexpectedCoach===0,'no review path depends on a coaching API request')
  check(errors.length===0,'all RC and VA reviews and detail dialogs render without browser exceptions')
  for(const issue of ['network','missing']) {
    reviewIssue=issue
    await submit('rc1')
    await page.getByRole('alert').filter({hasText:issue==='network'?'Review could not be loaded':'Review data is missing'}).waitFor()
    check(await page.getByText('Preparing your detailed review...', {exact:true}).count()===0,issue+': failed loading is replaced by an explicit error')
    check((await h.service.home(student)).attempt.phase==='review',issue+': failure does not advance saved progress')
    await click('Reload saved progress');await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
    check(await page.getByRole('button',{name:'Continue to RC 2',exact:true}).isEnabled(),issue+': retry restores a working review')
  }
  // Existing students may have been left at the old automatic commentary checkpoint.
  let state=await seedActive('va')
  state=await h.service.act(student,state.id,'finish',{key:'va',revision:state.revision})
  await h.service.act(student,state.id,'advance',{revision:state.revision})
  await page.goto(base+'/boot-camp/day/1');await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
  check(await page.getByRole('button',{name:'Continue to Day Report',exact:true}).isEnabled(),'old VA commentary checkpoint resumes as a working review')
  await click('Continue to Day Report');await page.getByRole('heading',{name:'DAY 01 COMPLETE',exact:true}).waitFor()
  reviewIssue='render';await submit('rc1');await page.getByRole('alert').filter({hasText:'could not be displayed'}).waitFor()
  check((await h.service.home(student)).attempt.phase==='review','render error preserves saved progress and shows a recovery action')
  await click('Reload saved progress');await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
  check(await page.getByRole('button',{name:'Continue to RC 2',exact:true}).isEnabled(),'retry recovers from a caught rendering exception')
  await writeFile(path.join(output,'review-regression-results.json'),JSON.stringify({checks,calls,unexpectedCoach,errors},null,2))
  console.log('Review regression passed:',checks,'checks')
} catch(e) {await page.screenshot({path:path.join(output,'review-regression-failure.png'),fullPage:true}).catch(()=>{});console.error('Browser exceptions:',JSON.stringify(errors));console.error('Recent requests:',JSON.stringify(calls.slice(-12)));throw e}
finally {await browser.close();await h.close()}
