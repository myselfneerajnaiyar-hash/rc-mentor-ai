"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function PerformanceTrends({ attempts = [] }) {
    console.log("ATTEMPTS", attempts);

const data = [...attempts]
.reverse()
.map((test,index)=>({

test:`T${index+1}`,

score:test.score || 0,

accuracy:
test.total_questions
? Math.round(
(test.correct/test.total_questions)*100
)
:0,

avgTime:
test.total_questions
? Math.round(
(test.time_taken_s||0)/test.total_questions
)
:0,

attemptRate:
test.total_questions
? Math.round(
((test.correct+test.wrong)/test.total_questions)*100
)
:0

}));

console.log("GRAPH DATA", data);

const first = data[0];
const last = data[data.length - 1];

const badges = {

  score: {
    text: `${last.score >= first.score ? "▲" : "▼"} ${Math.abs(last.score-first.score)} marks`,
    color:
      last.score >= first.score
        ? "bg-green-500/20 text-green-300"
        : "bg-red-500/20 text-red-300"
  },

  accuracy: {
    text: `${last.accuracy >= first.accuracy ? "▲" : "▼"} ${Math.abs(last.accuracy-first.accuracy)} pp`,
    color:
      last.accuracy >= first.accuracy
        ? "bg-green-500/20 text-green-300"
        : "bg-red-500/20 text-red-300"
  },

  avgTime: {
    text: `${last.avgTime <= first.avgTime ? "▼" : "▲"} ${Math.abs(last.avgTime-first.avgTime)} sec`,
    color:
      last.avgTime <= first.avgTime
        ? "bg-green-500/20 text-green-300"
        : "bg-amber-500/20 text-amber-300"
  },

  attemptRate: {
    text: `${last.attemptRate >= first.attemptRate ? "▲" : "▼"} ${Math.abs(last.attemptRate-first.attemptRate)} pp`,
    color:
      last.attemptRate >= first.attemptRate
        ? "bg-green-500/20 text-green-300"
        : "bg-red-500/20 text-red-300"
  }

};


const MiniChart = ({
title,
description,
dataKey,
color,
suffix="",
badge,
badgeColor
})=>(

<div className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5">

<div className="flex items-start justify-between mb-3">

  <div>

    <h3 className="text-lg font-bold text-white">
      {title}
    </h3>

    <p className="text-slate-400 text-xs">
      {description}
    </p>

  </div>

  <span
    className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
  >
    {badge}
  </span>

</div>

<div
  className="w-full"
  style={{ height: 240 }}
>

<ResponsiveContainer width="100%" height="100%">

<AreaChart data={data}>

<defs>

<linearGradient
id={`${dataKey}Gradient`}
x1="0"
y1="0"
x2="0"
y2="1"
>

<stop
offset="5%"
stopColor={color}
stopOpacity={0.45}
/>

<stop
offset="95%"
stopColor={color}
stopOpacity={0}
/>

</linearGradient>

</defs>

<CartesianGrid
stroke="#334155"
strokeDasharray="3 3"
/>

<XAxis
dataKey="test"
tick={{fill:"#94a3b8"}}
/>

<YAxis
tick={{fill:"#94a3b8"}}
/>

<Tooltip
contentStyle={{
background:"#0f172a",
border:"1px solid #334155",
borderRadius:"14px",
color:"#fff"
}}
formatter={(value)=>[
`${value}${suffix}`,
title
]}
/>

<Area
type="natural"
dataKey={dataKey}
stroke={color}
strokeWidth={3}
fill={`url(#${dataKey}Gradient)`}
dot={{
r:4,
fill:color,
stroke:"#fff",
strokeWidth:2
}}
activeDot={{
r:7,
fill:color,
stroke:"#fff",
strokeWidth:2
}}
/>

</AreaChart>

</ResponsiveContainer>


</div>

</div>

);

return(

<div className="mt-12">

<h2 className="text-3xl font-bold text-white mb-2">
Performance Trends
</h2>

<p className="text-slate-400 mb-8">
Track how your performance has evolved across your latest tests.
</p>

<div className="grid md:grid-cols-2 gap-6">

<MiniChart
title="Total Score"
description="Overall score across tests."
dataKey="score"
color="#22c55e"
badge={badges.score.text}
badgeColor={badges.score.color}
/>

<MiniChart
title="Accuracy"
description="Percentage of correct answers."
dataKey="accuracy"
color="#06b6d4"
suffix="%"
badge={badges.accuracy.text}
badgeColor={badges.accuracy.color}
/>

<MiniChart
title="Average Time / Question"
description="Average seconds spent on each question."
dataKey="avgTime"
color="#f59e0b"
suffix=" sec"
badge={badges.avgTime.text}
badgeColor={badges.avgTime.color}
/>

<MiniChart
title="Attempt Rate"
description="Percentage of questions attempted."
dataKey="attemptRate"
color="#a855f7"
suffix="%"
badge={badges.attemptRate.text}
badgeColor={badges.attemptRate.color}
/>

</div>

</div>

);
}