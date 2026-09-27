import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOTCAMP_ENABLED, GRAMMAR_ENABLED, visibleFeatures, nextActivity, destination } from '../lib/mobile/features.mjs';
import { fetchWithTimeout, withTimeout } from '../lib/mobile/request.js';

test('discovery respects exam eligibility and disabled products',()=>{
 const cat=visibleFeatures({showDailyRC:true,showCATSectionals:true}).map(f=>f.id);
 const other=visibleFeatures({showDailyRC:false,showCATSectionals:false}).map(f=>f.id);
 assert.equal(BOOTCAMP_ENABLED,false);assert.equal(GRAMMAR_ENABLED,false);
 assert.ok(cat.includes('daily_rc')&&cat.includes('cat'));
 assert.ok(!other.includes('daily_rc')&&!other.includes('cat'));
 assert.ok(other.includes('workout')&&other.includes('hangman'));
 assert.ok(!cat.includes('bootcamp')&&!cat.includes('grammar'));
});
test('next action skips unavailable and completed work, then offers review',()=>{
 const activities=[{id:'daily_rc',available:false,completed:false},{id:'workout',available:true,completed:true},{id:'hangman',available:true,completed:false}];
 assert.equal(nextActivity(activities).id,'hangman');
 assert.equal(nextActivity(activities,'hangman').id,'workout');
 assert.equal(nextActivity([{id:'daily_rc',available:false}]),null);
 assert.equal(destination('workout'),'today');assert.equal(destination('mentor'),'practice');assert.equal(destination('profile'),'profile');
});
test('requests recover from timeout and respect a caller cancellation signal',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=(_url,{signal})=>new Promise((_resolve,reject)=>{const abort=()=>reject(new DOMException('Aborted','AbortError'));if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});});
 try{
  await assert.rejects(fetchWithTimeout('/slow',{},5),/timed out/);
  const controller=new AbortController();const pending=fetchWithTimeout('/cancel',{signal:controller.signal},100);controller.abort();await assert.rejects(pending,/timed out/);
  await assert.rejects(withTimeout(new Promise(()=>{}),5),/longer than expected/);
 }finally{globalThis.fetch=original;}
});
