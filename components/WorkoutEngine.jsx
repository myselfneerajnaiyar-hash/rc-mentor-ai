"use client"
import { supabase } from "../lib/supabase"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine

} from "recharts"

const DEV_MODE = true

export default function WorkoutEngine({ 
  workout, 
  mode, 
  setView,
  initialAnswers = null,
  initialPhase = null
}) {
   const speedQuestions = workout?.speed?.questions || [];

console.log(
  "SPEED FIRST QUESTION:",
  workout?.speed?.questions?.[0]
)

if (speedQuestions.length === 0) {
  return <div className="p-8 text-white">Preparing speed drill...</div>;
}
  console.log("WORKOUT DATA:", workout)

 const [phase, setPhase] = useState(initialPhase || "speed")

  const [viewMode, setViewMode] = useState("workout") 
// workout | result | explanation


  /* ================= SPEED STATE ================= */

  const [speedIndex, setSpeedIndex] = useState(0)
  const [speedStage, setSpeedStage] = useState("paragraph") // paragraph | question
  const [speedTimer, setSpeedTimer] = useState(20)

  /* ================= VOCAB STATE ================= */

  const [vocabIndex, setVocabIndex] = useState(0)
  const [sectionTimer, setSectionTimer] = useState(null)

  /* ================= RC STATE ================= */

const [rcIndex, setRcIndex] = useState(0)
const [rcTimer, setRcTimer] = useState(null)

/* ================= MICRO STATE ================= */

const [microIndex, setMicroIndex] = useState(0)
const [microTimer, setMicroTimer] = useState(null)

const [attemptSaved, setAttemptSaved] = useState(false)

/* =========================================================
   RESET VOCAB TIMER ON ENTRY
========================================================= */
useEffect(() => {
  if (phase === "vocab") {
    setSectionTimer(300)
  }
}, [phase])

useEffect(() => {
  if (phase !== "result" || initialAnswers) return
  if (attemptSaved) return

 async function saveAttempt() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.log("No active session")
    return
  }

  const totalQuestions = Object.values(skillMap).reduce(
    (acc, s) => acc + s.total,
    0
  )

  const totalCorrect = Object.values(skillMap).reduce(
    (acc, s) => acc + s.correct,
    0
  )

  const totalWrong = Object.values(skillMap).reduce(
    (acc, s) => acc + s.wrong,
    0
  )

  const accuracy = totalQuestions
    ? (totalCorrect / totalQuestions) * 100
    : 0

  const response = await fetch("/api/save-attempt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      totalScore,
      result,
      skillMap,
      totalQuestions,
      totalCorrect,
      totalWrong,
      accuracy,
      userResponses: answers
    })
  })

  if (response.ok) {
    setAttemptSaved(true)
  } else {
    console.log("Save failed")
  }
}
  saveAttempt()

}, [phase])

  /* ================= ANSWERS ================= */

 const [answers, setAnswers] = useState(
  initialAnswers || {
    speed: {},
    vocab: {},
    rc1: {},
    rc2: {},
    micro: {},
  }
)
  const [openQuestion, setOpenQuestion] = useState(null)

  /* =========================================================
     SPEED TIMER LOGIC
  ========================================================= */

  useEffect(() => {
    if (phase !== "speed") return
    if (!workout?.speed?.questions?.length) return

    if (speedTimer <= 0) {
      if (speedStage === "paragraph") {
        setSpeedStage("question")
        setSpeedTimer(10)
      } else {
        if (speedIndex === workout.speed.questions.length - 1) {
          setPhase("vocab")
          setSectionTimer(300)
        } else {
          setSpeedIndex(prev => prev + 1)
          setSpeedStage("paragraph")
          setSpeedTimer(20)
        }
      }
      return
    }

    const interval = setInterval(() => {
      setSpeedTimer(t => t - 1)
    }, 1000)

    return () => clearInterval(interval)

  }, [phase, speedTimer])

  /* =========================================================
   VOCAB TIMER LOGIC
========================================================= */

