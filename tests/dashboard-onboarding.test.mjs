import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { loadDailyStatus } from '../lib/mobile/dailyStatus.mjs';

test('daily summary uses current challenge, correct owner and lightweight queries',async()=>{
 const queries=[];
 const db={from(table){const q={table,filters:[],select(columns){this.columns=columns;return this;},eq(k,v){this.filters.push([k,v]);return this;},order(){return this;},limit(){this.recent=true;return this;},maybeSingle(){return this;},then(resolve){queries.push(this);let data=null;if(table==='daily_rc_sets')data={id:'today',timer_minutes:8};if(table==='daily_rc_attempts')data=this.recent?[{id:'old',completed_at:'2026-09-25',accuracy:80}]:{id:'current'};if(table==='workout_attempts')data=this.recent?[]:null;if(table==='daily_hangman')data={id:'puzzle'};return Promise.resolve({data,error:null}).then(resolve);}};return q;}};
 const result=await loadDailyStatus(db,'owner',true,new Date('2026-09-26T20:00:00Z'));
 assert.equal(result.activities[0].href,'/daily-challenge/result?attemptId=current');
 assert.equal(result.activities[1].completed,false);assert.equal(result.activities[2].available,true);
 assert.equal(result.recent.href,'/daily-challenge/result?attemptId=old');
 assert.ok(queries.every(q=>!q.columns.includes('*')));
 assert.ok(queries.filter(q=>q.table.endsWith('attempts')).every(q=>q.filters.some(([k,v])=>k==='user_id'&&v==='owner')));
 assert.ok(queries.find(q=>q.table==='daily_rc_sets').filters.some(([,v])=>v==='2026-09-27'));
 assert.ok(queries.find(q=>q.table==='daily_rc_sets').filters.some(([k,v])=>k==='category'&&v==='daily_rc_challenge'));
 assert.ok(queries.find(q=>q.table==='daily_rc_sets').filters.some(([k,v])=>k==='is_published'&&v===true));
 assert.ok(queries.find(q=>q.table==='workout_attempts'&&!q.recent).filters.some(([,v])=>v==='2026-09-26'));
 queries.length=0;await loadDailyStatus(db,'other',false);assert.ok(!queries.some(q=>q.table.startsWith('daily_rc')));
});

test('tour migration preserves legacy completion and isolates accounts with RLS',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create schema auth;create role anon;create role authenticated;create role service_role;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select current_setting('request.jwt.claim.sub',true)::uuid $$;create table public.profiles(user_id uuid,birbal_onboarded boolean);insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');insert into profiles values ('11111111-1111-4111-8111-111111111111',true),('22222222-2222-4222-8222-222222222222',false);grant usage on schema auth to authenticated;`);
 await db.exec(await readFile('supabase/migrations/202609270001_product_tour.sql','utf8'));
 assert.equal((await db.query('select * from product_tour_progress')).rows.length,1);
 await db.exec(`set role authenticated;set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';`);
 assert.equal((await db.query('select * from product_tour_progress')).rows.length,0);
 await assert.rejects(db.exec(`insert into product_tour_progress(user_id) values ('11111111-1111-4111-8111-111111111111')`),/permission denied/);
 await db.exec(`set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';`);
 assert.equal((await db.query('select * from product_tour_progress')).rows.length,1);
 }finally{await db.close();}
});

test('tour API refuses unauthorized requests and cannot write another account',async()=>{
 const source=(await readFile('app/api/product-tour/route.js','utf8')).replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
 let identity={status:401};const writes=[];
 const db={from:table=>({update:row=>({eq:async(column,id)=>{writes.push({table,row,column,id});return {error:null};}}),select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:{code:'PGRST205'}})})})})};
 const api=new Function('NextResponse','dashboardIdentity','supabaseAdmin',source+';return {GET,POST};')({json:(body,options={})=>({body,status:options.status||200})},async()=>identity,db);
 assert.equal((await api.POST({user_id:'victim'})).status,401);identity={status:403};assert.equal((await api.GET({})).status,403);assert.equal(writes.length,0);
 identity={user:{id:'owner'},profile:{birbal_onboarded:false}};assert.equal((await api.POST({user_id:'victim',completed_at:'forged'})).body.completed,true);assert.deepEqual(writes,[{table:'profiles',row:{birbal_onboarded:true},column:'user_id',id:'owner'}]);identity.profile.birbal_onboarded=true;assert.equal((await api.GET({})).body.completed,true);identity.profile.birbal_onboarded=false;assert.equal((await api.GET({})).body.completed,false,'Missing optional table does not break status');
});

test('a completion response cannot alter a tour after an auth or route transition',async()=>{
 const source=(await readFile('components/ProductTour.jsx','utf8')).replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
 let config,active=false,rejectSave;
 const description={textContent:'New account tour'},button={textContent:'Start Learning',disabled:false};
 const document={body:{classList:{add(){}}},querySelector:selector=>selector.includes('description')?description:button};
 const instance={isActive:()=>active,drive:()=>{active=true;},destroy:()=>{active=false;config.onDestroyed();},isLastStep:()=>true};
 const launch=new Function('driver','document',source+';return launchProductTour;')(options=>{config=options;return instance;},document);
 launch([],{onComplete:()=>new Promise((_,reject)=>{rejectSave=reject;}),onClose:()=>{}});
 const saving=config.onDoneClick();instance.destroy();rejectSave(Error('Cancelled account'));
 await saving;assert.equal(description.textContent,'New account tour');assert.equal(active,false);
});

test('tour receipts and dismissal are per-account, and dismissal never records completion',async()=>{
 const {tourReceipt,recordTourFinish,tourSeen,markTourSeen}=await import('../lib/mobile/tourProgress.mjs');
 const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};};
 globalThis.localStorage=storage();globalThis.sessionStorage=storage();
 try{markTourSeen('skipped-user');assert.equal(tourSeen('skipped-user'),true);assert.equal(tourReceipt('skipped-user').completed,undefined);assert.equal(tourSeen('new-user'),false);recordTourFinish('finished-user',true);assert.deepEqual(tourReceipt('finished-user'),{completed:true,pending:true});assert.equal(tourReceipt('new-user').completed,undefined);recordTourFinish('finished-user',false);assert.equal(tourReceipt('finished-user').pending,false);}finally{delete globalThis.localStorage;delete globalThis.sessionStorage;}
});
