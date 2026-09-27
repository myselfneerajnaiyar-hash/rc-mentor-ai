const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));
edit('tests/mobile-ux.browser.mjs',s=>s.replace("assert.match(page.url(),/activity=workout/)","await page.waitForURL(/activity=workout/)").replace("assert.match(page.url(),/tab=profile/)","await page.waitForURL(/tab=profile/)"));
edit('components/mobile/DailyActivityProvider.jsx',s=>s.replace('const rcDone=!!attempt && attempt.daily_rc_set_id===rc?.challenge?.id;', `const currentRC=rc?.challenge?.id ? await withTimeout(supabase.from('daily_rc_attempts').select('id').eq('user_id',user.id).eq('daily_rc_set_id',rc.challenge.id).maybeSingle()) : {data:null};
      if(currentRC.error)throw Error('Your Daily RC completion could not be checked.');
      const rcDone=!!currentRC.data;`).replace('attemptId=${attempt.id}\`:', 'attemptId=${currentRC.data.id}\`:'));
edit('app/daily-challenge/test/page.jsx',s=>{const a=s.indexOf('captureLearningEvent("daily_rc_completed",');const b=s.indexOf('\nconst questionRows =',a);const event=s.slice(a,b);s=s.slice(0,a)+s.slice(b);s=s.replace('completedRef.current = true;','completedRef.current = true;\n'+event);return s;});
