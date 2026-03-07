import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"
import { getRCStats } from "@/lib/studentAnalytics"
import { getStudentProfile } from "@/lib/studentProfile"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)



export async function POST(req) {

  try {

   const body = await req.json()

const messages = body.messages || []
const userId = body.userId

const passage = body.passage || ""
const question = body.question || ""
const options = body.options || []
const correctIndex = body.correctIndex

let history = []

// SAVE USER MESSAGE
if (userId && messages.length > 0) {

  const lastUserMessage = messages[messages.length - 1]

  await supabase
    .from("mentor_chat_history")
    .insert({
      user_id: userId,
      role: "user",
      content: lastUserMessage.content
    })
}

// LOAD HISTORY
if (userId) {

  const { data } = await supabase
    .from("mentor_chat_history")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(20)

  history = data || []

}

   let accuracy = 0
let avgTime = 0
let weakestType = "unknown"
let weakestAccuracy = 100
let recentSessionSummary = ""
let strongestType = "unknown"
let strongestAccuracy = 0
let profile = null

let total = 0
let fastAnswers = 0
let slowAnswers = 0
let inferenceErrors = 0
    if (userId) {

     profile = await getStudentProfile(supabase, userId)
// Step 1: get all sessions of this user

const { data: sessions } = await supabase
  .from("rc_sessions")
  .select("id")
  .eq("user_id", userId)

  // Step 2: extract session ids

const userSessionIds = (sessions || []).map(s => s.id)
// Step 3: fetch questions from those sessions

const { data: questions } = await supabase
  .from("rc_session_questions")
  .select("question_type, is_correct, time_taken_sec")
  .in("session_id", userSessionIds)
  

  // Get recent questions to detect last sessions

const { data: recentRows } = await supabase
  .from("rc_session_questions")
  .select("session_id, question_type, is_correct")
  .in("session_id", userSessionIds)
  .order("created_at", { ascending: false })
  .limit(40)

// Extract last 4 unique sessions

const sessionIds = [
  ...new Set((recentRows || []).map(r => r.session_id))
].slice(0,4)

// Fetch all questions from those sessions

const { data: sessionQuestions } = await supabase
  .from("rc_session_questions")
  .select("question_type, is_correct")
  .in("session_id", sessionIds)

    
      let correct = 0
      let totalTime = 0
      const typeStats = {}
     

      ;
      (questions || []).forEach(q => {

        total++

        if (q.is_correct) correct++

        if (q.time_taken_sec) {
          totalTime += q.time_taken_sec
        }
        if (q.time_taken_sec && q.time_taken_sec < 8) {
  fastAnswers++
}

if (q.time_taken_sec && q.time_taken_sec > 90) {
  slowAnswers++
}

if (!q.is_correct && q.question_type === "inference") {
  inferenceErrors++
}

        const type = (q.question_type || "inference")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/_/g, "-")

        if (!typeStats[type]) {
          typeStats[type] = { correct: 0, total: 0 }
        }

        typeStats[type].total++

        if (q.is_correct) {
          typeStats[type].correct++
        }

      })

      accuracy =
        total === 0 ? 0 : Math.round((correct / total) * 100)

      avgTime =
        total === 0 ? 0 : Math.round(totalTime / total)

         recentSessionSummary = ""

const recentStats = {}

;(sessionQuestions || []).forEach(q => {

  const type = (q.question_type || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-")

  if (!recentStats[type]) {
    recentStats[type] = { total:0, correct:0 }
  }

  recentStats[type].total++

  if (q.is_correct) recentStats[type].correct++

})

Object.entries(recentStats).forEach(([type,s]) => {

  recentSessionSummary += `${type}: ${s.correct}/${s.total}\n`

})

   Object.entries(typeStats).forEach(([type, s]) => {

  if (s.total < 5) return   // ignore types with very few attempts

  const acc = Math.round((s.correct / s.total) * 100)

  if (acc < weakestAccuracy) {
    weakestAccuracy = acc
    weakestType = type
  }

  if (acc > strongestAccuracy) {
    strongestAccuracy = acc
    strongestType = type
  }

})
    }
// ---------------- RC DIAGNOSIS ----------------

let diagnosis = ""

if (accuracy < 50) {
  diagnosis += "Overall RC accuracy is low. This suggests the student is struggling to build passage understanding.\n"
}

if (avgTime < 15) {
  diagnosis += "Average answering time is very low. This usually indicates guessing or shallow reading.\n"
}

if (avgTime > 60) {
  diagnosis += "Average answering time is very high. This suggests the student is overthinking questions.\n"
}

if (weakestType === "inference") {
  diagnosis += "Inference questions are the weakest area. This usually happens when the reader misses implicit arguments.\n"
}

if (weakestType === "main-idea") {
  diagnosis += "Main idea questions are weak. The student may not be identifying the author's thesis.\n"
}

if (strongestType === "tone") {
  diagnosis += "Tone detection is strong. The student can recognize author attitude well.\n"
}

if (!diagnosis) {
  diagnosis = "Performance appears balanced across question types."
}

let patternInsights = ""

if (fastAnswers > total * 0.4) {
  patternInsights += "Many questions are answered extremely fast, indicating guess-based solving.\n"
}

if (slowAnswers > total * 0.3) {
  patternInsights += "You spend too long on some questions, suggesting overthinking.\n"
}

if (inferenceErrors > 3) {
  patternInsights += "A large portion of mistakes come from inference questions.\n"
}

if (!patternInsights) {
  patternInsights = "No strong behavioral patterns detected yet."
}
const studentContext = `

Student performance profile

READING COMPREHENSION
Accuracy: ${accuracy}%
Average time/question: ${avgTime} seconds
Weakest type: ${weakestType} (${weakestAccuracy}%)
Strongest type: ${strongestType} (${strongestAccuracy}%)

AI DIAGNOSIS
${diagnosis}
PATTERN INSIGHTS
${patternInsights}

VOCABULARY
Accuracy: ${profile?.vocab?.accuracy || 0}%

READING SPEED
Average WPM: ${profile?.speed?.avgWpm || 0}

PRACTICE ACTIVITY
Daily workouts completed: ${profile?.workout?.completed || 0}
CAT sectional attempts: ${profile?.cat?.attempts || 0}

Recent RC session breakdown:
${recentSessionSummary}




Focus your advice on improving this student's weak areas.

Always start by briefly interpreting the student's statistics before giving advice.
`

    const completion = await openai.chat.completions.create({

      model: "gpt-4.1-mini",

      messages: [

        {
          role: "system",
        
content: `
You are Auctor RC Mentor — an expert CAT Reading Comprehension coach.

About the AuctorRC platform:

Students practice Reading Comprehension using these modules:

1. Daily Workout
A 30-minute structured training consisting of:
* 5 minutes speed reading
* 5 minutes vocabulary practice
* 2 RC passages (~15 minutes)
* 5 micro questions (odd one out, summary, para completion)

2. RC Generator
Students can generate new passages by selecting:
* genre
* difficulty
* word count
Questions are generated automatically for the passage.

3. Vocabulary Trainer
Words encountered in passages get stored in a Word Bank.
Students can revise them through vocabulary drills.

4. Speed Drills
Timed exercises designed to improve reading speed (WPM).

5. CAT Sectional
A CAT-style RC test with:
* 4 passages
* 30 minutes timer.

6. RC Mentor
AI mentor that analyzes performance and suggests improvement strategies.

Platform constraints:

* Students cannot currently practice specific question types directly.
* Question types appear only inside passages.
* There is no adaptive learning flow yet.

When giving advice:
Always recommend actions using the modules available in AuctorRC.
Do not suggest features that do not exist on the platform.


You have access to the student's previous chat history stored in the system database.
You can remember past conversations and refer to them when relevant.

Do NOT say that you forget conversations after the session.

${studentContext}

RC QUESTION CONTEXT

Passage:
${passage}

Question:
${question}

Options:
${options.map((o,i)=>`${i}. ${o}`).join("\n")}

Correct Answer Index: ${correctIndex}

When a student asks about a question:

* Explain why the correct answer works  
* Explain why trap options look tempting  
* Point to the reasoning in the passage

When answering:

1. Start by referencing the student's analytics (accuracy, time, weakest type).
2. Explain what these numbers mean about the student's reading behavior.
3. Identify the likely cause of mistakes.
4. Give specific improvement strategies using AuctorRC modules.
5. Provide a clear practice plan using the available modules.
6. Mention vocabulary or reading speed issues if relevant.

If the student asks for improvement, analysis, or study strategy,
generate a simple "Today's RC Workout".

The workout must only use AuctorRC modules:

Daily Workout
RC Generator
Vocabulary Trainer
Speed Drills
CAT Sectional

The workout should be short and actionable.

Example format:

Today's RC Workout

1️⃣ Daily Workout
Complete today's 30-minute Daily Workout.

2️⃣ RC Generator
Generate 2 passages
Difficulty: medium
Words: 400–500

3️⃣ Vocabulary Trainer
Revise 10 words from your Word Bank.

4️⃣ Speed Drill
1 session to improve reading speed.

Adjust the workout based on the student's weakest areas.

Workout adaptation rules:

If inference accuracy is low:
→ Recommend more RC Generator passages.

If reading speed is low:
→ Recommend Speed Drills.

If vocabulary accuracy is low:
→ Recommend Vocabulary Trainer revision.

If overall RC accuracy is low:
→ Recommend Daily Workout consistency.

If accuracy is high:
→ Recommend CAT Sectional practice.

When recommending practice:

Always use the modules available inside AuctorRC:
* Daily Workout
* RC Generator
* Vocabulary Trainer
* Speed Drills
* CAT Sectional
* RC Mentor

Do not suggest practicing specific question types directly, because that feature does not exist.
Instead recommend passages using RC Generator or Daily Workout.

Whenever possible, end the answer with a simple practice plan such as:

Recommended plan for today:

1️⃣ Daily Workout

2️⃣ RC Generator
Generate 2 passages
Difficulty: medium
Words: 400–500

3️⃣ Vocabulary Trainer
Revise 10 words from the Word Bank

4️⃣ Speed Drill
1 session

Avoid generic study advice like "read more articles" or "practice past papers".
Always prefer actions that can be done inside AuctorRC.
Prioritize actionable steps using the AuctorRC modules rather than general theory.

* Short paragraphs
* Bullet points
* No dense text blocks
* Speak like a CAT trainer coaching a student
`
        },

      ...history,
...messages.slice(-1)

      ]

    })

    const reply = completion.choices[0].message.content

    if (userId) {

  await supabase
    .from("mentor_chat_history")
    .insert({
      user_id: userId,
      role: "assistant",
      content: reply
    })

}

    return NextResponse.json({ reply })

  }

  catch (err) {

  console.error("Chat Mentor error:", err)

  return NextResponse.json({
    reply: "ERROR: " + err.message
  })

}

}