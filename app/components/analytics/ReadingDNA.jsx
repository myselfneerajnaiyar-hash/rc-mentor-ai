"use client";

import {
  Brain,
  Target,
  Zap,
  TrendingUp
} from "lucide-react";

export default function ReadingDNA({

  rcAttempts = [],

  vaAttempts = [],

  avgTime = 0

}) {

 const skillStats = {};
const trapStats = {};
const errorStats = {};

const allAttempts = [...rcAttempts, ...vaAttempts];

console.log("RC Attempts", rcAttempts);
console.log("VA Attempts", vaAttempts);

if (rcAttempts.length > 0) {
  console.log(
    "RC Diagnosis",
    rcAttempts[0].sectional_question_content?.diagnosis
  );
}

if (vaAttempts.length > 0) {
  console.log(
    "VA Diagnosis",
    vaAttempts[0].sectional_va_content?.diagnosis
  );
}

allAttempts.forEach((attempt) => {

  const diagnosis =
    attempt.sectional_question_content?.diagnosis ||
    attempt.sectional_va_content?.diagnosis;

  if (!diagnosis) return;

  // ---------------- SKILLS ----------------

  const skills = [];

  if (diagnosis.primarySkill)
    skills.push(diagnosis.primarySkill);

  if (diagnosis.secondarySkill)
    skills.push(diagnosis.secondarySkill);

  if (diagnosis.skillTested)
    skills.push(diagnosis.skillTested);

  skills.forEach((skill) => {

    if (!skillStats[skill]) {

      skillStats[skill] = {
        total: 0,
        correct: 0
      };

    }

    skillStats[skill].total++;

    if (attempt.is_correct)
      skillStats[skill].correct++;

  });

  // ---------------- TRAPS ----------------

  if (diagnosis.trapType) {

    if (!trapStats[diagnosis.trapType]) {

      trapStats[diagnosis.trapType] = {
        total: 0,
        wrong: 0
      };

    }

    trapStats[diagnosis.trapType].total++;

    if (!attempt.is_correct)
      trapStats[diagnosis.trapType].wrong++;

  }

  // ---------------- COGNITIVE ERRORS ----------------

  const error =
    diagnosis.cognitiveErrorTested ||
    diagnosis.whyStudentsFail;

  if (error) {

    if (!errorStats[error])
      errorStats[error] = 0;

    if (!attempt.is_correct)
      errorStats[error]++;

  }

});
const skillAccuracy = Object.entries(skillStats)

  .filter(([_, value]) => value.total >= 2)

  .map(([skill, value]) => ({

    skill,

    accuracy:
      (value.correct / value.total) * 100,

    total: value.total

  }));

skillAccuracy.sort((a, b) => b.accuracy - a.accuracy);

const strongestSkill =
  skillAccuracy[0]?.skill || "Not enough data";

  const worstTrap =
  Object.entries(trapStats)
    .sort((a,b)=>b[1].wrong-a[1].wrong)[0]?.[0];

const biggestError =
  Object.entries(errorStats)
    .sort((a,b)=>b[1]-a[1])[0]?.[0];

const weakestSkill =
  skillAccuracy[skillAccuracy.length - 1]?.skill || "Not enough data";

  let readingStyle = "Balanced Reader";

if (avgTime < 1200) {
  readingStyle = "Fast Reader";
} else if (avgTime > 2400) {
  readingStyle = "Deep Reader";
}

const readingDescriptions = {
  "Fast Reader":
    "You read quickly but accuracy falls on tougher questions.",

  "Balanced Reader":
    "You maintain an excellent balance between speed and comprehension.",

  "Deep Reader":
    "You understand passages well but spend slightly too much time."
};

  const descriptions = {

  "Main Idea":
    "You consistently capture the author's central message.",

  "Inference":
    "Your biggest gains will come from strengthening inference making.",

  "Detail":
    "You rarely miss factual information hidden inside passages.",

  "Application":
    "Applying ideas to unfamiliar situations needs more practice.",

  "Logical Continuity":
    "Focus on connecting ideas across paragraphs.",

  "Sentence Order":
    "Paragraph arrangement questions require additional work.",

  "Central Idea":
    "You occasionally miss the broader theme of the passage."

};

const recommendation =

worstTrap

? `Most of your mistakes come from "${worstTrap}" traps. The underlying thinking error is "${biggestError}". Birbal recommends practising questions based on this trap before attempting another sectional.`

: "Attempt more sectionals so Birbal can build your Reading DNA.";
  return (

    <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-2xl">

      <div className="flex items-center gap-3 mb-8">

        <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">

          <Brain className="h-7 w-7 text-cyan-400" />

        </div>

        <div>

          <h2 className="text-3xl font-bold text-white">

            Reading DNA

          </h2>

          <p className="text-slate-400">

            Understand your natural reading behaviour.

          </p>

        </div>

      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Strength */}

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">

          <div className="flex items-center gap-3 mb-3">

            <TrendingUp className="text-emerald-400" />

            <h3 className="font-semibold text-emerald-300">

              Primary Strength

            </h3>

          </div>

          <h2 className="text-2xl font-bold text-white">

            {strongestSkill}

          </h2>

          <p className="text-slate-300 mt-2">

            {descriptions[strongestSkill]}

          </p>

        </div>

        {/* Weakness */}

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-6">

          <div className="flex items-center gap-3 mb-3">

            <Target className="text-orange-400" />

            <h3 className="font-semibold text-orange-300">

              Biggest Opportunity

            </h3>

          </div>

          <h2 className="text-2xl font-bold text-white">

            {weakestSkill}

          </h2>

          <p className="text-slate-300 mt-2">

           {descriptions[weakestSkill]}

          </p>

        </div>

        {/* Reading Style */}

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6">

          <div className="flex items-center gap-3 mb-3">

            <Zap className="text-cyan-400" />

            <h3 className="font-semibold text-cyan-300">

              Reading Style

            </h3>

          </div>

          <h2 className="text-2xl font-bold text-white">

            {readingStyle}

          </h2>

          <p className="text-slate-300 mt-2">

            {readingDescriptions[readingStyle]}

          </p>

        </div>

        {/* Recommendation */}

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-6">

          <div className="flex items-center gap-3 mb-3">

            <Brain className="text-violet-400" />

            <h3 className="font-semibold text-violet-300">

              Birbal's Recommendation

            </h3>

          </div>

          <p className="text-white text-lg leading-8">

            {recommendation}

          </p>

        </div>

      </div>

    </div>

  );

}