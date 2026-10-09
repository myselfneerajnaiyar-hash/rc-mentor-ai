import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import { createService } from '../../lib/bootcamp/service.mjs'
import { createHandler } from '../../lib/bootcamp/api.mjs'
export const student = '00000000-0000-4000-8000-000000000001'
export const other = '00000000-0000-4000-8000-000000000002'
const ident = s => { if (!/^[a-z_][a-z_0-9]*$/.test(s)) throw Error('Invalid test SQL identifier'); return s }

// A real PostgreSQL runtime, not an in-memory imitation of the transaction logic.
export async function harness(source, generate, converse, options={}) {
  options={now:()=>new Date('2026-10-05T06:00:00Z'),personalSequence:false,...options}
  const pg = new PGlite(), calls = []
  await pg.exec('create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated; create role service_role;')
  await pg.exec(await readFile('supabase/migrations/202609220001_bootcamp_day1.sql','utf8'))
  await pg.exec(await readFile('supabase/migrations/202609230001_bootcamp_trainer_history.sql','utf8'))
  await pg.exec(await readFile('supabase/migrations/202610040002_bootcamp_history_unsequenced.sql','utf8'))
  await pg.exec(await readFile('supabase/migrations/202609230002_bootcamp_fixed_calendar.sql','utf8'))
  await pg.exec(await readFile('supabase/migrations/202610090001_bootcamp_personal_sequence.sql','utf8'))
  await pg.query('insert into auth.users values ($1),($2)',[student,other])
  await pg.exec('create table bootcamp_days(id text primary key, day_number integer, document jsonb, lock_token text, updated_at text)')
  await pg.exec('create table profiles(user_id uuid primary key,name text)')
  await pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[source.id,source.day_number,source.document,source.lock_token,source.updated_at])
  const db = { from: table => new Query(table), rpc: async (name,args) => {
    calls.push({ operation:'rpc',name })
    try { const keys = Object.keys(args); const result = await pg.query(`select public.${ident(name)}(${keys.map((k,i)=>`${ident(k)} => $${i+1}`).join(',')}) as result`,Object.values(args)); return { data:result.rows[0].result,error:null } }
    catch(e) { return { data:null,error:{ message:e.message,code:e.code } } }
  } }
  class Query {
    constructor(table) { this.table = ident(table); this.filters=[]; this.columns='*'; this.mode='select' }
    select(columns) { this.columns=columns.split(',').map(ident).join(','); return this }
    eq(k,v) { this.filters.push([ident(k),'=',v]);return this }
    lt(k,v) { this.filters.push([ident(k),'<',v]);return this }
    order(k,{ascending}) { this.orderBy=`${ident(k)} ${ascending ? 'asc':'desc'}`;return this }
    limit(n) { this.take=n;return this }
    in(k,values) { this.filters.push([ident(k),'in',values]);return this }
    range(start,end) { this.skip=start;this.take=end-start+1;return this }
    maybeSingle() { this.single=true;return this }
    upsert(value) { this.value=value;this.mode='insert';return this }
    then(resolve,reject) { return this.execute().then(resolve,reject) }
    async execute() {
      calls.push({ operation:this.mode,table:this.table })
      try {
        if (this.mode==='insert') {
          const keys=Object.keys(this.value); await pg.query(`insert into ${this.table}(${keys.map(ident)}) values(${keys.map((_,i)=>`$${i+1}`)}) on conflict do nothing`,Object.values(this.value));return {data:null,error:null}
        }
        let parameter=0
        const clauses=this.filters.map(([k,op,v])=>{
          if(op==='in'){const slots=v.map(()=>`$${++parameter}`);return `${k} in (${slots.join(',')})`}
          return `${k}${op}$${++parameter}`
        })
        const values=this.filters.flatMap(([,op,v])=>op==='in'?v:[v])
        const r=await pg.query(`select ${this.columns} from ${this.table}${clauses.length ? ' where '+clauses.join(' and '):''}${this.orderBy?' order by '+this.orderBy:''}${this.take!==undefined?' limit '+Number(this.take):''}${this.skip?' offset '+Number(this.skip):''}`,values)
        return {data:this.single ? r.rows[0]||null:r.rows,error:null}
      } catch(e) {return {data:null,error:{message:e.message,code:e.code}}}
    }
  }
  const service=createService(db,generate,converse,options)
  const handle=createHandler(service,async req=> {const token=req.headers.get('authorization');return token===`Bearer ${student}`?{id:student}:token===`Bearer ${other}`?{id:other}:null})
  return {pg,db,service,handle,calls,close:()=>pg.close()}
}

