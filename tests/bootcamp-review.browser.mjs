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
const firstPassageId=source.document.content.passages[0]?.id
source.document.enrichment[firstPassageId].vocabulary ||= [{word:'intellectual illusion',contextualMeaning:'A belief that simplicity is self-evidently superior, despite hidden complexity.',whyAuthorUsedIt:'Names the mistaken confidence the passage examines.'}]
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
let failNextAnswer=false, failNextChat=false, delayNextAnswerMs=0
let reviewIssue=null, unexpectedCoach=0
const responseRequests=[]
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
    if (op==='responses' && req.postData()) {
      const payload=JSON.parse(req.postData())
      if(Object.hasOwn(payload,'response'))responseRequests.push({questionId:payload.questionId,response:payload.response})
      if (failNextAnswer && Object.hasOwn(payload,'response')) { failNextAnswer=false; return fulfill({error:'Temporary test connection failure. Please retry.'},503) }
      if(delayNextAnswerMs && Object.hasOwn(payload,'response')) { const delay=delayNextAnswerMs;delayNextAnswerMs=0;await new Promise(resolve=>setTimeout(resolve,delay)) }
    }
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
  const first=state.activity.questions[0]
  if(first?.mode==='MCQ')await h.service.act(student,state.id,'responses',{key,revision:state.revision,questionId:first.id,presented:true,response:'A'})
  await page.goto(base+'/boot-camp/day/1')
  await click('Finish this block early'); await click('Finish and review')
  return state
}
try {
  await page.goto(base+'/boot-camp/day/1')
  await page.getByRole('heading',{name:/Your Training Mission/}).waitFor()
  const desktopStepper=await page.evaluate(()=>{
    const list=document.querySelector('[class*="workoutSequence"]'),style=getComputedStyle(list,':before'),circle=list.querySelector('[class*="stepNumber"]'),label=list.querySelector('[class*="stepInfo"] h3')
    const listBox=list.getBoundingClientRect(),circleBox=circle.getBoundingClientRect(),labelBox=label.getBoundingClientRect(),lineY=listBox.top+parseFloat(style.top)
    return {steps:list.querySelectorAll('[class*="workoutStep"]').length,horizontal:style.height==='2px'&&style.width!=='2px',circleAboveLine:circleBox.top<=lineY&&circleBox.bottom>=lineY,labelBelowLine:labelBox.top>lineY+4}
  })
  check(desktopStepper.steps===5&&desktopStepper.horizontal&&desktopStepper.circleAboveLine&&desktopStepper.labelBelowLine,'desktop stepper keeps the line behind circles and below readable labels')
  await page.setViewportSize({width:390,height:844})
  const mobileStepper=await page.evaluate(()=>{
    const list=document.querySelector('[class*="workoutSequence"]'),style=getComputedStyle(list,':before'),circle=list.querySelector('[class*="stepNumber"]'),label=list.querySelector('[class*="stepInfo"] h3')
    const listBox=list.getBoundingClientRect(),circleBox=circle.getBoundingClientRect(),labelBox=label.getBoundingClientRect(),lineX=listBox.left+parseFloat(style.left)
    return {steps:list.querySelectorAll('[class*="workoutStep"]').length,vertical:style.width==='2px'&&style.height!=='2px',circleOnLine:Math.abs(circleBox.left+circleBox.width/2-lineX)<3,labelClear:labelBox.left>lineX+18}
  })
  check(mobileStepper.steps===5&&mobileStepper.vertical&&mobileStepper.circleOnLine&&mobileStepper.labelClear,'mobile stepper uses a vertical connector beside readable labels')
  await seedActive('warmup')
  await page.goto(base+'/boot-camp/day/1')
  await page.getByText(/Question 1 of 5/).waitFor()
  const answerStart=Date.now();delayNextAnswerMs=1800
  await page.getByRole('button',{name:/Choice A/}).first().click()
  const answerLatency=Date.now()-answerStart
  check(answerLatency<700&&await page.getByRole('button',{name:/Choice A/}).first().getAttribute('aria-pressed')==='true','answer selection updates immediately while a delayed persistence request is pending')
  const moveStart=Date.now()
  await page.getByRole('button',{name:/Next question/}).click()
  await page.getByText(/Question 2 of 5/).waitFor()
  check(Date.now()-moveStart<700,'Next question remains interactive during the pending response write')
  await page.waitForTimeout(2200)
  const savedWarmup=(await h.service.home(student)).attempt
  check(responseRequests.filter(item=>item.questionId===savedWarmup.activity.questions[0].id).length===1&&savedWarmup.activity.responses[0].response==='A','the latest answer is persisted once after an immediate Next action')

  const vaState=await seedActive('va')
  await page.goto(base+'/boot-camp/day/1')
  await page.getByText(/Question 1 of 8/).waitFor()
  const jumbleId=vaState.activity.questions[0].id
  const priorJumbleWrites=responseRequests.filter(item=>item.questionId===jumbleId).length
  for(const n of ['3','1','4'])await page.getByRole('button',{name:n,exact:true}).first().click()
  await page.waitForTimeout(650)
  const savedVa=(await h.service.home(student)).attempt
  check(responseRequests.filter(item=>item.questionId===jumbleId).length-priorJumbleWrites===1&&JSON.stringify(savedVa.activity.responses[0].response)==='[3,1,4]','rapid parajumble edits are debounced into one persisted final sequence')

  const next={rc1:['Continue to RC 2','RC 2','rc2'],rc2:['Continue to RC 3','RC 3','rc3'],rc3:['Continue to Verbal Ability','Verbal Ability','va'],va:['Continue to Day Report']}
  for(const key of Object.keys(next)) {
    const state=await submit(key)
    await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
    check(new URL(page.url()).pathname==='/boot-camp/day/1',key+': review renders in the correct day route')
    if(key==='rc1') {
      for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
        await page.setViewportSize(viewport)
        const scroll=await page.evaluate(()=>{
          const workspace=document.querySelector('[aria-label$="review workspace"]')
          const evidence=workspace?.querySelector('[class*="evidenceBody"]')
          const trainer=workspace?.querySelector('[class*="trainerBody"]')
          const maxScroll=document.documentElement.scrollHeight-innerHeight
          window.scrollTo(0,Math.min(240,Math.max(0,maxScroll)))
          return {pageMoves:document.documentElement.scrollHeight>innerHeight&&scrollY>0,evidenceOverflow:evidence&&getComputedStyle(evidence).overflowY,trainerOverflow:trainer&&getComputedStyle(trainer).overflowY}
        })
        check(scroll.pageMoves&&scroll.evidenceOverflow==='visible'&&scroll.trainerOverflow==='visible',`RC review scrolls with the document at ${viewport.width}px`)
      }
      await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.scrollTo(0,0))
    }
    check(calls.some(c=>c.op==='finish'&&c.id===state.id&&c.key===key&&c.phase==='review'),key+': click handler submits the correct attempt and block')
    check(calls.some(c=>c.op==='review'&&c.id===state.id&&c.key===key&&c.status===200),key+': matching authorized review data loads')
    check((await h.service.home(student)).attempt.phase==='review',key+': review load leaves saved state at review')
    if(key==='rc1') {
      await page.getByRole('button',{name:'Question 1: Incorrect',exact:true}).click()
      check(await page.getByText('Causal Leap',{exact:true}).count()>=1,'question review displays the authored causal-leap trap')
      check(await page.getByRole('heading',{name:'Why this option was tempting',exact:true}).isVisible(),'question review explains why the selected distractor was tempting')
      check(await page.getByRole('region',{name:'Question evidence'}).getByText('The passage shows an association, but does not establish that peer review causes more accurate forecasts.',{exact:true}).isVisible(),'question review keeps the authored why-it-fails reasoning')
      check(await page.getByRole('heading',{name:'What to notice next time',exact:true}).isVisible(),'question review turns the trap into an actionable next-time rule')
      check(await page.getByText(/stable cognitive weakness|one response is not enough/i).count()===0,'question Birbal review omits repetitive confidence boilerplate')
    }
    check(await page.getByRole('button',{name:next[key][0],exact:true}).isEnabled(),key+': continuation is ready without coaching')
    if(key==='va') {
      const reviewNav=page.getByRole('navigation',{name:'Completed block reviews'}).first()
      await page.getByRole('button',{name:/^Question 3:/}).click()
      for(const block of ['Warm-up','RC1','RC2','RC3','Verbal Ability']) {
        await reviewNav.getByRole('button',{name:block,exact:true}).click()
        await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
        check(await reviewNav.getByRole('button',{name:block,exact:true}).getAttribute('aria-current')==='step',`review navigator highlights ${block}`)
      }
      check(await page.getByRole('button',{name:/^Question 3:/}).getAttribute('aria-current')==='true','switching completed reviews preserves each block’s selected question')
    }
    const desktopFlow=await page.evaluate(()=>({evidence:getComputedStyle(document.querySelector('[class*="evidenceBody"]')).overflowY,trainer:getComputedStyle(document.querySelector('[class*="trainerBody"]')).overflowY,page:document.scrollingElement.scrollHeight>innerHeight}))
    check(desktopFlow.evidence==='visible'&&desktopFlow.trainer==='visible'&&desktopFlow.page,key+': desktop review scrolls as one document')
    await page.setViewportSize({width:390,height:844})
    const mobileFlow=await page.evaluate(()=>({evidence:getComputedStyle(document.querySelector('[class*="evidenceBody"]')).overflowY,trainer:getComputedStyle(document.querySelector('[class*="trainerBody"]')).overflowY,page:document.scrollingElement.scrollHeight>innerHeight}))
    check(mobileFlow.evidence==='visible'&&mobileFlow.trainer==='visible'&&mobileFlow.page,key+': mobile review scrolls as one document')
    await page.setViewportSize({width:1440,height:1000})
    if(key==='rc1') {
      await page.getByRole('region',{name:'Question evidence'}).getByRole('button',{name:'View full passage',exact:true}).click()
      const passageFlow=await page.evaluate(()=>{const passage=document.querySelector('[class*="evidenceBody"] [class*="passage"]');return passage?{overflow:getComputedStyle(passage).overflowY,maxHeight:getComputedStyle(passage).maxHeight}:null})
      check(passageFlow?.overflow==='visible'&&passageFlow.maxHeight==='none','expanded passage flows with the document instead of a nested scroller')
      await page.getByRole('region',{name:'Question evidence'}).getByRole('button',{name:'Hide full passage',exact:true}).click()
    }
    const review=await h.service.review(student,state.id,key)
    for(let index=0;index<review.questions.length;index++) {
      await page.getByRole('button',{name:new RegExp('^Question '+(index+1)+':')}).click()
      await page.getByRole('navigation',{name:'Review questions'}).getByRole('button',{name:'View full question analysis',exact:true}).click()
      await page.getByRole('dialog',{name:'Detailed question analysis'}).waitFor()
      check(await page.getByRole('dialog').getByText(review.questions[index].text,{exact:true}).isVisible(),key+': detailed question '+(index+1)+' opens')
      await click('Back to review')
      if(key==='rc1'&&index===0) {
        await page.getByRole('region',{name:'Question evidence'}).getByRole('button',{name:'View full question analysis',exact:true}).last().click()
        await page.getByRole('dialog',{name:'Detailed question analysis'}).waitFor()
        check(await page.getByRole('dialog').getByText(review.questions[index].text,{exact:true}).isVisible(),'bottom question-analysis action opens the same analysis content')
        await click('Back to review')
      }
    }
    if(review.passage) {
      await click('Open detailed passage analysis')
      await page.getByRole('dialog',{name:'Detailed passage analysis'}).waitFor()
      await page.getByRole('dialog').getByRole('button',{name:'Blueprint',exact:true}).click()
      check(await page.getByRole('dialog').getByText(review.passageAnalysis.coreTheme,{exact:true}).isVisible(),key+': detailed passage opens')
      if(key==='rc1') {
        await page.getByRole('dialog').getByRole('button',{name:'Vocabulary',exact:true}).click()
        check(await page.getByRole('dialog').getByText('intellectual illusion',{exact:true}).isVisible(),'existing authored vocabulary reaches the student RC review')
        check(await page.getByText('Source enrichment availability',{exact:true}).count()===0,'student review hides the source-enrichment diagnostic')
      }
      const desktopScrollOwners=await page.evaluate(()=>[...document.querySelectorAll('[role="dialog"] *')].filter(el=>{const y=getComputedStyle(el).overflowY;return (y==='auto'||y==='scroll')&&el.scrollHeight>el.clientHeight+1}).map(el=>el.className))
      check(desktopScrollOwners.every(name=>String(name).includes('dialogBody')),key+': detailed passage has no nested vertical scroll owner on desktop')
      await page.setViewportSize({width:390,height:844})
      const mobileScrollOwners=await page.evaluate(()=>[...document.querySelectorAll('[role="dialog"] *')].filter(el=>{const y=getComputedStyle(el).overflowY;return (y==='auto'||y==='scroll')&&el.scrollHeight>el.clientHeight+1}).map(el=>el.className))
      check(mobileScrollOwners.every(name=>String(name).includes('dialogBody')),key+': detailed passage has no nested vertical scroll owner on mobile')
      await page.setViewportSize({width:1440,height:1000})
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