useEffect(() => {
  if (phase !== "vocab") return
  if (sectionTimer === null) return

  if (sectionTimer <= 0) {
    setPhase("rc1")
    setRcIndex(0)
    setRcTimer(420) // 7 mins
    return
  }

  const interval = setInterval(() => {
    setSectionTimer(t => t - 1)
  }, 1000)

  return () => clearInterval(interval)

}, [phase, sectionTimer])

  /* =========================================================
   RC TIMER LOGIC
========================================================= */

useEffect(() => {
  if (phase !== "rc1" && phase !== "rc2") return
  if (rcTimer === null) return

  if (rcTimer <= 0) {
    if (phase === "rc1") {
      setPhase("rc2")
      setRcIndex(0)
      setRcTimer(480) // 8 mins
    } else {
      setPhase("micro")
    }
    return
  }

  const interval = setInterval(() => {
    setRcTimer(t => t - 1)
  }, 1000)

  return () => clearInterval(interval)

}, [phase, rcTimer])

/* =========================================================
   MICRO TIMER LOGIC
========================================================= */

useEffect(() => {
  if (phase !== "micro") return
  if (microTimer === null) return

  if (microTimer <= 0) {
    setPhase("result")
    return
  }

  const interval = setInterval(() => {
    setMicroTimer(t => t - 1)
  }, 1000)

  return () => clearInterval(interval)

}, [phase, microTimer])

  function handleSpeedAnswer(optionIndex) {
    if (speedStage !== "question") return

    setAnswers(prev => ({
      ...prev,
      speed: {
        ...prev.speed,
        [speedIndex]: optionIndex
      }
    }))
  }

  /* =========================================================
     VOCAB HANDLERS
  ========================================================= */

  function handleVocabAnswer(optionIndex) {
    setAnswers(prev => ({
      ...prev,
      vocab: {
        ...prev.vocab,
        [vocabIndex]: optionIndex
      }
    }))
  }

  function submitVocabEarly() {
  setPhase("rc1")
  setRcIndex(0)
  setRcTimer(420) // 7 mins
}
  /* =========================================================
     SAFE GUARD
  ========================================================= */