export function fixture(day = 1) {
  if(day !== 1) { const row=JSON.parse(JSON.stringify(fixture()).replaceAll('bootcamp-day-1',`bootcamp-day-${day}`));row.day_number=day;row.document.content.dayNumber=day;return row }
  const enrichment={}
  const make=(block,order,type,passageId=null)=> {
    const id=`bootcamp-day-1-${passageId ? `rc${passageId}`:block}-q${order}`
    const tita=['Para Jumble','Sentence Placement','Odd Sentence Out'].includes(type)
    const q={id,dayId:'bootcamp-day-1',block,order,type,passageId:passageId ? `bootcamp-day-1-rc${passageId}`:null,mode:tita?'TITA':'MCQ',text:'Choose the supported answer.',context:block==='rc'?'':type==='Sentence Placement'?'One. [1] Two. [2] Three. [3] Old procedures remain. [4] Consequences follow.':'Some claims need qualifications.',sentenceToPlace:type==='Sentence Placement'?'Those procedures merit reconsideration.':'',sentences:type==='Para Jumble'||type==='Odd Sentence Out'?Array.from({length:type==='Para Jumble'?4:5},(_,i)=>({number:i+1,text:`Sentence ${i+1}.`})) : [], options:tita?[]:['A','B','C','D'].map(id=>({id,text:`Choice ${id}`})),answer:type==='Para Jumble'?[2,1,4,3]:tita?4:'B'}
    q.sourceAnswer=Array.isArray(q.answer)?q.answer.join(','):String(q.answer)
    const authoredTrap=(block==='warmup'||block==='rc'&&passageId===1)&&order===1?{trapType:'Cause Effect',looksCorrectBecause:'It uses the passage’s observation that peer-reviewed manuscripts receive extra editorial attention.',explanation:'The passage shows an association, but does not establish that peer review causes more accurate forecasts.'}
      :(block==='warmup'&&order===2||block==='rc'&&passageId===1&&order===2)?{trapType:'Partial Truth',looksCorrectBecause:'It repeats a real benefit of expert panels described in the passage.',explanation:'The option keeps that benefit but leaves out the author’s qualification that expertise alone does not resolve the accountability problem.'}:null
    enrichment[id]={kind:'question',targetId:id,analysisKind:'content_hypothesis',primarySkill:type,explanation:'The answer preserves the supported claim.',idealThinkingProcess:['Identify the claim.','Check its scope.'],evidence:[{quote:'Some claims',explanation:'The source supports a qualified claim.'}],typeSpecific:{type:block==='va'?type:'RC',...(type==='Sentence Placement'?{correctPosition:4,beforeLogic:'Old procedures precede slot four.',afterLogic:'Consequences follow.',whyCorrectFits:'The reference has an antecedent.'}:{}),...(type==='Odd Sentence Out'?{oddSentence:4}:{}),...(type==='Para Jumble'?{openingSentence:2,mandatoryPairs:[],constructionLogic:'Follow the referents.'}:{})},optionAnalysis:q.options.map(o=>({optionId:o.id,isCorrect:o.id==='B',explanation:o.id==='B'?'The passage supports this qualified claim.':o.id==='A'&&authoredTrap?authoredTrap.explanation:'This option is not supported by the stated claim.',trapType:o.id==='A'&&authoredTrap?authoredTrap.trapType:null,looksCorrectBecause:o.id==='A'&&authoredTrap?authoredTrap.looksCorrectBecause:undefined}))}
    return q
  }
  const warmup=['Inference','Main Idea','Author Tone','Weaken','Strengthen'].map((t,i)=>make('warmup',i+1,t))
  const passages=[1,2,3].map(n=> {const p={id:`bootcamp-day-1-rc${n}`,dayId:'bootcamp-day-1',order:n,text:'Some claims need qualifications.',solveMinutes:7,questions:[1,2,3,4].map(i=>make('rc',i,'Inference',n))};enrichment[p.id]={kind:'passage',targetId:p.id,coreTheme:'Qualifications matter.',passageFlow:[],authorIntent:'Explain qualifications.'};return p})
  const verbalAbility=['Para Jumble','Para Jumble','Para Summary','Para Summary','Sentence Placement','Sentence Placement','Odd Sentence Out','Odd Sentence Out'].map((t,i)=>make('va',i+1,t))
  return {id:'bootcamp-day-1',day_number:1,lock_token:'verified-test-revision',updated_at:'2026-09-22T10:00:00Z',document:{status:'enriched',content:{id:'bootcamp-day-1',dayNumber:1,warmup,passages,verbalAbility,vaSolveMinutes:8},enrichment}}
}
