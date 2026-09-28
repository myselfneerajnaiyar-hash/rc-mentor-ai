const fs=require('fs');
let s=fs.readFileSync('tests/review-layout.browser.mjs','utf8').split('const review=')[0];
// Retain only fixture setup and common helpers.
s=s.slice(0,s.indexOf('const sizes='))+`async function go(path){await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(900);}\n`;
s=s.replace("exports/review-layout-fixes","exports/workout-mobile").replace("http://localhost:3112","http://localhost:3116").replace('viewport:{width:390,height:844}','viewport:{width:390,height:844},hasTouch:true');
s+=`
try {
 for(const width of [375,390,1440]) {
  await page.setViewportSize({width,height:900});await go('/?view=workout');
  const cards=page.locator('.workout-activity-card');await cards.first().waitFor();assert.equal(await cards.count(),4);
  for(const title of ['Speed Drill','Vocabulary Lab','Reading Comprehension','Micro Skills'])assert.ok(await cards.filter({hasText:title}).isVisible());
  assert.equal(await page.locator('.workout-overview').isVisible(),width>=900);
  assert.equal(await page.locator('.workout-mobile-subtitle').isVisible(),width<900);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const strip=page.locator('.workout-tabs');const tabs=strip.getByRole('tab');assert.equal(await tabs.count(),4);
  const boxes=await tabs.evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));assert.ok(boxes.every(y=>Math.abs(y-boxes[0])<2));
  await snap('start-'+width);
  if(width<900){
   const box=await strip.boundingBox();const cdp=await ctx.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width-25,y:box.y+24}]});
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width-25-(box.width-50)*i/12,y:box.y+24}]});await page.waitForTimeout(25);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
   assert.ok(await strip.evaluate(e=>e.scrollLeft)>20,'Touch scroll moves tab strip');assert.equal(await tabs.first().getAttribute('aria-selected'),'true','Swipe does not select content');await cdp.detach();
  }
  for(const name of ['Performance','History','Analytics','Start']){
   const tab=strip.getByRole('tab',{name,exact:true});await tab.click();await page.waitForTimeout(500);
   assert.equal(await tab.getAttribute('aria-selected'),'true');assert.equal(await page.getByRole('tabpanel').getAttribute('aria-labelledby'),await tab.getAttribute('id'));
   const a=await tab.boundingBox(),b=await strip.boundingBox();assert.ok(a.x>=b.x-1&&a.x+a.width<=b.x+b.width+1,'Selected tab visible');
  }
  const cta=page.getByRole('button',{name:/Start Workout/});await cta.scrollIntoViewIfNeeded();await snap('cards-cta-'+width);
  assert.ok(await page.evaluate(()=>{const c=document.querySelector('.workout-start'),a=document.querySelector('.workout-activities');return c.getBoundingClientRect().top>=a.getBoundingClientRect().bottom}));
  await cta.click();await page.getByRole('button',{name:'Exit activity'}).waitFor();assert.equal(await strip.count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.setViewportSize({width:375,height:844});await go('/?view=workout&tab=performance');
 const selected=page.getByRole('tab',{name:'Performance',exact:true});assert.equal(await selected.getAttribute('aria-selected'),'true');
 await selected.focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(500);assert.equal(await page.getByRole('tab',{name:'History',exact:true}).getAttribute('aria-selected'),'true');
 assert.deepEqual(errors,[]);console.log('PASS: 375, 390, 1440; touch swipe, four sections, cards, CTA, URL tab, keyboard, overflow, page errors');
} finally {await browser.close();}
`;
fs.writeFileSync('tests/workout-mobile.browser.mjs',s);
let old=fs.readFileSync('tests/mobile-ux.browser.mjs','utf8');old=old.replace("const wb=await page.getByRole('button',{name:/Start Workout/}).boundingBox();assert.ok(wb.y+wb.height<504,'Workout CTA above fold');","assert.equal(await page.locator('.workout-activity-card').count(),4);await page.getByRole('button',{name:/Start Workout/}).scrollIntoViewIfNeeded();");fs.writeFileSync('tests/mobile-ux.browser.mjs',old);