if (viewMode === "explanation") {

  const sections = ["speed", "vocab", "rc1", "rc2", "micro"]

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">

      <h1 className="text-3xl font-bold mb-8">
        Detailed Solutions
      </h1>

      <button
       onClick={() => setViewMode("workout")}
        className="mb-6 px-4 py-2 bg-slate-700 rounded-lg"
      >
        ← Back to Report
      </button>

      {sections.map(section => {

        const sectionData = workout[section]

        if (!sectionData?.questions) return null

        return (
          <div key={section} className="mb-10 bg-slate-800 p-6 rounded-2xl">

            <h2 className="text-2xl capitalize mb-6">
              {section}
            </h2>
            {(section === "rc1" || section === "rc2") && (
  <div className="mb-6 p-5 bg-slate-700 rounded-xl whitespace-pre-line text-slate-300">
    {sectionData.passage}
  </div>
)}

            {sectionData.questions.map((q, i) => {

              const userAnswer = answers[section]?.[i]

              return (
               <div key={i} className="mb-6 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">

                  {q.paragraph && (
                    <div className="mb-4 text-slate-300 whitespace-pre-line">
                      {q.paragraph}
                    </div>
                  )}

                  <div
  onClick={() =>
  setOpenQuestion(
    openQuestion === `${section}-${i}`
      ? null
      : `${section}-${i}`
  )
}
  className="cursor-pointer p-5 font-semibold bg-slate-700 hover:bg-slate-600 transition"
>
 <div className="space-y-2">

  <div className="font-medium">
    Q{i + 1}. {q.question}
  </div>

  <div className="flex items-center gap-3 text-xs">

    <div className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded-md uppercase tracking-wide text-slate-300">
      {q.skill?.replaceAll("_", " ")}
    </div>

    {userAnswer === undefined ? (
      <span className="text-yellow-400">Unattempted</span>
    ) : userAnswer === q.correctIndex ? (
      <span className="text-green-400">Correct</span>
    ) : (
      <span className="text-red-400">Incorrect</span>
    )}

  </div>

</div>
{openQuestion === `${section}-${i}` && (

<div className="p-5 bg-slate-800 animate-fadeIn">

    <div className="space-y-2 mb-4">
      {q.options.map((opt, idx) => {

        const isCorrect = idx === q.correctIndex
        const isUserChoice = idx === userAnswer

        let bgClass = "bg-slate-600"

        if (isCorrect) {
          bgClass = "bg-green-600"
        } else if (isUserChoice && !isCorrect) {
          bgClass = "bg-red-600"
        }

        return (
          <div
            key={idx}
            className={`p-3 rounded-lg ${bgClass}`}
          >
            {opt}
          </div>
        )
      })}
    </div>

    <div className="mb-2">
      Your Answer:{" "}
      <span className="text-yellow-400">
        {userAnswer !== undefined
          ? q.options[userAnswer]
          : "Not Attempted"}
      </span>
    </div>

    <div className="mb-3">
      Correct Answer:{" "}
      <span className="text-green-400">
        {q.options[q.correctIndex]}
      </span>
    </div>

    {detectThinkingTrap(q, userAnswer) && (
  <div className="mb-3 text-orange-400 text-sm">
    Thinking Trap: {detectThinkingTrap(q, userAnswer)}
  </div>
)}

    <div className="text-slate-300 leading-relaxed">
      {q.explanation || "Explanation not available."}
    </div>

  </div>

)}
</div>
 
                </div>

              )
            })}

          </div>
        )
      })}

    </div>
  )
}

 if (
  !workout ||
  !workout.speed?.questions ||
  !workout.vocab?.questions ||
  !workout.rc1?.questions ||
  !workout.rc2?.questions ||
  !workout.micro?.questions
) {
  return <div className="p-8 text-white">Preparing workout...</div>
}
    
  const { result, totalScore, skillMap } = calculateScore()

  /* =========================================================
     SPEED RENDER
  ========================================================= */

  if (phase === "speed") {

    if (!workout?.speed?.questions?.length) {
      return <div className="p-8 text-white">Preparing speed drill...</div>
    }

    const question = workout.speed.questions[speedIndex]

    return (
      <div className="p-8 text-white">

        <h2 className="text-xl font-semibold mb-4">
          Speed Drill ({speedIndex + 1}/{workout.speed.questions.length})
        </h2>

        <div className="mb-4">
          Time Left: {speedTimer}s
        </div>

      {speedStage === "paragraph" && (
  <div>
    <div className="bg-slate-800 p-6 rounded-xl">
      {question.paragraph}
    </div>

    {DEV_MODE && (
      <button
        onClick={() => {
          setSpeedStage("question")
          setSpeedTimer(10)
        }}
        className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg"
      >
        Skip Paragraph (DEV)
      </button>
    )}
  </div>
)}

        {speedStage === "question" && (
          <div className="space-y-4">

            <div className="bg-slate-800 p-6 rounded-xl">
              {question.question}
            </div>

          {question?.options?.map((opt, i) => (
  <button
    key={i}
    onClick={() => handleSpeedAnswer(i)}
    className={`block w-full text-left p-4 rounded-lg ${
      answers.speed[speedIndex] === i
        ? "bg-indigo-600"
        : "bg-slate-700 hover:bg-slate-600"
    }`}
  >
    {opt}
  </button>
))}

          </div>
        )}

      </div>
    )
  }

  /* =========================================================
     VOCAB RENDER
  ========================================================= */

  if (phase === "vocab") {

    if (!workout?.vocab?.questions?.length) {
      return <div className="p-8 text-white">Preparing vocab...</div>
    }

    const question = workout.vocab.questions[vocabIndex]
    if (!question?.options) {
  return <div>Loading...</div>
}

    return (
      <div className="p-8 text-white">

        <h2 className="text-xl font-semibold mb-4">
          Vocabulary Lab ({vocabIndex + 1}/{workout.vocab.questions.length})
        </h2>
        <div className="mb-4">
  Time Left: {sectionTimer}s
</div>

        <div className="bg-slate-800 p-6 rounded-xl mb-6">
          {question.question}
        </div>

        <div className="space-y-3">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleVocabAnswer(i)}
              className={`block w-full text-left p-4 rounded-lg
                ${answers.vocab[vocabIndex] === i
                  ? "bg-indigo-600"
                  : "bg-slate-700 hover:bg-slate-600"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">

          <button
            disabled={vocabIndex === 0}
            onClick={() => setVocabIndex(prev => prev - 1)}
            className="px-4 py-2 bg-slate-700 rounded-lg"
          >
            Previous
          </button>

          {vocabIndex < workout.vocab.questions.length - 1 ? (
            <button
              onClick={() => setVocabIndex(prev => prev + 1)}
              className="px-4 py-2 bg-slate-700 rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitVocabEarly}
              className="px-6 py-2 bg-indigo-600 rounded-lg"
            >
              Submit Section
            </button>
          )}

        </div>

      </div>
    )
  }

  /* =========================================================
   RC RENDER
========================================================= */

if (phase === "rc1" || phase === "rc2") {

  const section = phase === "rc1" ? workout.rc1 : workout.rc2

  if (!section?.questions?.length) {
    return <div className="p-8 text-white">Preparing RC...</div>
  }

  const question = section.questions[rcIndex]

  function handleRcAnswer(optionIndex) {
    setAnswers(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [rcIndex]: optionIndex
      }
    }))
  }

  function submitRCSection() {
  if (phase === "rc1") {
    setPhase("rc2")
    setRcIndex(0)
    setRcTimer(480)
  } else {
    setPhase("micro")
    setMicroIndex(0)
    setMicroTimer(300)
  }
}

  return (
    <div className="p-8 text-white">

      <h2 className="text-xl font-semibold mb-4">
        {phase === "rc1" ? "RC Passage 1" : "RC Passage 2"}
      </h2>

      <div className="mb-4">
        Time Left: {rcTimer}s
      </div>

      {/* Passage */}
      <div className="bg-slate-800 p-6 rounded-xl mb-6 whitespace-pre-line max-h-[280px] overflow-y-auto">
  {section.passage}
</div>

     {question.paragraph && (
  <div className="bg-slate-800 p-6 rounded-xl mb-6 whitespace-pre-line">
    {question.paragraph}
  </div>
)}

{/* Question */}
<div className="bg-slate-700 p-6 rounded-xl mb-4">
  {question.question}
</div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleRcAnswer(i)}
            className={`block w-full text-left p-4 rounded-lg
              ${answers[phase][rcIndex] === i
                ? "bg-indigo-600"
                : "bg-slate-700 hover:bg-slate-600"
              }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">

        <button
          disabled={rcIndex === 0}
          onClick={() => setRcIndex(prev => prev - 1)}
          className="px-4 py-2 bg-slate-700 rounded-lg"
        >
          Previous
        </button>

        {rcIndex < section.questions.length - 1 ? (
          <button
            onClick={() => setRcIndex(prev => prev + 1)}
            className="px-4 py-2 bg-slate-700 rounded-lg"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitRCSection}
            className="px-6 py-2 bg-indigo-600 rounded-lg"
          >
            Submit Section
          </button>
        )}

      </div>

    </div>
  )
}


