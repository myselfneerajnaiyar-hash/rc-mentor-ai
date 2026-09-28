const fs=require('fs'),cp=require('child_process');
const files=['app/mobile.css','components/DailyWorkoutContainer.jsx','components/DailyWorkoutFlow.jsx','tests/mobile-ux.browser.mjs'];
let diff=cp.execFileSync('git',['diff','--',...files],{encoding:'utf8'});diff+=cp.spawnSync('git',['diff','--no-index','--','NUL','tests/workout-mobile.browser.mjs'],{encoding:'utf8'}).stdout;fs.writeFileSync('exports/workout-mobile/changes.diff',diff);
fs.writeFileSync('tsconfig.tsbuildinfo',cp.execFileSync('git',['show','HEAD:tsconfig.tsbuildinfo']));
