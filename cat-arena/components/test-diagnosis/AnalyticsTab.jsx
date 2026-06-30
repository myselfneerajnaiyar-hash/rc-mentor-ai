"use client";
import { Card, CardContent } from "@/components/ui/card";
import { buildAnalytics } from "../../lib/buildAnalytics";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

import {
  Trophy,
  Target,
  Clock3,
  BarChart3,
  BookOpen,
  Brain,
  Percent,
  Timer,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) {
  return (
    <div
      className="
      rounded-2xl
      border
      border-cyan-500/20
      bg-slate-900/60
      p-6
      backdrop-blur
      "
    >
      <div className="flex items-center justify-between">

        <div>

          <div className="text-slate-400 text-sm">
            {title}
          </div>

          <div
            className={`mt-3 text-4xl font-black ${color}`}
          >
            {value}
          </div>

          <div className="mt-2 text-slate-500 text-sm">
            {subtitle}
          </div>

        </div>

        <div
          className="
          h-14
          w-14
          rounded-xl
          bg-cyan-500/10
          flex
          items-center
          justify-center
          "
        >
          <Icon className="h-7 w-7 text-cyan-300" />
        </div>

      </div>
    </div>
  );
}

export default function AnalyticsTab(props) {

   const analytics = buildAnalytics(props.attempt);

   console.log("Difficulty Time", analytics.difficultyTimeAnalysis);
   const { kpis } = analytics;
   const {
  cumulativeScore,
  timePerQuestion,
  passagePerformance,
  accuracyTrend,
  difficultyAnalysis,
  difficultyTimeAnalysis,
  difficultyTimeline,
  difficultyRows,
} = analytics;

const {
  marksDistribution,
} = analytics;
console.log(cumulativeScore);

console.log("ANALYTICS", analytics);

console.log(analytics);
    

  return (

    <div className="space-y-10">

      {/* HERO */}

      <div>

        <div className="text-6xl font-black text-white">
          Test Analytics
        </div>

        <div className="mt-3 text-slate-400 text-lg">
          Every second. Every mark. Every decision.
        </div>

      </div>

      {/* KPI */}

      <div className="grid md:grid-cols-4 gap-6">

        <StatCard
  title="Overall Score"
  value={kpis.score}
subtitle={`Out of ${kpis.totalMarks}`}
  icon={Trophy}
  color="text-yellow-300"
/>

       <StatCard
  title="Accuracy"
 value={`${kpis.accuracy}%`}
subtitle={`${kpis.correct}/${kpis.attempted}`}
  icon={Target}
  color="text-emerald-300"
/>

        <StatCard
  title="Attempt Rate"
 value={`${kpis.attemptRate}%`}
subtitle={`${kpis.attempted}/${kpis.total}`}
  icon={Percent}
  color="text-cyan-300"
/>

        <StatCard
  title="Net Correct"
  value={kpis.correct - kpis.wrong}
  subtitle={`${kpis.correct} Correct • ${kpis.wrong} Wrong`}
  icon={BarChart3}
  color="text-purple-300"
/>

        <StatCard
  title="RC Score"
  value={kpis.rcScore}
  subtitle={`${kpis.rcCorrect}/${kpis.rcAttempted} Correct`}
  icon={BookOpen}
  color="text-cyan-300"
/>

       <StatCard
  title="VA Score"
  value={kpis.vaScore}
  subtitle={`${kpis.vaCorrect}/${kpis.vaAttempted} Correct`}
  icon={Brain}
  color="text-pink-300"
/>

        <StatCard
          title="Net Time"
          value={`${Math.floor(kpis.totalTime/60)}m`}
subtitle={`${kpis.totalTime}s`}
          icon={Clock3}
          color="text-amber-300"
        />

       <StatCard
  title="Skipped Questions"
  value={kpis.skipped}
  subtitle={`${kpis.skipped} out of ${kpis.total}`}
  icon={Timer}
  color="text-orange-300"
/>
      </div>

      <Card className="bg-slate-900/60 border-cyan-500/20">

  <CardContent className="p-8">

    <div className="mb-8">

      <h2 className="text-3xl font-black text-white">
        Score Progress
      </h2>

      <p className="text-slate-400 mt-2">
        How your score changed after every question.
      </p>

    </div>

    <div className="w-full h-[420px] min-w-0">
  <ResponsiveContainer width="99%" height={420}>

        <AreaChart data={cumulativeScore}>

          <defs>

            <linearGradient
              id="scoreGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >

              <stop
                offset="5%"
                stopColor="#06b6d4"
                stopOpacity={0.8}
              />

              <stop
                offset="95%"
                stopColor="#06b6d4"
                stopOpacity={0}
              />

            </linearGradient>

          </defs>

          <CartesianGrid
            stroke="#334155"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="question"
            tick={{ fill: "#94a3b8" }}
          />

          <YAxis
            tick={{ fill: "#94a3b8" }}
          />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="score"
            stroke="#06b6d4"
            strokeWidth={4}
            fill="url(#scoreGradient)"
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>

  </CardContent>

</Card>

      <Card className="bg-slate-900/60 border-cyan-500/20">

  <CardContent className="p-8">

    <div className="mb-8">

      <h2 className="text-3xl font-black text-white">
        Question Timeline
      </h2>

      <p className="text-slate-400 mt-2">
        Correct, wrong and skipped questions with time spent.
      </p>

    </div>

    <div className="w-full h-[420px]">

      <ResponsiveContainer width="99%" height={420}>
        <div className="flex gap-6 mb-6 text-sm">

  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-green-500" />
    <span className="text-slate-300">Correct</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-red-500" />
    <span className="text-slate-300">Wrong</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-slate-400" />
    <span className="text-slate-300">Unattempted</span>
  </div>

</div>

        <BarChart data={analytics.questionTimeline}>

          <CartesianGrid
            stroke="#334155"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="question"
            tick={{ fill: "#94a3b8" }}
          />

          <YAxis
            tick={{ fill: "#94a3b8" }}
          />

         <Tooltip
  content={({ active, payload, label }) => {

    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    const status =
  data.state === "Correct"
    ? "✅ Correct"
    : data.state === "Wrong"
    ? "❌ Wrong"
    : "⚪ Unattempted";

    return (
      <div className="rounded-lg bg-slate-900 border border-slate-700 p-3 text-sm">

        <div className="font-semibold text-white">
          {label}
        </div>

        <div className="text-cyan-300">
          Time: {data.time}s
        </div>

        <div className="mt-1 text-slate-300">
          {status}
        </div>

      </div>
    );
  }}
/>

          <Bar
            dataKey="time"
            radius={[5,5,0,0]}
          >
            {analytics.questionTimeline.map((entry, index) => {

              let color = "#64748b"; // skipped

              if (entry.state === "Correct")
                color = "#22c55e";

              else if (entry.state === "Wrong")
                color = "#ef4444";

              return (
                <Cell
                  key={index}
                  fill={color}
                />
              );

            })}
          </Bar>

        </BarChart>

      </ResponsiveContainer>

    </div>

  </CardContent>

</Card>

<Card className="bg-slate-900/60 border-cyan-500/20">

<CardContent className="p-8">

<div className="mb-8">

<h2 className="text-3xl font-black text-white">
Time vs Accuracy
</h2>

<p className="text-slate-400 mt-2 max-w-3xl">
Each dot represents one question. The X-axis shows the time you spent on that question, while the Y-axis shows whether your answer was correct or wrong. This helps you understand whether spending more time actually improved your accuracy.
</p>

</div>

<div className="w-full h-[450px]">

<ResponsiveContainer width="99%" height={420}>

<ScatterChart>

<CartesianGrid stroke="#334155" />

<XAxis
type="number"
dataKey="time"
name="Time"
unit="s"
tick={{fill:"#94a3b8"}}
/>

<YAxis
type="number"
dataKey="accuracy"
domain={[-0.2,1.2]}
ticks={[0,1]}
tickFormatter={(v)=>v===1?"Correct":"Wrong"}
tick={{fill:"#94a3b8"}}
/>

<Tooltip
formatter={(value,name)=>{

if(name==="accuracy")
return [value?"Correct":"Wrong","Result"];

return [`${value}s`,"Time"];

}}
labelFormatter={(v)=>v}
/>

<Scatter
data={analytics.speedAccuracy}
>

{analytics.speedAccuracy.map((entry,index)=>(
<Cell
key={index}
fill={
entry.accuracy
? "#22c55e"
: "#ef4444"
}
/>
))}

</Scatter>

</ScatterChart>

</ResponsiveContainer>
<div className="mt-6 rounded-xl border border-cyan-500/20 bg-slate-800/40 p-5">

  <h3 className="text-white font-semibold mb-4">
    How to read this chart
  </h3>

  <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-300">

    <div>

      <div className="mb-2">
        🟢 <b>Green dot</b> = Correct answer
      </div>

      <div className="mb-2">
        🔴 <b>Red dot</b> = Wrong answer
      </div>

      <div>
        ➜ Every dot represents one question.
      </div>

    </div>

    <div>

      <div className="mb-2">
        ⬅️ Left side = Answered quickly
      </div>

      <div className="mb-2">
        ➡️ Right side = Took more time
      </div>

      <div>
        Try to identify whether extra time improved your accuracy or not.
      </div>

    </div>

  </div>

</div>

</div>

</CardContent>

</Card>

<Card className="bg-slate-900/60 border-cyan-500/20">

  <CardContent className="p-8">

    <div className="mb-8">
      <h2 className="text-3xl font-black text-white">
        Marks Distribution
      </h2>

      <p className="text-slate-400 mt-2">
        See exactly where you gained and lost marks.
      </p>
    </div>

    <div className="grid lg:grid-cols-3 gap-8">

      {[
        {
          title: "Overall",
          data: marksDistribution.total,
        },
        {
          title: "RC Marks",
          data: marksDistribution.rc,
        },
        {
          title: "VA Marks",
          data: marksDistribution.va,
        },
      ].map((section) => {

        const max = Math.max(
          1,
          ...section.data.map((x) => Math.abs(x.value))
        );

        return (

          <div
            key={section.title}
            className="rounded-2xl border border-cyan-500/20 bg-slate-800/40 p-6"
          >

            <h3 className="text-xl font-bold text-white mb-8">
              {section.title}
            </h3>

            <div className="space-y-6">

              {section.data.map((item) => {

                const percent =
                  (Math.abs(item.value) / max) * 100;

                return (

                  <div key={item.name}>

                    <div className="flex justify-between mb-2">

                      <span className="text-slate-300">
                        {item.name}
                      </span>

                      <span
                        className={`font-bold ${
                          item.value >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {item.value > 0 ? "+" : ""}
                        {item.value}
                      </span>

                    </div>

                    {/* Track */}

                   <div
  className="w-full h-3 rounded-full bg-slate-700 overflow-hidden"
  title={`Correct: ${item.correct}
Wrong: ${item.wrong}
Attempted: ${item.attempted}
Net Marks: ${item.value > 0 ? "+" : ""}${item.value}`}
>

  <div
    className={`h-full rounded-full transition-all duration-500 ${
      item.value >= 0
        ? "bg-emerald-500"
        : "bg-red-500"
    }`}
    style={{
      width: `${percent}%`,
    }}
  />

</div>

                  </div>

                );

              })}

            </div>

          </div>

        );

      })}

    </div>

  </CardContent>

</Card>

<Card className="bg-slate-900/60 border-cyan-500/20">

  <CardContent className="p-8">

    <div className="mb-8">

      <h2 className="text-3xl font-black text-white">
        Passage Performance
      </h2>

      <p className="text-slate-400 mt-2">
        Compare your accuracy across different passages and the VA section.
      </p>

    </div>

    <div className="w-full h-[420px]">

      <ResponsiveContainer width="99%" height={400}>

        <BarChart
          layout="vertical"
          data={passagePerformance}
          margin={{ left: 40 }}
          barSize={20}
          barCategoryGap="35%"
        >

          <CartesianGrid
            stroke="#334155"
            strokeDasharray="3 3"
          />

          <XAxis
            type="number"
            domain={[0,100]}
            tick={{ fill:"#94a3b8" }}
            unit="%"
          />

          <YAxis
            dataKey="title"
            type="category"
            tick={{ fill:"#94a3b8" }}
            width={180}
          />

         <Tooltip
  cursor={{ fill: "rgba(6,182,212,0.08)" }}
  content={({ active, payload }) => {

    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    return (
      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/95 px-4 py-3 shadow-xl">

        <div className="text-white font-semibold mb-1">
          {data.name}
        </div>

        <div className="text-cyan-300 text-sm">
          Accuracy: {data.accuracy}%
        </div>

        <div className="text-slate-400 text-sm">
          {data.correct}/{data.total} Correct
        </div>

      </div>
    );
  }}
/>

          <Bar
            dataKey="accuracy"
            radius={[0,8,8,0]}
          >

            {passagePerformance.map((entry,index)=>{

              let color="#ef4444";

              if(entry.accuracy>=80)
                color="#22c55e";

              else if(entry.accuracy>=60)
                color="#eab308";

              else if(entry.accuracy>=40)
                color="#f97316";

              return (
                <Cell
                  key={index}
                  fill={color}
                />
              );

            })}

          </Bar>

        </BarChart>

      </ResponsiveContainer>

    </div>

  </CardContent>

</Card>

<Card className="bg-slate-900/60 border-cyan-500/20">

<CardContent className="p-8">

<div className="mb-8">

<h2 className="text-3xl font-black text-white">
Accuracy Trend
</h2>

<p className="text-slate-400 mt-2">
See how your cumulative accuracy changed as the test progressed.
</p>

</div>

<div className="w-full h-[420px]">

<ResponsiveContainer width="99%" height={420}>

<LineChart data={accuracyTrend}>

<CartesianGrid
stroke="#334155"
strokeDasharray="3 3"
/>

<XAxis
dataKey="question"
tick={{fill:"#94a3b8"}}
/>

<YAxis
domain={[0,100]}
tickFormatter={(v)=>`${v}%`}
tick={{fill:"#94a3b8"}}
/>

<Tooltip
content={({ active, payload, label }) => {

  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg bg-slate-900 border border-slate-700 p-3">

      <div className="font-semibold text-white">
        {label}
      </div>

      <div className="text-green-400">
        Accuracy: {data.accuracy}%
      </div>

      <div className="text-slate-300 mt-1">
        {data.status}
      </div>

    </div>
  );
}}
/>

<Line
type="monotone"
dataKey="accuracy"
stroke="#22c55e"
strokeWidth={4}
dot={{r:5}}
activeDot={{r:8}}
connectNulls={false}
/>

</LineChart>

</ResponsiveContainer>

</div>

<div className="mt-6 rounded-xl border border-cyan-500/20 bg-slate-800/40 p-4">

<div className="font-semibold text-white mb-3">
How to interpret this chart
</div>

<ul className="space-y-2 text-sm text-slate-300">

<li>📈 Rising line = Your accuracy improved during the test.</li>

<li>📉 Falling line = Mistakes increased as the test progressed.</li>

<li>➡️ Flat line = Consistent performance.</li>

<li>💡 A sharp drop often indicates fatigue, rushing, or difficult questions.</li>

</ul>

</div>

</CardContent>

</Card>

<Card className="bg-slate-900/60 border-cyan-500/20">

<CardContent className="p-8">

<div className="mb-8">

<h2 className="text-3xl font-black text-white">
Difficulty Analysis
</h2>

<p className="text-slate-400 mt-2">
See how you performed across Easy, Medium and Difficult questions.
</p>

</div>

<div className="grid md:grid-cols-3 gap-6">

{difficultyAnalysis.map((item) => {

  const total =
    item.correct + item.wrong + item.skipped;

  const attempted =
    item.correct + item.wrong;

  const accuracy =
    attempted
      ? Math.round((item.correct / attempted) * 100)
      : 0;

  let color = "text-green-400";

  if (item.difficulty === "Medium")
    color = "text-yellow-400";

  if (item.difficulty === "Difficult")
    color = "text-red-400";

  return (

    <div
      key={item.difficulty}
      className="rounded-2xl border border-cyan-500/20 bg-slate-800/40 p-6"
    >

      <div className={`text-2xl font-bold ${color}`}>
        {item.difficulty}
      </div>

      <div className="mt-6 space-y-3 text-sm">

        <div className="flex justify-between">
          <span className="text-green-400">
            ✅ Correct
          </span>
          <span className="text-white">
            {item.correct}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-red-400">
            ❌ Wrong
          </span>
          <span className="text-white">
            {item.wrong}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">
            ⚪ Skipped
          </span>
          <span className="text-white">
            {item.skipped}
          </span>
        </div>

      </div>

      <div className="mt-8 border-t border-slate-700 pt-5">

        <div className="text-slate-400 text-sm">
          Accuracy
        </div>

        <div className="text-4xl font-black text-cyan-300">
          {accuracy}%
        </div>

        <div className="text-xs text-slate-500 mt-2">
          {attempted}/{total} attempted
        </div>

      </div>

    </div>

  );

})}

</div>

<div className="mt-6 rounded-xl border border-cyan-500/20 bg-slate-800/40 p-4">

<div className="font-semibold text-white mb-3">
How to interpret this chart
</div>

<ul className="space-y-2 text-sm text-slate-300">

<li>🟢 Green = Correctly answered questions.</li>

<li>🔴 Red = Attempted but answered incorrectly.</li>

<li>⚪ Grey = Questions you skipped.</li>

<li>💡 Try to maximize green bars for Easy questions before attempting Difficult ones.</li>

</ul>

</div>

</CardContent>

</Card>

<Card className="bg-slate-900/60 border-cyan-500/20">

  <CardContent className="p-8">

    <div className="mb-8">

      <h2 className="text-3xl font-black text-white">
        Difficulty vs Time
      </h2>

      <p className="text-slate-400 mt-2">
        Compare your average time spent across Easy, Medium and Difficult questions.
      </p>

    </div>

    <div className="overflow-x-auto">

      <table className="w-full text-left">

        <thead>

          <tr className="border-b border-slate-700">

            <th className="py-4 text-slate-300 font-semibold">Difficulty</th>
            <th className="py-4 text-center text-slate-300 font-semibold">Attempted</th>
            <th className="py-4 text-center text-slate-300 font-semibold">Correct</th>
            <th className="py-4 text-center text-slate-300 font-semibold">Avg Time</th>
            <th className="py-4 text-center text-slate-300 font-semibold">Ideal</th>
            <th className="py-4 text-center text-slate-300 font-semibold">Verdict</th>

          </tr>

        </thead>

        <tbody>

          {analytics.difficultyTimeAnalysis.map((row) => (

            <tr
              key={row.difficulty}
              className="border-b border-slate-800 hover:bg-slate-800/40 transition"
            >

              <td className="py-5 font-semibold text-white">
                {row.difficulty}
              </td>

              <td className="py-5 text-center text-white">
                {row.attempted}
              </td>

              <td className="py-5 text-center text-emerald-400 font-semibold">
                {row.correct}
              </td>

              <td className="py-5 text-center text-cyan-300">
                {row.averageTime}s
              </td>

              <td className="py-5 text-center text-slate-300">
                {row.idealTime}
              </td>

              <td
                className={`py-5 text-center font-semibold ${
                  row.verdict === "Good"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {row.verdict}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </CardContent>

</Card>

<Card className="bg-slate-900/60 border-cyan-500/20">

<CardContent className="p-8">

<h2 className="text-3xl font-black text-white mb-2">
Difficulty Timeline
</h2>

<p className="text-slate-400 mb-8">
Every question with its difficulty, topic, result and time.
</p>

<div className="overflow-x-auto">

<table className="w-full">

<thead>

<tr className="border-b border-slate-700">

<th className="py-4 px-4 text-left text-slate-300 font-semibold">Q</th>
<th className="py-4 px-4 text-left text-slate-300 font-semibold">Difficulty</th>
<th className="py-4 px-4 text-left text-slate-300 font-semibold">Topic</th>
<th className="py-4 px-4 text-left text-slate-300 font-semibold">Status</th>
<th className="py-4 px-4 text-left text-slate-300 font-semibold">Time</th>

</tr>

</thead>

<tbody>

{analytics.difficultyTimeline.map((row) => (

<tr
key={row.questionNumber}
className="border-b border-slate-800 hover:bg-slate-800/40"
>

<td className="py-4 px-4 text-white font-semibold">
Q{row.questionNumber}
</td>

<td className="py-4 px-4 text-cyan-300">
{row.difficulty}
</td>

<td className="py-4 px-4 text-slate-200">
{row.topic}
</td>

<td className="py-4 px-4 font-medium">

{row.status==="Correct" &&
<span className="text-emerald-400">✅ Correct</span>}

{row.status==="Wrong" &&
<span className="text-red-400">❌ Wrong</span>}

{row.status==="Unattempted" &&
<span className="text-slate-400">⚪ Skipped</span>}

</td>

<td className="py-4 px-4 text-amber-300">
{row.time}s
</td>

</tr>

))}

</tbody>

</table>

</div>

</CardContent>

</Card>

<Card className="bg-slate-900/60 border-cyan-500/20">

<CardContent className="p-8">

<h2 className="text-3xl font-black text-white mb-2">

Topic Performance

</h2>

<p className="text-slate-400 mb-8">

Performance across skills tested.

</p>

<ResponsiveContainer width="100%" height={400}>

<BarChart data={analytics.topicPerformance}>

<CartesianGrid stroke="#334155"/>

<XAxis
dataKey="topic"
tick={{fill:"#94a3b8"}}
/>

<YAxis
domain={[0,100]}
tick={{fill:"#94a3b8"}}
/>

<Tooltip
  cursor={{ fill: "rgba(6,182,212,0.08)" }}
  content={({ active, payload }) => {

    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    return (

      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/95 px-4 py-3 shadow-xl">

        <div className="font-semibold text-white mb-2">
          {data.topic}
        </div>

        <div className="text-cyan-300 text-sm">
          Accuracy: {data.accuracy}%
        </div>

        <div className="text-slate-300 text-sm">
          {data.correct}/{data.attempted} Correct
        </div>

      </div>

    );

  }}
/>

<Bar
  dataKey="accuracy"
  radius={[6,6,0,0]}
>
  {analytics.topicPerformance.map((entry,index)=>{

    let color="#ef4444";

    if(entry.accuracy>=80)
      color="#22c55e";
    else if(entry.accuracy>=60)
      color="#eab308";
    else if(entry.accuracy>=40)
      color="#f97316";

    return (
      <Cell
        key={index}
        fill={color}
      />
    );

  })}
</Bar>

</BarChart>

</ResponsiveContainer>

</CardContent>

</Card>
    </div>

  );

}