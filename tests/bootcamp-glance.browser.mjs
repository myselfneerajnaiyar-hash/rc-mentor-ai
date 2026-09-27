// Presentation checks against the real report page; no database or live API writes.
import { chromium } from 'playwright-core'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import dotenv from 'dotenv'
import { fixture,student } from './helpers/bootcamp-db.mjs'
import { adaptDay } from '../lib/bootcamp/content.mjs'
import { initialState,transition,publicState,coachKey } from '../lib/bootcamp/session.mjs'
const base=process.env.BOOTCAMP_TEST_BASE_URL || 'http://localhost:3111'
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname))
function sample(timedOut=false) {
  const {snapshot}=adaptDay(fixture())
  let now=Date.now()-600000,state=initialState(snapshot,now),number=0
  const reflect=()=>{state.coaching[coachKey(state)]={title:'Saved training',text:'Review your saved answers.',focus:'Check the evidence.'}}
  reflect();state=transition(state,snapshot,'advance',{},now)
  for(const block of snapshot.blocks) {
    state=transition(state,snapshot,'block_start',{key:block.key},now)
    for(const q of block.questions) {
      if(number<12 || (timedOut && number>=17 && number<20)) {
        const input={key:block.key,questionId:q.id,presented:true}
        if(number<8)input.response=number<3?q.answer:q.options.find(o=>o.id!==q.answer).id
        state=transition(state,snapshot,'responses',input,now)
      }
      number++
    }
    now+=timedOut&&block.key==='va'?480000:18000
    state=transition(state,snapshot,'finish',{key:block.key},now)
    state=transition(state,snapshot,'advance',{},now);reflect()
    state=transition(state,snapshot,'advance',{},now)
  }
  reflect()
  return publicState({id:student,revision:1,state,snapshot},now)
}
let attempt=sample()
const env=dotenv.parse(await readFile('.env.local'))
const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || path.join(os.homedir(),'.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe'),headless:true})
const ctx=await browser.newContext({viewport:{width:1440,height:1000}})
const user={id:student,email:'bootcamp-browser@example.test'}
const session={access_token:student,refresh_token:'local-test-refresh',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,user}
const branding={brandName:'Auctor',logoUrl:'/logo.png',faviconUrl:'/icon-192.png',primaryColor:'#4f46e5',secondaryColor:'#0ea5e9',isInstitute:false}
const context={user,profile:{user_id:student,name:'Boot Camp Student',exam:'CAT'},tenant:{kind:'b2c'},branding,exam:'CAT',capabilities:{isCAT:true,showDailyRC:true,showCATSectionals:true},entitlement:{hasAccess:true,isPremium:true},access:'allowed'}
await ctx.addInitScript(({ref,session})=>localStorage.setItem(`sb-${ref}-auth-token`,JSON.stringify(session)),{ref,session})

const errors=[],requests=[]
await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url())
  const fulfill=json=>route.fulfill({contentType:'application/json',body:JSON.stringify(json)})
  if(url.pathname.startsWith('/api/bootcamp')) {requests.push({method:req.method(),path:url.pathname});assert.equal(req.method(),'GET');return fulfill({enrolled:true,attempt})}
  if(url.pathname==='/api/tenant-context')return fulfill({tenant:context.tenant,branding})
  if(url.pathname==='/api/session-context')return fulfill(context)
  if(url.pathname==='/auth/v1/token')return fulfill(session)
  if(url.pathname==='/auth/v1/user')return fulfill(user)
  if(url.origin===base)return route.continue()
  return route.abort()
})
const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message))
const output=path.join(os.tmpdir(),'auctor-bootcamp-glance');await mkdir(output,{recursive:true})
let checks=0
const check=(value,message)=>{assert.ok(value,message);checks++;console.log('PASS',message)}
const expected={Questions:'25',Accuracy:'37.5%','Activity time':'1m 30s',Correct:'3',Incorrect:'5',Skipped:'4','Not reached':'13','Timed out':'0'}
const note='Accuracy = correct '+String.fromCharCode(247)+' attempted. Activity time excludes review and coaching; it is not total wall-clock session time.'
try {
  await page.goto(base+'/boot-camp/day/1/report')
  const glance=page.getByRole('region',{name:'Today at a glance',exact:true})
  await glance.waitFor()
  for(const [label,value] of Object.entries(expected)) check(await glance.locator('dt').filter({hasText:new RegExp('^'+label+'$')}).locator('..').locator('dd').textContent()===value,label+' remains '+value)
  check(await glance.getByText(note,{exact:true}).isVisible(),'explanation is preserved verbatim')
  for(const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:1000})
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow at '+width)
    check(await glance.evaluate(el=>el.scrollWidth<=el.clientWidth),'no section overflow at '+width)
    const primary=await glance.locator('dl').first().locator(':scope > div').evaluateAll(nodes=>nodes.map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,height:el.getBoundingClientRect().height})))
    check(primary[0].y===primary[1].y && (width>560?primary[1].y===primary[2].y:primary[2].y>primary[1].y),'primary metrics align at '+width)
    check((await glance.boundingBox()).height<(width>560?340:470),'stats remain compact at '+width)
    check(await glance.getByLabel('Question breakdown').locator(':scope > div').count()===4,'zero timed-out count does not create a fifth card at '+width)
    await glance.screenshot({path:path.join(output,'glance-'+width+'.png')})
  }
  await page.getByRole('tab',{name:'analytics',exact:true}).click()
  check(await page.getByRole('img',{name:'Overall accuracy: 37.5%',exact:true}).isVisible(),'analytics tab still opens with the same accuracy')
  await page.getByRole('tab',{name:'debrief',exact:true}).click();await glance.waitFor()
  await page.reload();await glance.waitFor()
  check(await glance.locator('dt').filter({hasText:'Accuracy'}).locator('..').locator('dd').textContent()==='37.5%','refresh preserves displayed statistics')
  attempt=sample(true);await page.reload();await glance.waitFor()
  check(await glance.getByLabel('Question breakdown').locator(':scope > div').count()===5,'nonzero timed-out count appears in the breakdown')
  check(await glance.getByLabel('Question breakdown').locator('dt').filter({hasText:'Timed out'}).locator('..').locator('dd').textContent()==='3','nonzero timed-out count is accurate')
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:1000})
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'nonzero timed-out layout fits '+width)
    await glance.screenshot({path:path.join(output,'glance-timeout-'+width+'.png')})
  }
  check(errors.length===0,'no browser exceptions')
  check(requests.every(r=>r.method==='GET'),'report viewing performs no Boot Camp writes')
  console.log('Glance browser checks passed:',checks,'Artifacts:',output)
} finally {await browser.close()}