/* =========================================================
   MICRO ROUND RENDER
========================================================= */

if (phase === "micro") {

  if (!workout?.micro?.questions?.length) {
    return <div className="p-8 text-white">Preparing Micro Round...</div>
  }

  const question = workout.micro.questions[microIndex]

  function handleMicroAnswer(optionIndex) {
    setAnswers(prev => ({
      ...prev,
      micro: {
        ...prev.micro,
        [microIndex]: optionIndex
      }
    }))
  }


  function submitMicroSection() {
    setPhase("result")
  }

  return (
    <div className="p-8 text-white">

      <h2 className="text-xl font-semibold mb-4">
        Micro Skill Round ({microIndex + 1}/{workout.micro.questions.length})
      </h2>

      <div className="mb-4">
        Time Left: {microTimer}s
      </div>

     {/* Paragraph */}
<div className="bg-slate-800 p-6 rounded-xl mb-4 whitespace-pre-line">
  {question.paragraph}
</div>

{/* Question */}
<div className="bg-slate-700 p-6 rounded-xl mb-4">
  {question.question}
</div>

      <div className="space-y-3">
       {(question.options || []).map((opt, i) => (
          <button
            key={i}
            onClick={() => handleMicroAnswer(i)}
            className={`block w-full text-left p-4 rounded-lg
              ${answers.micro[microIndex] === i
                ? "bg-indigo-600"
                : "bg-slate-700 hover:bg-slate-600"
              }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-6">

        <button
          disabled={microIndex === 0}
          onClick={() => setMicroIndex(prev => prev - 1)}
          className="px-4 py-2 bg-slate-700 rounded-lg"
        >
          Previous
        </button>

        {microIndex < workout.micro.questions.length - 1 ? (
          <button
            onClick={() => setMicroIndex(prev => prev + 1)}
            className="px-4 py-2 bg-slate-700 rounded-lg"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitMicroSection}
            className="px-6 py-2 bg-indigo-600 rounded-lg"
          >
            Submit Section
          </button>
        )}

      </div>

    </div>
  )
}

 if (phase === "result") {


 

  const scoreImpactData = Object.entries(skillMap).map(
  ([skill, data]) => ({
    skill: skill.replaceAll("_", " "),
    score: data.netScore
  })
)
 const sortedImpactData = [...scoreImpactData].sort(
  (a, b) => b.score - a.score
)


const maxImpact = Math.max(...sortedImpactData.map(d => d.score))
const minImpact = Math.min(...sortedImpactData.map(d => d.score))

const strongest = sortedImpactData[0]
const weakest = sortedImpactData[sortedImpactData.length - 1]
  const chartData = Object.entries(skillMap).map(([skill, data]) => {
  const accuracy = data.total
    ? (data.correct / data.total) * 100
    : 0

  return {
    skill: skill.replaceAll("_", " "),
    accuracy: Number(accuracy.toFixed(1))
  }
})

 function generateMentorMessage(skillMap, result, totalScore) {

  const messages = []

  /* ========================
     1️⃣ CRITICAL SKILL WEAKNESS
  ======================== */
  Object.entries(skillMap).forEach(([skill, data]) => {
    if (data.total === 0) return

    const accuracy = (data.correct / data.total) * 100

    if (accuracy < 35) {
      messages.push(
        `Severe weakness in ${skill.replaceAll("_", " ")}`
      )
    }
  })

  /* ========================
     2️⃣ RC COLLAPSE DETECTION
  ======================== */
  if (result.rc1.score <= 0) {
    messages.push("RC1 breakdown under sustained argument structure")
  }

  if (result.rc2.score <= 0) {
    messages.push("RC2 instability in handling abstract passages")
  }

  /* ========================
     3️⃣ LOW ATTEMPT DETECTION
  ======================== */
  const totalQuestions =
    Object.values(skillMap).reduce((acc, s) => acc + s.total, 0)

  const totalCorrect =
    Object.values(skillMap).reduce((acc, s) => acc + s.correct, 0)

  const overallAccuracy = totalQuestions
    ? (totalCorrect / totalQuestions) * 100
    : 0

  if (overallAccuracy < 50 && totalQuestions > 20) {
    messages.push("Over-attempting without sufficient accuracy control")
  }

  /* ========================
     4️⃣ STRENGTH SIGNAL
  ======================== */
  const strongSkills = Object.entries(skillMap)
    .filter(([_, data]) => {
      if (data.total === 0) return false
      return (data.correct / data.total) * 100 > 80
    })
    .map(([skill]) => skill.replaceAll("_", " "))

  let strengthMessage = ""
  if (strongSkills.length > 0) {
    strengthMessage = `Strength visible in ${strongSkills.join(", ")}.`
  }

  /* ========================
     5️⃣ PROFILE CLASSIFICATION
  ======================== */
  let profileTag = ""

  if (totalScore > 35) {
    profileTag = "High percentile trajectory."
  } else if (totalScore > 20) {
    profileTag = "Developing competitive profile."
  } else {
    profileTag = "Foundation rebuilding phase."
  }

  /* ========================
     FINAL MESSAGE BUILD
  ======================== */

  if (messages.length === 0) {
    return `${profileTag} Balanced analytical structure. Focus on scaling attempt volume with precision. ${strengthMessage}`
  }

  return `${profileTag} ${messages.join(
    ". "
  )}. Targeted correction here will significantly elevate percentile potential. ${strengthMessage}`
}
  return (
    <div className="p-8 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Your Workout Report
      </h1>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">

  <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-center">
    <div className="text-slate-400 text-sm">Overall Accuracy</div>
    <div className="text-3xl font-bold mt-2">
      {(
        Object.values(skillMap).reduce((acc, s) => acc + s.correct, 0) /
        Object.values(skillMap).reduce((acc, s) => acc + s.total, 0) *
        100
      ).toFixed(1)}%
    </div>
  </div>

  <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-center">
    <div className="text-slate-400 text-sm">Attempt Rate</div>
   <div className="text-3xl font-bold mt-2">
  {(() => {
    const attempted =
      Object.values(skillMap).reduce(
        (acc, s) => acc + s.correct + s.wrong,
        0
      )

    const totalQuestions =
      workout.speed.questions.length +
      workout.vocab.questions.length +
      workout.rc1.questions.length +
      workout.rc2.questions.length +
      workout.micro.questions.length

    const attemptRate = (attempted / totalQuestions) * 100

    return attemptRate.toFixed(1) + "%"
  })()}
</div>
</div>

  <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-center">
    <div className="text-slate-400 text-sm">Performance Tier</div>
    <div className="text-xl font-semibold mt-2">
      {totalScore > 25
        ? "Strong"
        : totalScore > 15
        ? "Developing"
        : "Foundation Stage"}
    </div>
  </div>

</div>

      <div className="mb-8 text-2xl">
        Total Score:{" "}
        <span className="text-indigo-400">
          {totalScore.toFixed(2)}
        </span>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Skill Diagnosis */}
        <div className="bg-slate-800 p-5 rounded-2xl shadow-lg space-y-2">
          <h2 className="text-2xl font-semibold mb-6">
            Skill Diagnosis
          </h2>

          {Object.entries(skillMap).map(([skill, data]) => {
  const accuracy = data.total
  ? (data.correct / data.total) * 100
  : 0

  return (
    <div key={skill} className="mb-5">

      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize">
          {skill.replaceAll("_", " ")}
        </span>
      <span>{accuracy.toFixed(1)}%</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-3">
        <div
  className={`h-3 rounded-full transition-all duration-500 ${
    accuracy >= 80
      ? "bg-green-500"
      : accuracy >= 50
      ? "bg-yellow-400"
      : "bg-red-500"
  }`}
  style={{ width: `${accuracy}%` }}
></div>
      </div>

    </div>
  )
})}
        </div>

        {/* Mentor Insight */}
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            Mentor Insight
          </h2>

          <p className="text-slate-300 leading-relaxed">
            {generateMentorMessage(skillMap, result, totalScore)}
          </p>
        </div>

      </div>

      {/* SECTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

        {Object.entries(result).map(([section, data]) => (
          <div key={section} className="bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg space-y-1">

            <h2 className="text-xl capitalize mb-3">
              {section}
            </h2>

           <div className="flex justify-between">
  <span>Correct</span>
  <span className="text-green-400">{data.correct}</span>
</div>

<div className="flex justify-between">
  <span>Wrong</span>
  <span className="text-red-400">{data.wrong}</span>
</div>

<div className="flex justify-between">
  <span>Unattempted</span>
  <span className="text-yellow-400">{data.unattempted}</span>
</div>
           

            <div className="mt-2 font-semibold">
              Section Score: {data.score.toFixed(2)}
            </div>

          </div>
        ))}

      </div>



<div className="mt-10 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700">
  <h2 className="text-2xl font-semibold mb-6">
    Score Impact Analysis
  </h2>

  <div style={{ width: "100%", height: 380 }}>

    <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-4 text-xs md:text-sm">
  <div className="text-green-400">
    🔥 Strongest: {strongest.skill.replaceAll("_", " ")}
  </div>
  <div className="text-red-400">
    ⚠ Weakest: {weakest.skill.replaceAll("_", " ")}
  </div>
</div>
    <ResponsiveContainer>
     
      <BarChart
        data={scoreImpactData}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
      >
       <CartesianGrid
  stroke="#334155"
  strokeDasharray="4 4"
  horizontal={false}
/>
      <XAxis
  type="number"
  stroke="#94a3b8"
  domain={[minImpact - 2, maxImpact + 2]}
/>
        <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
      <YAxis
  dataKey="skill"
  type="category"
  width={90}
  tick={{ fontSize: 12 }}
  stroke="#94a3b8"
/>
     <Tooltip
  cursor={{ fill: "rgba(255,255,255,0.05)" }}
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "10px"
  }}
  labelStyle={{ color: "#e2e8f0" }}
  itemStyle={{ color: "#22c55e" }}
 formatter={(value) => [
  <span style={{ color: value < 0 ? "#ef4444" : "#22c55e" }}>
    {Number(value).toFixed(2)}
  </span>,
  "Score"
]}
/>
     <Bar
  dataKey="score"
  radius={[0, 10, 10, 0]}
  shape={(props) => {
    const { x, y, width, height, payload } = props

    const isNegative = payload.score < 0

    const adjustedX = isNegative ? x + width : x
    const adjustedWidth = Math.abs(width)

    const color = isNegative ? "#ef4444" : "#22c55e"

    return (
      <rect
        x={adjustedX}
        y={y}
        width={adjustedWidth}
        height={height}
        fill={color}
        rx={10}
      />
    )
  }}
/>
      </BarChart>
    </ResponsiveContainer>
  </div>
  <div className="mt-8 text-sm text-slate-400 leading-relaxed">
  Net Score Driver:{" "}
  <span className="text-green-400 font-semibold">
    {strongest.skill.replaceAll("_", " ")}
  </span>{" "}
 contributed {strongest.score.toFixed(2)} marks
  {weakest.score < 0 && (
    <>
      {" "}Loss due to{" "}
      <span className="text-red-400 font-semibold">
        {weakest.skill.replaceAll("_", " ")}
      </span>{" "}
     was {weakest.score.toFixed(2)}
    </>
  )}
</div>
</div>

<div className="mt-10 text-center">
  <button
    onClick={() => setViewMode("explanation")}
    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition"
  >
    View Detailed Solutions
  </button>
</div>
    </div>
  )
}

function detectThinkingTrap(q, userAnswer) {

  if (userAnswer === undefined) return null
  if (userAnswer === q.correctIndex) return null

  const userOption = q.options[userAnswer]
  const correctOption = q.options[q.correctIndex]

  const lowerUser = userOption.toLowerCase()
  const lowerCorrect = correctOption.toLowerCase()

  // Extreme language trap
  if (
    lowerUser.includes("always") ||
    lowerUser.includes("never") ||
    lowerUser.includes("completely") ||
    lowerUser.includes("entirely")
  ) {
    return "Extreme Language Trap"
  }

  // Scope expansion
  if (userOption.length > correctOption.length + 40) {
    return "Scope Expansion"
  }

  // Reversal trap
  if (
    lowerUser.includes("opposite") ||
    lowerUser.includes("contradict")
  ) {
    return "Reversal Trap"
  }

  // Overgeneralisation
  if (
    lowerUser.includes("all") ||
    lowerUser.includes("every")
  ) {
    return "Overgeneralisation Trap"
  }

  return "Interpretation Drift"
}

function calculateScore() {

  let totalScore = 0
  const skillMap = {}

  const result = {
    speed: { correct: 0, wrong: 0, unattempted: 0, score: 0 },
    vocab: { correct: 0, wrong: 0, unattempted: 0, score: 0 },
    rc1: { correct: 0, wrong: 0, unattempted: 0, score: 0 },
    rc2: { correct: 0, wrong: 0, unattempted: 0, score: 0 },
    micro: { correct: 0, wrong: 0, unattempted: 0, score: 0 },
  }

  // SPEED
  workout.speed.questions.forEach((q, i) => {
  const userAns = answers.speed[i]
  const skill = q.skill || "unknown"

 if (!skillMap[skill]) {
  skillMap[skill] = {
    correct: 0,
    wrong: 0,
    total: 0,
    netScore: 0
  }
}

  skillMap[skill].total++

  if (userAns === undefined) {
    result.speed.unattempted++
  } else if (userAns === q.correctIndex) {
    result.speed.correct++
    result.speed.score += 1
    skillMap[skill].correct++
    skillMap[skill].netScore += 1
  } else {
    result.speed.wrong++
    result.speed.score -= 0.33
    skillMap[skill].wrong++
    skillMap[skill].netScore -= 0.33
  }
})

  // VOCAB
 workout.vocab.questions.forEach((q, i) => {
  const userAns = answers.vocab[i]
  const skill = q.skill || "unknown"

 if (!skillMap[skill]) {
  skillMap[skill] = {
    correct: 0,
    wrong: 0,
    total: 0,
    netScore: 0
  }
}

  skillMap[skill].total++

  if (userAns === undefined) {
    result.vocab.unattempted++
  } else if (userAns === q.correctIndex) {
    result.vocab.correct++
    result.vocab.score += 1
    skillMap[skill].correct++
    skillMap[skill].netScore += 1
  } else {
    result.vocab.wrong++
    result.vocab.score -= 0.33
    skillMap[skill].wrong++
    skillMap[skill].netScore -= 0.33
  }
})

  // RC1
  workout.rc1.questions.forEach((q, i) => {
  const userAns = answers.rc1[i]
  const skill = q.skill || "unknown"

 if (!skillMap[skill]) {
  skillMap[skill] = {
    correct: 0,
    wrong: 0,
    total: 0,
    netScore: 0
  }
}

  skillMap[skill].total++

  if (userAns === undefined) {
    result.rc1.unattempted++
  } else if (userAns === q.correctIndex) {
    result.rc1.correct++
    result.rc1.score += 3
    skillMap[skill].correct++
    skillMap[skill].netScore += 3
  } else {
    result.rc1.wrong++
    result.rc1.score -= 1
    skillMap[skill].wrong++
    skillMap[skill].netScore -= 1
  }
})

  // RC2
 workout.rc2.questions.forEach((q, i) => {
  const userAns = answers.rc2[i]
  const skill = q.skill || "unknown"

 if (!skillMap[skill]) {
  skillMap[skill] = {
    correct: 0,
    wrong: 0,
    total: 0,
    netScore: 0
  }
}

  skillMap[skill].total++

  if (userAns === undefined) {
    result.rc2.unattempted++
  } else if (userAns === q.correctIndex) {
    result.rc2.correct++
    result.rc2.score += 3
    skillMap[skill].correct++
    skillMap[skill].netScore += 3

  } else {
    result.rc2.wrong++
    result.rc2.score -= 1
    skillMap[skill].wrong++
    skillMap[skill].netScore -= 1
  }
})

  // MICRO
 workout.micro.questions.forEach((q, i) => {
  const userAns = answers.micro[i]
  const skill = q.skill || "unknown"

 if (!skillMap[skill]) {
  skillMap[skill] = {
    correct: 0,
    wrong: 0,
    total: 0,
    netScore: 0
  }
}

  skillMap[skill].total++

  if (userAns === undefined) {
    result.micro.unattempted++
  } else if (userAns === q.correctIndex) {
    result.micro.correct++
    result.micro.score += 3
    skillMap[skill].correct++
    skillMap[skill].netScore += 3
  } else {
    result.micro.wrong++
    result.micro.score -= 1
    skillMap[skill].wrong++
    skillMap[skill].netScore -= 1
  }
})

  totalScore =
    result.speed.score +
    result.vocab.score +
    result.rc1.score +
    result.rc2.score +
    result.micro.score

  return { result, totalScore, skillMap }
}



  return <div className="p-8 text-white">Next phase coming...</div>
}