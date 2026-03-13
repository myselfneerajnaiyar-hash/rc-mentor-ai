import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL,
 process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req){

 try{

  const { userId, results } = await req.json()

  /*
  results example

  [
   { skill:"inference", correct:true },
   { skill:"tone", correct:false }
  ]
  */

  const skillMap = {}

  results.forEach(r => {

   if(!skillMap[r.skill]){
    skillMap[r.skill] = {attempted:0, correct:0}
   }

   skillMap[r.skill].attempted++

   if(r.correct){
    skillMap[r.skill].correct++
   }

  })

  for(const skill in skillMap){

   const {data:existing} = await supabase
    .from("rc_skill_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("skill", skill)
    .single()

   if(existing){

    const newAttempted =
     existing.attempted + skillMap[skill].attempted

    const newCorrect =
     existing.correct + skillMap[skill].correct

    await supabase
     .from("rc_skill_scores")
     .update({
      attempted:newAttempted,
      correct:newCorrect,
      accuracy:newCorrect/newAttempted
     })
     .eq("id", existing.id)

   }else{

    await supabase
     .from("rc_skill_scores")
     .insert({
      user_id:userId,
      skill:skill,
      attempted:skillMap[skill].attempted,
      correct:skillMap[skill].correct,
      accuracy:
       skillMap[skill].correct/
       skillMap[skill].attempted
     })

   }

  }

  return NextResponse.json({success:true})

 }catch(err){

  return NextResponse.json(
   {error:"precision submit failed"},
   {status:500}
  )

 }

}