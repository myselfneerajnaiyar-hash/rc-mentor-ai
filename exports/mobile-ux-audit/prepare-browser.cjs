const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));
edit('app/birbal-v2/page.jsx',s=>s.replace('import { Upload,', 'import Recovery from "@/components/mobile/Recovery";\nimport NextActivity from "@/components/mobile/NextActivity";\nimport { fetchWithTimeout } from "@/lib/mobile/request";\nimport { Upload,'));
edit('components/PrecisionTraining.jsx',s=>s.replace('<div className="mt-6 flex flex-col gap-3 sm:flex-row">','<NextActivity current="precision"/><div className="mt-6 flex flex-col gap-3 sm:flex-row">'));
let s=fs.readFileSync('exports/mobile-ux-audit/verify-browser.mjs','utf8').replace(/\r\n/g,'\n');s=s.slice(0,s.indexOf('try{\n await page.goto(base)'));s=s.replace("const out='exports/mobile-ux-audit/verified'", "const out='exports/mobile-ux-audit/implemented'");
s=s.replace("if(table==='daily_rc_sets')", "if(table==='daily_hangman')return json(single?{id:'puzzle',max_lives:10,words:[{answer:'READ',hint:'Use text'}],context:'Read carefully',level:'easy'}:[]);if(table==='daily_rc_sets')");
s+=`try {
 for(const [width,height] of [[320,568],[320,844],[360,844],[375,844],[390,844],[414,844],[768,844],[800,844],[899,844],[900,844],[1024,844],[1440,900]]){
 await page.setViewportSize({width,height});await page.goto(base);await page.locator('.mobile-hub, .root-content h1').first().waitFor();await page.waitForTimeout(800);await snap('home-'+width+'x'+height);
 if(width<900){for(const view of ['today','practice','profile']){await page.goto(base+'/?view='+view);await page.waitForTimeout(700);await snap(view+'-'+width+'x'+height);}}
 }
 await page.setViewportSize({width:320,height:568});
 for(const view of ['rc','vocab','speed','workout','hangman','mentor','precision','cat']){await page.goto(base+'/?view='+view);await page.waitForTimeout(1400);await snap('module-'+view);}
 for(const path of ['/daily-challenge','/daily-challenge/instructions','/daily-challenge/test','/birbal-v2','/arena/result/missing']){await page.goto(base+path);await page.waitForTimeout(1500);await snap('route-'+path.replaceAll('/','-'));if(path.endsWith('/test')){await page.getByRole('tab',{name:/Questions/}).click();await snap('daily-questions');} }
}finally{await writeFile(out+'/measurements.json',JSON.stringify({results,errors,calls},null,2));await browser.close();}
`;
s=s.replace("page.on('pageerror',e=>errors.push(e.message));", "page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});page.on('dialog',d=>d.accept());");
fs.writeFileSync('exports/mobile-ux-audit/implementation-browser.mjs',s);
