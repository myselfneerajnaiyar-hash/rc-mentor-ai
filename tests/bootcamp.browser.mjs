// Production UI + actual Boot Camp handlers + local PostgreSQL; no live data writes.
import { chromium } from 'playwright-core'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import dotenv from 'dotenv'
import { harness,student,other,fixture } from './helpers/bootcamp-db.mjs'
const base=process.env.BOOTCAMP_TEST_BASE_URL || 'http://localhost:3111'
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname))
const source=process.env.BOOTCAMP_SOURCE_FILE ? JSON.parse(await readFile(process.env.BOOTCAMP_SOURCE_FILE,'utf8')) : fixture()
const firstPassageId=source.document.content.passages[0].id
const vocabulary=source.document.enrichment[firstPassageId].vocabulary ||= []
vocabulary.push({word:'intellectual illusion',contextualMeaning:'A belief that simplicity is self-evidently superior despite hidden complexity.',whyAuthorUsedIt:'Names the mistaken confidence the passage examines.'})
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
await ctx.addInitScript(({ref,session})=>localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session)),{ref,session})
const errors=[],leaks=[],calls=[]
let failNextAnswer=false, failNextChat=false
await ctx.route('**/*',async route=> {
  const req=route.request(),url=new URL(req.url())
  const fulfill=(json,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(json)})
  if(url.pathname.startsWith('/api/bootcamp')) {
    const suffix=url.pathname.slice('/api/bootcamp'.length),parts=suffix.split('/').filter(Boolean)
    const params={id:parts[0]==='attempts'?parts[1]:undefined,key:parts[2]==='blocks'?parts[3]:undefined}
    const op=suffix===''?'home':suffix==='/chat'?'chat':suffix==='/enroll'?'enroll':suffix==='/days/1/start'?'start':parts[2]==='blocks'?({start:'block_start',responses:'responses',finish:'finish',review:'review'})[parts[4]]:parts[2]||'get'
    if(op==='chat' && failNextChat){failNextChat=false;return fulfill({error:'Birbal could not reply just now. Please retry your message.'},503)}
    if (op==='responses' && failNextAnswer && Object.hasOwn(JSON.parse(req.postData() || '{}'),'response')) { failNextAnswer=false; return fulfill({error:'Temporary test connection failure. Please retry.'},503) }
    const r=await h.handle(new Request(req.url(),{method:req.method(),headers:req.headers(),...(req.postData()?{body:req.postData()}: {})}),op,params)
    const data=await r.json();calls.push({op,status:r.status})
    if(data.activity) {const json=JSON.stringify(data);for(const key of ['"answer":','sourceAnswer','correctPosition','explanation','"snapshot"']) if(json.includes(key)) leaks.push(key)}
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
async function click(name) {await page.getByRole('button',{name,exact:true}).first().click()}
try {
  await page.goto(base+'/boot-camp');await page.getByRole('link',{name:/Start Day 01/}).waitFor()
  const calendar=page.locator('#bootcamp-calendar')
  await calendar.getByRole('button',{name:/SHOW MORE DAYS/}).click()
  check(await calendar.getByRole('table').count()===1,'only one month is visible')
  check(await calendar.locator('[data-training-day]').count()===27,'October shows training days 1 through 27 on the fixed Oct 5 start calendar')
  check(await calendar.getByRole('link').count()===1,'only Day 1 is actionable')
  await page.getByRole('tab',{name:'November 2026',exact:true}).click()
  await calendar.getByRole('button',{name:/SHOW MORE DAYS/}).click()
  check(await calendar.locator('[data-training-day]').count()===18,'November shows the remaining scheduled training days in the 45-day calendar')
  check(await calendar.getByRole('link').count()===0,'future month has no actionable days')
  await page.getByRole('tab',{name:'October 2026',exact:true}).click()
  await page.screenshot({path:path.join(output,'00-arena-desktop.png'),fullPage:true})
  await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile arena has no overflow')
  await page.screenshot({path:path.join(output,'00-arena-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000})
  await click('Talk to Birbal');await page.getByRole('dialog',{name:'Boot Camp conversation with Birbal'}).waitFor()
  await page.getByRole('textbox',{name:'Message Birbal'}).fill('What is today?s plan?');await click('Send message')
  await page.getByText('Your training starts with five warm-up questions, followed by three RC passages and verbal ability.',{exact:true}).waitFor()
  check(chatEvidence.at(-1).context.day.status==='not_started','landing chat uses actual not-started context')
  check((await h.service.home(student)).attempt===null,'talking to Birbal does not create an attempt')
  await click('Close Birbal conversation');await page.getByRole('link',{name:/Start Day 01/}).click()
  await page.getByRole('heading',{name:/Day 01.*Your Training Mission/}).waitFor()
  check(await page.getByRole('heading',{name:/Your training is ready/}).count()===0,'day opens directly on its training mission')
  await page.getByRole('button',{name:/Begin Day 1/}).waitFor()
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:width===1440?1000:844})
    const coach=page.getByRole('region',{name:"Birbal's coaching note"})
    const coachBox=await coach.boundingBox()
    const portrait=await coach.locator('img').boundingBox()
    check(coachBox.width<=760&&portrait.width<=44&&portrait.height<=44,`Birbal note stays compact at ${width}px`)
    check(await page.getByRole('button',{name:/Begin Day 1/}).isVisible(),`Day 1 remains immediately actionable at ${width}px`)
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`mission has no horizontal overflow at ${width}px`)
  }
  await page.getByRole('button',{name:"Dismiss Birbal's message"}).click()
  await page.getByRole('button',{name:'Show Birbal’s message'}).click()
  await page.screenshot({path:path.join(output,'01-mission.png'),fullPage:true,animations:'disabled'})
  await page.setViewportSize({width:1440,height:1000})
  await page.getByRole('button',{name:/Begin Day 1/}).click();await page.getByRole('button',{name:/Start Warm-up/}).click()
  let live=(await h.service.home(student)).attempt
  await page.reload();await page.getByRole('heading',{name:'Warm-up',exact:true}).waitFor()
  check((await h.service.home(student)).attempt.id===live.id,'refresh resumes the same warm-up attempt');await page.goto(base+'/boot-camp');await page.getByRole('link',{name:'Continue Day 01',exact:true}).click();await page.getByRole('heading',{name:'Warm-up',exact:true}).waitFor();check((await h.service.home(student)).attempt.id===live.id,'calendar continues the existing attempt')
  const blocks=[{key:'warmup',questions:source.document.content.warmup},...source.document.content.passages.map((p,i)=>({key:`rc${i+1}`,questions:p.questions})),{key:'va',questions:source.document.content.verbalAbility}]
  for(const [bi,block] of blocks.entries()) {
    if(bi>0) await click(`Start ${block.key==='va'?'Verbal Ability':`RC ${bi}`}`)
    if(bi===1) {
      const before=(await h.service.home(student)).attempt.activity.deadline_at
      await page.reload();await page.getByRole('heading',{name:'RC 1',exact:true}).waitFor()
      check((await h.service.home(student)).attempt.activity.deadline_at===before,'RC deadline survives refresh')
      await page.screenshot({path:path.join(output,'02-rc-desktop.png'),fullPage:true,animations:'disabled'})
    }
    for(const [qi,q] of block.questions.entries()) {
      await page.getByRole('heading',{name:q.text,exact:true}).waitFor()
      if(['Para Jumble','Odd Sentence Out'].includes(q.type)) {
        const sentences=page.getByRole('list',{name:'Numbered sentences'});
        for(const sentence of q.sentences)check(await sentences.getByRole('listitem').filter({hasText:sentence.text}).locator('span').first().innerText()===String(sentence.number),q.type+' stable visible sentence '+sentence.number);
        await page.screenshot({path:path.join(output,'numbered-'+q.type.replaceAll(' ','-')+'-'+qi+'.png'),fullPage:true});
      }
      if(q.mode==='MCQ') {
        const choice=q.options.find(o=>o.id===q.answer)
        await page.getByRole('button',{name:`${choice.id} ${choice.text}`,exact:true}).click()
      } else if(q.type==='Para Jumble') {for(const n of q.answer) await click(String(n))}
      else await click(q.type==='Sentence Placement'?`[${q.answer}]`:String(q.answer))
      await page.getByRole('status').filter({hasText:'Answer saved'}).waitFor()
      if(q.id==='bootcamp-day-1-va-q5')check((await h.service.home(student)).attempt.activity.responses[qi].response===4,'VA Q5 saves displayed slot [4] as integer 4')
      if(qi<block.questions.length-1)await click('Next question →')
    }
    const label=block.key==='warmup'?'Warm-up':block.key==='va'?'Verbal Ability':`RC ${bi}`
    await click(`Finish ${label}`);await click('Finish and review')
    await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
    await page.getByRole('button',{name:['Continue to RC 1','Continue to RC 2','Continue to RC 3','Continue to Verbal Ability','Continue to Day Report'][bi],exact:true}).waitFor();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Continue to')&&!b.disabled));
    live=(await h.service.home(student)).attempt
    const review=await h.service.review(student,live.id,block.key)
    check(review.result.correct===block.questions.length,`${label}: saved score and detailed review`)
    if(bi===0) {await page.reload();await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor();check((await h.service.home(student)).attempt.phase==='review','refresh resumes integrated review')}
    if(bi===0 || bi===4) {
      for(const width of [1440,390]) {
        await page.setViewportSize({width,height:width===1440?1000:844});
        for(const qi of bi===0?[0]:[0,2,4,6]) {
          await page.getByRole('button',{name:'Question '+(qi+1)+': Correct',exact:true}).click();
          check(await page.getByRole('region',{name:'Question evidence'}).isVisible(),label+' shared question panel');
          check(await page.getByRole('complementary').isVisible(),label+' shared Birbal panel');
          check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no overflow '+width);
          await page.screenshot({path:path.join(output,'shared-'+block.key+'-'+qi+'-'+width+'.png'),fullPage:true});
          await click('View full question analysis');await page.getByRole('dialog',{name:'Detailed question analysis'}).waitFor();await click('Back to review');
        }
      }
      await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Question 1: Correct',exact:true}).click();
    }
    if(bi>=1 && bi<=3) {
      check(await page.getByRole('region',{name:'Question evidence'}).isVisible(),`${label}: evidence workspace present`)
      check(await page.getByRole('complementary',{name:'Birbal’s interpretation'}).isVisible(),`${label}: trainer beside evidence`)
      check(await page.getByRole('region',{name:'Full passage'}).count()===0,`${label}: full passage is collapsed initially`)
      for(const [qi,q] of review.questions.entries()) {
        await page.getByRole('button',{name:`Question ${qi+1}: Correct`,exact:true}).click()
        for(const o of q.options)check(await page.getByLabel('All answer options').getByText(o.text,{exact:true}).isVisible(),`${label} Q${qi+1}: option ${o.id} visible`)
        for(const [ei,e] of q.analysis.evidence.entries()) {
          if(q.analysis.evidence.length>1)await page.getByRole('button',{name:`Evidence ${ei+1}`,exact:true}).click()
          check(await page.getByRole('region',{name:'Question evidence'}).getByText(e.explanation,{exact:true}).isVisible(),`${label} Q${qi+1}: evidence retained`)
        }
        check(await page.getByRole('complementary',{name:'Birbal’s interpretation'}).getByText(`On question ${qi+1}, you chose ${q.response}. This answer was correct.`,{exact:true}).isVisible(),`${label} Q${qi+1}: trainer follows selected question`)
      }
      await page.getByRole('button',{name:'Question 1: Correct',exact:true}).click()
      if(bi===1) {
        await page.getByRole('region',{name:'Question evidence'}).getByRole('button',{name:'View full passage',exact:true}).click();check(await page.getByRole('region',{name:'Full passage'}).isVisible(),'full passage opens in a bounded pane');await click('Hide full passage')
        await click('View full question analysis');await page.getByRole('dialog',{name:'Detailed question analysis'}).waitFor();check(await page.getByRole('dialog').getByText('Option Autopsy',{exact:true}).isVisible(),'existing shared question analysis remains available');await click('Back to review')
        check(await page.getByRole('region',{name:'Passage debrief'}).isVisible(),'passage debrief is expanded by default');await click('Open detailed passage analysis')
        const detail=page.getByRole('dialog',{name:'Detailed passage analysis'})
        check(await detail.getByRole('navigation',{name:'Detailed review sections'}).getByRole('button').count()===5,'all five shared passage review tabs retained')
        await detail.getByRole('button',{name:'Blueprint',exact:true}).click();check(await detail.getByText(review.passageAnalysis.coreTheme,{exact:true}).isVisible(),'authored blueprint retained')
        await detail.getByRole('button',{name:'Paragraphs',exact:true}).click();await detail.getByRole('button',{name:'Paragraph 1',exact:true}).click();if(review.passageAnalysis.passageFlow.length) check(await detail.getByText(review.passageAnalysis.passageFlow[0].simpleExplanation,{exact:true}).isVisible(),'paragraph meaning retained'); else check(await detail.getByText(review.passage.text,{exact:true}).isVisible(),'original paragraph retained when enrichment has no paragraph explanation')
        await detail.getByRole('button',{name:'Vocabulary',exact:true}).click();check(await detail.getByText('intellectual illusion',{exact:true}).isVisible(),'authored vocabulary appears in the detailed passage review');await click('Back to review')
        check((await page.getByRole('region',{name:'Passage debrief'}).boundingBox()).width>1000,'passage debrief spans the desktop workspace')
        await page.screenshot({path:path.join(output,'02-rc-workspace-desktop.png'),fullPage:true})
        check((await page.getByRole('region',{name:'Passage debrief'}).boundingBox()).height>200,'passage lesson has substantial space')
        await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'review workspace fits mobile');await page.screenshot({path:path.join(output,'02-rc-review-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000})
      }
    }
    if(bi<4) {check(await page.getByLabel('All answer options').locator(':scope > div').count()===4,`${label}: all four options visible`);check(await page.getByText(`Skill: ${review.questions[0].analysis.primarySkill}`,{exact:false}).isVisible(),`${label}: authoritative skill visible`)}
    if(bi===4) {await page.getByRole('button',{name:'Question 3: Correct',exact:true}).click();check(await page.getByLabel('All answer options').locator(':scope > div').count()===4,'Para Summary reuses shared MCQ review with all options');await page.getByRole('button',{name:'Question 5: Correct',exact:true}).click();await click('View full question analysis');await page.getByRole('button',{name:'What should you have noticed?',exact:true}).click();await page.getByRole('heading',{name:'Why position [4] fits',exact:true}).waitFor();await page.screenshot({path:path.join(output,'03-va-review.png'),fullPage:true,animations:'disabled'});await click('Back to review')}
    if(bi===1) {
      await page.getByRole('button',{name:'Question 3: Correct',exact:true}).click()
      const beforeChat=(await h.service.home(student)).attempt
      await click('Ask Birbal');await page.getByRole('textbox',{name:'Message Birbal'}).fill('Why did I get Q3 wrong?')
      failNextChat=true;await click('Send message');await page.getByRole('alert').filter({hasText:'Please retry your message'}).waitFor()
      check(await page.getByRole('textbox',{name:'Message Birbal'}).inputValue()==='Why did I get Q3 wrong?','failed chat retains the question for retry')
      await click('Send message');await page.getByText(`Let's discuss RC 1, question 3. Your saved answer was ${review.questions[2].response}.`,{exact:true}).waitFor()
      const supplied=chatEvidence.at(-1).context
      check(supplied.currentQuestion.number===3 && supplied.currentQuestion.id===review.questions[2].id && supplied.currentQuestion.confidence===undefined,'chat is anchored to the selected Q3 without generic confidence boilerplate')
      check(supplied.focus.key==='rc1' && supplied.focus.questions.length===4 && !!supplied.focus.passageEnrichment,'Ask Birbal supplies the exact completed RC block')
      check(supplied.focus.questions[2].answer===review.questions[2].answer && supplied.focus.questions[2].analysis.evidence.length>0,'chat receives Q3 answer and evidence from protected server review')
      await page.getByRole('textbox',{name:'Message Birbal'}).fill('Which evidence supports that?');await click('Send message')
      await page.getByRole('button',{name:'Send message'}).isDisabled()
      await page.waitForFunction(()=>document.querySelector('input[aria-label="Message Birbal"]')?.value==='')
      await page.getByText(`Let's discuss RC 1, question 3. Your saved answer was ${review.questions[2].response}.`,{exact:true}).nth(1).waitFor()
      check(chatEvidence.at(-1).messages.some(m=>m.content==='Why did I get Q3 wrong?'),'chat follow-up retains conversation context')
      await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Birbal chat fits mobile');await page.screenshot({path:path.join(output,'07-bootcamp-chat-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000})
      await click('Close Birbal conversation');await click('Ask Birbal');check(await page.getByText('Which evidence supports that?',{exact:true}).isVisible(),'closing and reopening preserves this conversation');await page.keyboard.press('Escape')
      check((await h.service.home(student)).attempt.revision===beforeChat.revision,'chat leaves saved phase and revision unchanged')
    }
    check(await page.getByRole('button',{name:/Hear Birbal/}).count()===0,'no intermediate review CTA');
    await page.getByRole('button',{name:['Continue to RC 1','Continue to RC 2','Continue to RC 3','Continue to Verbal Ability','Continue to Day Report'][bi],exact:true}).waitFor()
    if(bi===1) {await page.reload();await page.getByRole('button',{name:'Continue to RC 2',exact:true}).waitFor();check((await h.service.home(student)).attempt.phase==='review','refresh resumes cached Birbal commentary');check(await page.getByRole('button',{name:'Question 3: Correct',exact:true}).getAttribute('aria-current')==='true','selected review question survives reflection and refresh');await page.getByText('What you chose',{exact:true}).waitFor();check(await page.getByText('Why this answer works',{exact:true}).isVisible(),'Birbal reloads reviewed response evidence without a confidence disclaimer')}
    await click(['Continue to RC 1','Continue to RC 2','Continue to RC 3','Continue to Verbal Ability','Continue to Day Report'][bi])
  }
  await page.getByRole('heading',{name:'DAY 01 COMPLETE',exact:true}).waitFor();
  check(await page.getByRole('region',{name:'Training complete'}).isVisible(),'completion celebration follows successful Day 1 completion');
  await page.waitForTimeout(2600);
  check(new URL(page.url()).pathname==='/boot-camp/day/1','settled celebration waits for explicit report click');
  check(await page.getByRole('region',{name:'Training complete'}).isVisible(),'celebration stays mounted after report coaching completes');
  await page.emulateMedia({reducedMotion:'reduce'});
  check(await page.locator('[aria-label="Training complete"] > [aria-hidden="true"]').evaluate(el=>getComputedStyle(el).display)==='none','reduced motion suppresses particles');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:390,height:844});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'completion fits mobile without horizontal overflow');
  await page.screenshot({path:path.join(output,'completion-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  const resumed=await ctx.newPage();
  await resumed.goto(base+'/boot-camp/day/1');
  await resumed.waitForURL('**/boot-camp/day/1/report');
  await resumed.getByRole('tab',{name:'debrief',exact:true}).waitFor();
  check(await resumed.getByRole('region',{name:'Training complete'}).count()===0,'resuming the completed day during celebration does not replay it');
  await resumed.close();
  await page.screenshot({path:path.join(output,'report-celebration.png'),fullPage:true,animations:'disabled'});await click('See my Day 01 report');
  await page.getByRole('heading',{name:'Day 1 results',exact:true}).waitFor()
  const final=(await h.service.home(student)).attempt
  check(final.report.score===25 && final.report.coverage===100 && final.report.accuracy===100,'complete Day 1 report reconciles all 25 answers')
  const reflection=page.locator('[aria-label="Day 1 training report"] [class*="advice"]')
  check(await reflection.evaluate(el=>{const children=[...el.children];return children[0]?.textContent.includes('BIRBAL’S BLOCK REFLECTION')&&children[1]?.tagName==='P'&&children[2]?.textContent.includes('Ask Birbal')}),'Ask Birbal appears immediately below Birbal’s block reflection')
  await page.waitForURL('**/boot-camp/day/1/report');
  check(await page.getByRole('link',{name:/Go to today's mission/}).count()===0,'Day 2 stays unavailable');
  await click('Ask Birbal');await page.getByRole('textbox',{name:'Message Birbal'}).fill('Compare RC1 and VA. What should I focus on tomorrow?');await click('Send message');
  await page.getByText('Your training starts with five warm-up questions, followed by three RC passages and verbal ability.',{exact:true}).waitFor();
  const dayChat=chatEvidence.at(-1).context;
  check(dayChat.dayEvidence.length===5 && dayChat.dayEvidence.flatMap(b=>b.questions).length===25,'report chat receives all five blocks and 25 complete questions');
  check(dayChat.focus===null && dayChat.dayEvidence[1].passage.text && dayChat.dayEvidence[4].questions[0].analysis.explanation,'report chat uses full-day evidence, not a VA-only focus');
  check((await h.service.home(student)).attempt.revision===final.revision,'report chat does not mutate progress');await click('Close Birbal conversation')
  check(await page.getByRole('tab',{name:'debrief',exact:true}).getAttribute('aria-selected')==='true','report defaults to Debrief');
  await page.evaluate(()=>window.scrollTo(0,0))
  const reportLayout=page.locator('[aria-label="Day 1 training report"] [class*="layout"]')
  const desktopColumns=await reportLayout.evaluate(el=>{const box=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {layout:box(el),left:box(el.querySelector('[class*="main"]')),strengths:box(el.querySelector('[class*="strengths"]')),advice:box(el.querySelector('[class*="advice"]'))}})
  check(desktopColumns.advice.x>desktopColumns.strengths.x&&desktopColumns.advice.y<=desktopColumns.strengths.y+2,'Birbal reflection sits beside Strengths in the right column')
  check(desktopColumns.advice.width<desktopColumns.layout.width&&desktopColumns.advice.height<desktopColumns.left.height,'right reflection stays compact instead of spanning the left content')
  await page.getByRole('tab',{name:'analytics',exact:true}).click();
  for(const label of ['Block accuracy chart','Question type accuracy chart','Block elapsed activity time chart'])check(await page.getByRole('img',{name:label,exact:true}).isVisible(),label+' rendered');
  const trapPanel=page.getByRole('region',{name:'Selected distractor traps'})
  check(await trapPanel.isVisible()&&await trapPanel.getByText('No incorrect selected options had a categorized trap in this session.',{exact:true}).isVisible(),'analytics reports the truthful empty state when no incorrect trap was selected')
  check(await page.getByRole('img',{name:'Overall accuracy: 100%',exact:true}).isVisible(),'accuracy visual uses saved result');
  await page.locator('summary').filter({hasText:'Explore the detailed data'}).click();check(await page.getByRole('region',{name:'Detailed block results'}).getByRole('row').count()===6,'five blocks remain available in supporting table');
  await page.screenshot({path:path.join(output,'report-analytics-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile analytics has no page overflow');await page.screenshot({path:path.join(output,'report-analytics-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await page.getByRole('tab',{name:'debrief',exact:true}).click();
  await page.screenshot({path:path.join(output,'04-report-desktop.png'),fullPage:true,animations:'disabled'})
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{window.scrollTo(0,0);document.body.scrollTo(0,0)});await page.screenshot({path:path.join(output,'05-report-mobile.png'),fullPage:true,animations:'disabled'})
  const mobileColumns=await reportLayout.evaluate(el=>{const box=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {layout:box(el),left:box(el.querySelector('[class*="main"]')),advice:box(el.querySelector('[class*="advice"]'))}})
  check(mobileColumns.advice.y>=mobileColumns.left.y+mobileColumns.left.height-1&&mobileColumns.advice.width<=mobileColumns.layout.width,'mobile stacks Birbal below the report content without horizontal overflow')
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile report has no horizontal overflow')
  await page.reload();await page.getByRole('heading',{name:'Day 1 results',exact:true}).waitFor()
  check((await h.service.home(student)).attempt.report.score===25,'completed report survives refresh');check(await page.getByRole('region',{name:'Training complete'}).count()===0,'returning to report does not replay celebration');await page.goto(base+'/boot-camp');await page.getByRole('link',{name:'View Day 01 Report',exact:true}).click();await page.getByRole('heading',{name:'Day 1 results',exact:true}).waitFor();check((await h.service.home(student)).attempt.report.score===25,'completed calendar returns to the saved report')
  check(leaks.length===0,'activity responses contain no protected keys or analysis')
  check(errors.length===0,'no browser JavaScript exceptions')
  await assert.rejects(h.service.get(other,final.id));check(true,'another authenticated student cannot read the attempt')
  check(h.calls.every(c=>c.name?.startsWith('bootcamp_')||c.table?.startsWith('bootcamp_')),'all persistence calls stay inside Boot Camp')
  await h.close(); h=await harness(source)
  await page.goto(base+'/boot-camp/day/1')
  await page.getByRole('heading',{name:/Day 01.*Your Training Mission/}).waitFor();await page.getByRole('button',{name:/Begin Day 1/}).click();await page.getByRole('button',{name:/Start Warm-up/}).click()
  const warm=source.document.content.warmup
  const wrong=warm[0].options.find(o=>o.id!==warm[0].answer)
  failNextAnswer=true
  await page.getByRole('button',{name:wrong.id+' '+wrong.text,exact:true}).click()
  await page.getByRole('button',{name:'Retry sync',exact:true}).waitFor()
  check((await h.service.home(student)).attempt.activity.responses[0].response===null,'failed save is not falsely recorded')
  await click('Retry sync');await page.getByRole('status').filter({hasText:'Answer saved'}).waitFor()
  check((await h.service.home(student)).attempt.activity.responses[0].response===wrong.id,'retry preserves and saves the chosen answer')
  await click('Next question →')
  const right=warm[1].options.find(o=>o.id===warm[1].answer)
  await page.getByRole('button',{name:right.id+' '+right.text,exact:true}).click()
  await page.getByRole('status').filter({hasText:'Answer saved'}).waitFor()
  await click('← Previous');
  await page.getByRole('heading',{name:warm[0].text,exact:true}).waitFor()
  await page.reload();await page.getByRole('heading',{name:warm[0].text,exact:true}).waitFor()
  check((await h.service.home(student)).attempt.activity.current_question===0,'refresh resumes a revisited question')
  await click('Next question →');await click('Next question →')
  await click('Finish this block early');await click('Finish and review')
  await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
  let edge=(await h.service.home(student)).attempt
  check(JSON.stringify((await h.service.review(student,edge.id,'warmup')).questions.map(q=>q.outcome))===JSON.stringify(['incorrect','correct','skipped','not_reached','not_reached']),'manual finish distinguishes incorrect, correct, skipped and not reached')
  check(await page.getByLabel('All answer options').getByText(wrong.text,{exact:true}).isVisible(),'incorrect selected option remains visible in shared review');
  check(await page.getByRole('button',{name:/Hear Birbal/}).count()===0,'no intermediate review CTA');await page.getByText('What you chose',{exact:true}).waitFor();check(await page.getByText(`On question 1, you chose ${wrong.id}. This answer was incorrect.`,{exact:true}).isVisible(),'Birbal observation uses actual incorrect response');await click('Continue to RC 1');await click('Start RC 1')
  const rc=source.document.content.passages[0].questions[0], option=rc.options.find(o=>o.id===rc.answer)
  await page.getByRole('button',{name:option.id+' '+option.text,exact:true}).click()
  await page.getByRole('status').filter({hasText:'Answer saved'}).waitFor();await click('Next question →')
  edge=(await h.service.home(student)).attempt
  await h.pg.query("update bootcamp_block_attempts set state=jsonb_set(state,'{deadline_at}',to_jsonb(clock_timestamp()+interval '2 seconds')) where day_attempt_id=$1 and block_key='rc1'",[edge.id])
  await page.reload();await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
  check(JSON.stringify((await h.service.review(student,edge.id,'rc1')).questions.map(q=>q.outcome))===JSON.stringify(['correct','timed_out','not_reached','not_reached']),'browser timeout keeps saved answers and distinguishes timed out from unseen')
  await page.getByRole('button',{name:'Question 2: Timed out',exact:true}).click();check(await page.getByText('Timed out',{exact:true}).isVisible(),'shared review preserves timed-out status');await page.getByRole('button',{name:'Question 3: Not reached',exact:true}).click();check(await page.getByText('Not reached',{exact:true}).isVisible(),'shared review preserves not-reached status');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile review has no horizontal overflow')
  await page.screenshot({path:path.join(output,'06-timeout-mobile.png'),fullPage:true,animations:'disabled'})
  check(errors.length===0,'edge-case journey has no browser exceptions')
  // A mixed RC result exercises the selected wrong-answer workspace independently.
  await h.close();h=await harness(source,undefined,async(context,messages)=>{chatEvidence.push({context,messages});return `Question ${context.currentQuestion.number}: your saved response was ${context.focus.questions[context.currentQuestion.number-1].response}.`})
  await h.service.enroll(student);let mixed=await h.service.start(student)
  mixed=await h.service.coach(student,mixed.id)
  const act=async(action,input={})=>mixed=await h.service.act(student,mixed.id,action,{revision:mixed.revision,...input})
  await act('advance');await act('block_start',{key:'warmup'})
  for(const q of source.document.content.warmup)await act('responses',{key:'warmup',questionId:q.id,presented:true,response:q.answer})
  await act('finish',{key:'warmup'});await act('advance');mixed=await h.service.coach(student,mixed.id);await act('advance');await act('block_start',{key:'rc1'})
  const mixedQuestions=source.document.content.passages[0].questions
  for(const [i,q] of mixedQuestions.entries())await act('responses',{key:'rc1',questionId:q.id,presented:true,response:i===1||i===2?q.options.find(o=>o.id!==q.answer).id:q.answer})
  await act('finish',{key:'rc1'})
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/boot-camp/day/1');await page.getByRole('heading',{name:'Make the reasoning yours.',exact:true}).waitFor()
  for(const [i,status] of ['Correct','Incorrect','Incorrect','Correct'].entries()) {await page.getByRole('button',{name:`Question ${i+1}: ${status}`,exact:true}).click();check(await page.getByRole('region',{name:'Question evidence'}).getByText(status,{exact:true}).isVisible(),`mixed Q${i+1} shows saved ${status} outcome`)}
  await page.getByRole('button',{name:'Question 3: Incorrect',exact:true}).click()
  const savedMixed=await h.service.review(student,mixed.id,'rc1'),wrongQ=savedMixed.questions[2]
  check(await page.getByRole('complementary',{name:'Birbal’s interpretation'}).getByText(`On question 3, you chose ${wrongQ.response}. This answer was incorrect.`,{exact:true}).isVisible(),'Q3 wrong-answer observation matches saved response')
  check(await page.getByRole('region',{name:'Question evidence'}).getByText(wrongQ.options.find(o=>o.id===wrongQ.answer).text,{exact:true}).isVisible(),'correct option remains visible beside the wrong response')
  await page.screenshot({path:path.join(output,'08-rc1-q3-wrong-desktop.png'),fullPage:true})
  await click('Ask Birbal');await page.getByRole('textbox',{name:'Message Birbal'}).fill('Why was my answer wrong?');await click('Send message');await page.getByText(`Question 3: your saved response was ${wrongQ.response}.`,{exact:true}).waitFor()
  check(chatEvidence.at(-1).context.currentQuestion.number===3 && chatEvidence.at(-1).context.currentQuestion.observation.includes('incorrect'),'unqualified chat question targets selected incorrect Q3')
  await page.screenshot({path:path.join(output,'09-review-chat-drawer.png'),fullPage:false});await click('Close Birbal conversation')
  check(await page.getByRole('button',{name:/Hear Birbal/}).count()===0,'no intermediate review CTA');await page.getByRole('button',{name:'Continue to RC 2',exact:true}).waitFor()
  await page.screenshot({path:path.join(output,'10-rc1-reflection-desktop.png'),fullPage:true})
  check(await page.getByRole('region',{name:'Passage debrief'}).isVisible(),'passage lesson remains expanded alongside reflection')
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'11-rc1-q3-mobile.png'),fullPage:true});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mixed review fits 390px mobile')
  await page.evaluate(()=>window.scrollTo(0,0));const actionBox=await page.getByRole('button',{name:'Continue to RC 2',exact:true}).boundingBox();check(actionBox.y>=0 && actionBox.y+actionBox.height<=844,'mobile continuation is reachable without scrolling')
  await click('Continue to RC 2');await page.getByRole('button',{name:'Start RC 2',exact:true}).waitFor();check((await h.service.home(student)).attempt.currentBlock==='rc2','mixed review continues to RC2 through the existing checkpoints')
  await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,leaks,calls,report:final.report},null,2))
  console.log('Browser acceptance passed:',checks,'checks. Artifacts:',output)
} catch(e) {await page.screenshot({path:path.join(output,'failure.png'),fullPage:true,animations:'disabled'}).catch(()=>{});console.error('Browser calls:',JSON.stringify(calls.slice(-15)));throw e}
finally {await browser.close();await h.close()}
