"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";

function SkillTooltip({ active, payload }) {

  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  let level = "";

  if (data.score >= 80)
    level = "Excellent";

  else if (data.score >= 60)
    level = "Strong";

  else if (data.score >= 40)
    level = "Needs Practice";

  else
    level = "Priority Focus";

  return (

<div className="rounded-xl bg-slate-900 border border-cyan-500 p-4 shadow-xl w-72">

<h3 className="text-cyan-400 font-bold text-lg">

{data.skill}

</h3>

<p className="text-white mt-2">

Accuracy: <b>{data.score}%</b>

</p>

<p className="text-slate-300">
Questions Attempted: <b>{data.total}</b>
</p>

<p className="text-slate-300">
Correct Answers: <b>{data.correct}</b>
</p>

<p className="mt-3 text-yellow-300">

Performance: {level}

</p>

<p className="text-sm text-slate-400 mt-2">

{data.feedback}

</p>

</div>

);

}

export default function SkillRadar({

  rcAttempts = [],

  vaAttempts = []

}) {

  const skills = {};

  [...rcAttempts, ...vaAttempts].forEach((attempt) => {

    const diagnosis =
      attempt.sectional_question_content?.diagnosis ||
      attempt.sectional_va_content?.diagnosis;

    if (!diagnosis) return;

    const currentSkills = [];

    if (diagnosis.primarySkill)
      currentSkills.push(diagnosis.primarySkill);

    if (diagnosis.secondarySkill)
      currentSkills.push(diagnosis.secondarySkill);

    if (diagnosis.skillTested)
      currentSkills.push(diagnosis.skillTested);

    currentSkills.forEach((skill) => {

      if (!skills[skill]) {

        skills[skill] = {
          total: 0,
          correct: 0
        };

      }

      skills[skill].total++;

      if (attempt.is_correct)
        skills[skill].correct++;

    });

  });

  const radarData = Object.entries(skills)
  .map(([skill, value]) => ({
    skill,
    score: Math.round((value.correct / value.total) * 100),

    total: value.total,
    correct: value.correct
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 8);

console.log("Radar Data", radarData);

const vaSkills = {
  "Para Jumble": { total: 0, correct: 0 },
  "Odd One Out": { total: 0, correct: 0 },
  "Para Summary": { total: 0, correct: 0 },
  "Sentence Placement": { total: 0, correct: 0 },
  "Para Completion": { total: 0, correct: 0 }
};

vaAttempts.forEach((attempt) => {

  let skill = "";

 switch (attempt.question_type) {

  case "Para Jumble":
    skill = "Para Jumble";
    break;

  case "Odd Sentence Out":
    skill = "Odd One Out";
    break;

  case "Para Summary":
    skill = "Para Summary";
    break;

  case "Sentence Placement":
    skill = "Sentence Placement";
    break;

  case "Para Completion":
    skill = "Para Completion";
    break;

  default:
    console.log("Unknown Type:", attempt.question_type);
    return;
}

  vaSkills[skill].total++;

  if (attempt.is_correct)
    vaSkills[skill].correct++;

});

console.log(vaAttempts);

const vaRadarData = Object.entries(vaSkills).map(([skill, value]) => ({
  skill,
  score:
    value.total === 0
      ? 0
      : Math.round((value.correct / value.total) * 100),

  total: value.total,
  correct: value.correct
}));

console.log("VA Radar", vaRadarData);
return (

<div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8">

<h2 className="text-3xl font-bold text-white mb-8">

Skill Radar

</h2>

<p className="text-slate-400 mb-6 max-w-3xl leading-7">
This radar maps your performance across different verbal skills.
The farther a point is from the centre, the stronger your performance in that skill.
Scores near the centre indicate skills that require the most improvement.
</p>

<div className="h-[500px]">

<RadarChart
  width={700}
  height={500}
  cx="50%"
  cy="50%"
  outerRadius={180}
  data={radarData}
>

<PolarGrid />

<PolarAngleAxis
  dataKey="skill"
  tick={{
    fill: "#ffffff",
    fontSize: 13
  }}
/>

<Tooltip
  content={<SkillTooltip />}
/>

<PolarRadiusAxis
domain={[0,100]}
tick={{ fill: "#94a3b8", fontSize: 12 }}
tickCount={5}
/>
<Radar

dataKey="score"

stroke="#06b6d4"

fill="#06b6d4"

fillOpacity={0.45}

/>

</RadarChart>
<div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">

  <div className="rounded-xl bg-slate-800 p-4">
    <p className="text-cyan-300 font-semibold">80–100</p>
    <p className="text-slate-400 text-sm">
      Strong skill
    </p>
  </div>

  <div className="rounded-xl bg-slate-800 p-4">
    <p className="text-yellow-300 font-semibold">60–79</p>
    <p className="text-slate-400 text-sm">
      Good but improvable
    </p>
  </div>

  <div className="rounded-xl bg-slate-800 p-4">
    <p className="text-orange-300 font-semibold">40–59</p>
    <p className="text-slate-400 text-sm">
      Needs practice
    </p>
  </div>

  <div className="rounded-xl bg-slate-800 p-4">
    <p className="text-red-400 font-semibold">&lt;40</p>
    <p className="text-slate-400 text-sm">
      High priority
    </p>
  </div>

</div>
<div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8 mt-12">

<h2 className="text-3xl font-bold text-white mb-8">
Verbal Ability Skill Radar
</h2>

<p className="text-slate-400 mb-6 max-w-3xl leading-7">
This radar maps your performance across Verbal Ability question types.
</p>

<div className="h-[500px]">

<RadarChart
  width={700}
  height={500}
  cx="50%"
  cy="50%"
  outerRadius={180}
  data={vaRadarData}
>

<PolarGrid />

<PolarAngleAxis
  dataKey="skill"
  tick={{
    fill:"#ffffff",
    fontSize:13
  }}
/>

<Tooltip
  content={<SkillTooltip />}
/>

<PolarRadiusAxis
  domain={[0,100]}
  tick={{fill:"#94a3b8",fontSize:12}}
/>

<Radar
  dataKey="score"
  stroke="#22c55e"
  fill="#22c55e"
  fillOpacity={0.45}
/>

</RadarChart>

</div>

</div>


</div>

</div>

);
}