const fs = require('fs');
require('dotenv').config({path:'.env.local',quiet:true});
const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY};
const schema=require('./schema-inspection.json').definitions;
async function get(path){const r=await fetch(base+path,{headers});if(!r.ok)throw Error(path.split('?')[0]+' HTTP '+r.status);return r.json();}
async function table(name,cols){let rows=[];for(let offset=0;;offset+=500){let page=await get('/rest/v1/'+name+'?select='+cols+'&order=id.asc&limit=500&offset='+offset);rows.push(...page);if(page.length<500)break;}return rows;}
async function main(){
const data={extractedAt:new Date().toISOString(),tables:{}};
const specs={profiles:'id,user_id,name,phone,email,role,is_premium,premium_expires_at',subscriptions:'id,user_id,plan,razorpay_payment_id,expires_at,created_at,name,email,phone',rc_sessions:'id,user_id,created_at,difficulty,passage_id,total_questions,correct_answers,time_taken_sec',workout_attempts:'id,user_id,workout_date,mode,completed_at',daily_rc_attempts:'id,user_id,daily_rc_set_id,started_at,completed_at',influencer_coupon_conversions:'id,user_id,payment_id,payment_status,created_at',rc_questions:'id,user_id,session_id,created_at',rc_session_questions:'id,session_id,created_at'};
const activity=['vocab_sessions','speed_sessions','editorial_history','mentor_chat_history','mentor_test_attempts','grammar_test_attempts','hangman_attempts','sectional_test_attempts','sectional_v2_attempts','sectional_tests','user_attempts','reader_sessions','reader_attempts','grammar_question_attempts','mentor_rc_question_attempts','mentor_va_attempts','sectional_question_attempts','assignment_attempts','user_words','user_word_progress','inbox_notifications'];
for(const name of activity){const p=schema[name].properties;const fields=['id',p.user_id?'user_id':'student_user_id',...(name==='inbox_notifications'?['read_at','archived_at','deleted_at']:Object.keys(p).filter(k=>/timestamp/.test(p[k].format||''))),...(name==='mentor_chat_history'?['role']:[])];specs[name]=[...new Set(fields)].join(',');}
for(const [name,cols] of Object.entries(specs)){data.tables[name]=await table(name,cols);console.log(name+': '+data.tables[name].length);}
data.auth=[];for(let page=1;;page++){const result=await get('/auth/v1/admin/users?page='+page+'&per_page=500');data.auth.push(...result.users.map(u=>({id:u.id,email:u.email,phone:u.phone,name:u.user_metadata?.full_name||u.user_metadata?.name||'',last_sign_in_at:u.last_sign_in_at})));if(result.users.length<500)break;}
fs.writeFileSync('exports/student-source-data.json',JSON.stringify(data));
const freq=(rows,key)=>Object.fromEntries([...new Set(rows.map(r=>r[key]))].map(v=>[String(v),rows.filter(r=>r[key]===v).length]));
console.log(JSON.stringify({auth:data.auth.length,rcDifficulty:freq(data.tables.rc_sessions,'difficulty'),workoutMode:freq(data.tables.workout_attempts,'mode'),roles:freq(data.tables.profiles,'role'),subscriptionsWithoutPayment:data.tables.subscriptions.filter(r=>!r.razorpay_payment_id).length,paymentStatuses:freq(data.tables.influencer_coupon_conversions,'payment_status')}));
}
main().catch(e=>{console.error(e.message);process.exit(1)});
