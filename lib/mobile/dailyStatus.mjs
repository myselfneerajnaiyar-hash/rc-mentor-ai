export async function loadDailyStatus(db,userId,showDailyRC,now=new Date()) {
 const day=now.toISOString().slice(0,10);
 const rcDay=new Date(now.getTime()+19800000).toISOString().slice(0,10);
 const checked=async query=>{const result=await query;if(result.error)throw result.error;return result.data;};
 // RC completion starts as soon as metadata arrives, independently of history.
 const rcTask=showDailyRC?(async()=>{const challenge=await checked(db.from('daily_rc_sets').select('id,timer_minutes').eq('challenge_date',rcDay).eq('category','cat_pyq').maybeSingle());const attempt=challenge?await checked(db.from('daily_rc_attempts').select('id').eq('user_id',userId).eq('daily_rc_set_id',challenge.id).maybeSingle()):null;return {challenge,attempt};})():Promise.resolve(null);
 const [rc,workout,word,puzzle,recentRC,recentWorkout]=await Promise.all([
  rcTask,
  checked(db.from('workout_attempts').select('id').eq('user_id',userId).eq('workout_date',day).maybeSingle()),
  checked(db.from('hangman_attempts').select('id').eq('user_id',userId).eq('attempt_date',day).maybeSingle()),
  checked(db.from('daily_hangman').select('id').eq('date',day).maybeSingle()),
  showDailyRC?checked(db.from('daily_rc_attempts').select('id,accuracy,completed_at').eq('user_id',userId).order('completed_at',{ascending:false}).limit(1)):[],
  checked(db.from('workout_attempts').select('id,accuracy,completed_at').eq('user_id',userId).order('completed_at',{ascending:false}).limit(1))
 ]);
 const activities=[...(showDailyRC?[{id:'daily_rc',name:'Daily RC Challenge',description:'One passage. Build your reading accuracy.',time:(rc?.challenge?.timer_minutes||8)+' min',available:!!rc?.challenge,completed:!!rc?.attempt,href:rc?.attempt?'/daily-challenge/result?attemptId='+rc.attempt.id:'/daily-challenge/instructions'}]:[]),
 {id:'workout',name:'Daily Workout',description:'Reading, vocabulary and speed in one guided session.',time:'25–30 min',available:true,completed:!!workout,href:'/?view=workout'},
 {id:'hangman',name:'Word Hunt',description:'A quick daily vocabulary puzzle.',time:'5 min',available:!!puzzle||!!word,completed:!!word,href:'/?view=hangman'}];
 const recent=[...(recentRC||[]).map(a=>({...a,name:'Daily RC',href:'/daily-challenge/result?attemptId='+a.id})),...(recentWorkout||[]).map(a=>({...a,name:'Daily Workout',href:'/?view=workout&tab=history'}))].sort((a,b)=>new Date(b.completed_at)-new Date(a.completed_at))[0]||null;
 return {activities,recent};
}
