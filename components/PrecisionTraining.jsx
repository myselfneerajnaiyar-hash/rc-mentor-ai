"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

export default function PrecisionTraining({ user, userName }) {

  const [phase, setPhase] = useState("intro")
  const [loading, setLoading] = useState(false)
  const [drill, setDrill] = useState(null)
  const [answers, setAnswers] = useState({})
const [currentQ, setCurrentQ] = useState(0)
const [showExplanation, setShowExplanation] = useState(false)
const [finished, setFinished] = useState(false)
  const [weakSkills, setWeakSkills] = useState([]);
  const [skillStats, setSkillStats] = useState({})
  const [timeLeft, setTimeLeft] = useState(720)


   function formatSkill(skill) {
  return skill
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

function getSkillExplanation(skill) {

  if (!skill) return ""

  const map = {
    inference: "difficulty distinguishing supported conclusions from attractive traps.",
    tone: "difficulty detecting subtle author attitude shifts.",
    function: "difficulty identifying the role each paragraph plays in the argument.",
    "author-agreement": "difficulty identifying the author's stance versus supporting detail.",
    central_idea: "difficulty synthesizing the main argument of the passage."
  }

  return map[skill] || "a reasoning pattern that requires targeted practice."

}

  useEffect(() => {
  async function loadWeakSkills() {

    if (!user) return;

    const { data } = await supabase
      .from("rc_questions")
      .select("question_type, is_correct")
      .eq("user_id", user.id);

    if (!data || data.length === 0) return;

    const skillMap = {};

    data.forEach(q => {
      const type = q.question_type || "Unknown";

      if (!skillMap[type]) {
        skillMap[type] = { total: 0, correct: 0 };
      }

      skillMap[type].total += 1;
      if (q.is_correct) skillMap[type].correct += 1;
    });

    const skillData = Object.entries(skillMap).map(([type, stats]) => ({
  type,
  accuracy: stats.correct / stats.total,
  attempts: stats.total
}));

// Only consider skills with at least 8 attempts
let filtered = skillData.filter(s => s.attempts >= 8);

// If fewer than 2 skills meet this rule, fallback to all skills
if (filtered.length < 2) {
  filtered = skillData;
}

// Sort by lowest accuracy
filtered.sort((a,b)=>a.accuracy-b.accuracy);

// Pick weakest 2
const weakest = filtered.slice(0,2);
setWeakSkills(weakest.map(s=>s.type));

const stats = {};

weakest.forEach(s => {
  const total = skillMap[s.type].total;
  const correct = skillMap[s.type].correct;

  stats[s.type] = {
    total,
    accuracy: Math.round((correct / total) * 100)
  };
});

setSkillStats(stats);

  }

  loadWeakSkills();

}, [user]);

useEffect(() => {

  if (phase !== "running") return

  const timer = setInterval(() => {

    setTimeLeft((prev) => {

      if (prev <= 1) {
        clearInterval(timer)
        setFinished(true)
        return 0
      }

      return prev - 1

    })

  }, 1000)

  return () => clearInterval(timer)

}, [phase])

function formatTime(seconds) {

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${mins}:${secs.toString().padStart(2,"0")}`

}

  async function startDrill() {

    setLoading(true)

    try {

      const res = await fetch("/api/precision-drill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
       body: JSON.stringify({
  userId: user.id,
  weakSkills: weakSkills
})
      })

      const data = await res.json()

      if (data.limitReached) {

        alert("You reached today's precision limit.")
        setLoading(false)
        return

      }

      setDrill(data)
      setPhase("running")

    } catch (err) {

      console.error("Precision drill error", err)

    }

    setLoading(false)

  }

  if (phase === "intro") {

    return (
      <div className="p-8 text-white">

       <div className="flex items-center gap-4 mb-6">

  <img
    src="/birbal.png"
    alt="Birbal"
    className="w-12 h-12 rounded-full"
  />

  <h1 className="text-2xl font-bold">
    Birbal Precision Training
  </h1>

</div>

    <h2 className="text-xl font-semibold mb-4">
Hey {userName || "there"},
</h2>

<p className="text-slate-300 mb-3">
I analysed your recent RC sessions.
</p>

<p className="text-slate-300 mb-5">
Your weakest areas appear to be{" "}
<b>{formatSkill(weakSkills[0] || "inference")}</b>
{weakSkills[1] && <> and <b>{formatSkill(weakSkills[1])}</b></>}.
</p>

{weakSkills[0] && skillStats[weakSkills[0]] && (
  <p className="text-slate-300 mb-5">
    Your accuracy in <b>{formatSkill(weakSkills[0])}</b> questions is{" "}
    <b>{skillStats[weakSkills[0]].accuracy}%</b> across the last{" "}
    <b>{skillStats[weakSkills[0]].total}</b> attempts.
   This suggests {getSkillExplanation(weakSkills[0])}
  </p>
)}

<p className="mb-6 text-slate-300">
I have created a 10-question precision drill to strengthen these skills.
</p>

        <button
          onClick={startDrill}
          className="px-6 py-3 bg-indigo-600 rounded-xl"
        >
          {loading ? "Creating Drill..." : "Start Precision Drill"}
        </button>

      </div>
    )
  }

 if (phase === "finished") {

  const questions = [
  ...(drill?.micro || []),
  ...(drill?.mini_rc?.questions || [])
]
  let score = 0

  const skillStats = {}

  questions.forEach((q,i)=>{

    const skill = q.skill || "general"

    if(!skillStats[skill]){
      skillStats[skill] = { total:0, correct:0 }
    }

    skillStats[skill].total++

    if(answers[i] === q.correctIndex){
      score++
      skillStats[skill].correct++
    }

  })



  return (

    <div className="p-8 text-white">

      <div className="mb-8">

<h1 className="text-3xl font-bold mb-2">
Precision Drill Report
</h1>

<div className="text-slate-400 mb-4">
Your reasoning precision for this session
</div>

<div className="bg-slate-800 p-6 rounded-xl">

<div className="text-4xl font-bold text-yellow-400">
{score} / {questions.length}
</div>

<div className="text-slate-400 mt-2">
Precision Score
</div>

</div>

</div>


     <div className="mb-8">

<h2 className="text-lg mb-4">
Skill Breakdown
</h2>

{Object.entries(skillStats).map(([skill,stats])=>{

  const percent = Math.round((stats.correct / stats.total)*100)

  return (

    <div
      key={skill}
      className="mb-3 bg-slate-800 p-4 rounded-xl flex justify-between"
    >

      <div>

        <div className="font-semibold">
          {formatSkill(skill)}
        </div>

        <div className="text-slate-400 text-sm">
          {stats.correct} / {stats.total} correct
        </div>

      </div>

      <div className="text-yellow-400 font-semibold">
        {percent}%
      </div>

    </div>

  )

})}

</div>


     <div className="bg-slate-800 p-6 rounded-xl flex gap-4">

<img
  src="/birbal.png"
  className="w-12 h-12 rounded-full"
/>

<div>

<div className="font-semibold mb-1">
Birbal's Diagnosis
</div>

<div className="text-slate-300 text-sm">

You are able to identify explicit ideas but struggle
when the author’s reasoning requires inference.
Focus on identifying assumptions before evaluating
answer choices.

</div>

</div>

</div>

<div className="mt-6">

<button
  onClick={() => setPhase("review")}
  className="px-6 py-3 bg-indigo-600 rounded-xl"
> 
View Detailed Explanations
</button>

</div>
</div>

  )
  

}

if (phase === "review") {

 const questions = [
  ...(drill?.micro || []),
  ...(drill?.mini_rc?.questions || [])
]

  return (

    <div className="p-8 text-white">

      <div className="flex justify-between mb-6">

        <h1 className="text-2xl font-bold">
          Detailed Explanations
        </h1>

        <button
          onClick={() => setPhase("finished")}
          className="px-4 py-2 bg-slate-700 rounded-lg"
        >
          Back to Report
        </button>

      </div>

      {questions.map((q,i)=>{

        const userAnswer = answers[i]

        return (

          <div
            key={i}
            className="mb-6 bg-slate-800 p-6 rounded-xl"
          >

            <div className="mb-3 text-slate-400">
              Question {i+1}
            </div>

            {q.paragraph && (
              <div className="mb-4 text-slate-300">
                {q.paragraph}
              </div>
            )}

            {i >= 8 && (
              <div className="mb-4 text-slate-300">
                {drill.mini_rc.passage}
              </div>
            )}

            <div className="mb-4 font-semibold">
              {q.question}
            </div>

            {q.options.map((opt,idx)=>{

              let color = "bg-slate-700"

              if(idx === q.correctIndex)
                color = "bg-green-700"

              if(idx === userAnswer && idx !== q.correctIndex)
                color = "bg-red-700"

              return (

                <div
                  key={idx}
                  className={`p-3 rounded-lg mb-2 ${color}`}
                >
                  {opt}
                </div>

              )

            })}

            <div className="mt-4 text-slate-300 text-sm">

              <div className="font-semibold mb-1">
                Explanation
              </div>

             <div className="mb-3">

<div className="font-semibold mb-1">
Reasoning
</div>

<div className="text-slate-300 text-sm">
{q.explanation.reasoning}
</div>

</div>

<div className="mb-3">

<div className="font-semibold mb-1">
Why the Correct Answer Works
</div>

<div className="text-slate-300 text-sm">
{q.explanation.why_correct}
</div>

</div>

<div className="mt-3">

<div className="font-semibold mb-2 text-yellow-400">
Birbal Trap Analysis
</div>

{q.explanation.traps.map((trap,i)=>{

return(

<div key={i} className="bg-slate-900 p-3 rounded-lg mb-2">

<div className="text-sm font-semibold">
Option {trap.optionIndex + 1}
</div>

<div className="text-xs text-red-400">
Trap: {trap.trap_type}
</div>

<div className="text-xs text-slate-400">
{trap.reason}
</div>

</div>

)

})}

</div>

            </div>

          </div>

        )

      })}

    </div>

  )

}

  if (phase === "running") {

   if (!drill || !drill.micro || !drill.mini_rc) {
  return <div className="p-8 text-white">Loading drill...</div>
}

  const questions = [
  ...(drill?.micro || []),
  ...(drill?.mini_rc?.questions || [])
]

    const q = questions[currentQ]
   function selectAnswer(idx) {

  setAnswers({
    ...answers,
    [currentQ]: idx
  })



}

    return (

      <div className="p-8 text-white">

       <div className="flex justify-between mb-6">

<h1 className="text-xl">
Precision Drill
</h1>

<div className="bg-slate-800 px-4 py-2 rounded-lg text-lg">
⏱ {formatTime(timeLeft)}
</div>

</div>

       <div className="mb-6 bg-slate-800 p-6 rounded-xl">

<div className="mb-3 text-slate-400">
Question {currentQ + 1} / {questions.length}
</div>

{q.paragraph && (
  <div className="mb-4 text-slate-300">
    {q.paragraph}
  </div>
)}

{currentQ >= 8 && (
  <div className="mb-4 text-slate-300">
    {drill.mini_rc.passage}
  </div>
)}

<div className="mb-4 font-semibold">
  {q.question}
</div>

{q.options.map((opt, idx) => (

  <div
    key={idx}
    onClick={() => selectAnswer(idx)}
    className={`p-3 rounded-lg mb-2 cursor-pointer
      ${
        answers[currentQ] === idx
          ? "bg-indigo-600"
          : "bg-slate-700"
      }`}
  >
    {opt}
  </div>

))}

</div>



    <div className="flex gap-4 mt-6">

<button
  onClick={() => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
      setShowExplanation(false)
    }
  }}
  className="px-4 py-2 bg-slate-700 rounded-lg"
> 
Previous
</button>

<button
  onClick={() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
      setShowExplanation(false)
    } else {
      setPhase("finished")
    }
  }}
  className="px-4 py-2 bg-indigo-600 rounded-lg"
> 
Next
</button>

</div>

      </div>

    )

  }

}