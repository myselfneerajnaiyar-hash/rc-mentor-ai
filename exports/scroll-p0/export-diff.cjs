const fs=require('fs'),cp=require('child_process');
const changed=['components/ChatMentor.jsx','components/home-v2/BirbalFloatingButton.jsx','components/inbox/InboxApp.jsx','app/preview/page.js'];
let diff=cp.execFileSync('git',['diff','--',...changed],{encoding:'utf8'});
for(const file of ['lib/ui/bodyScrollLock.mjs','tests/body-scroll-lock.test.mjs','tests/scroll-p0.browser.mjs','tests/scroll-overlays.browser.mjs','tests/scroll-boundaries.browser.mjs']){try{diff+=cp.execFileSync('git',['diff','--no-index','--','/dev/null',file],{encoding:'utf8'});}catch(e){if(e.status!==1)throw e;diff+=e.stdout;}}
fs.writeFileSync('exports/scroll-p0/changes.diff',diff);

