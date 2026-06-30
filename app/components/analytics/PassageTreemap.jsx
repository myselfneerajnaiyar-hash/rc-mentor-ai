"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

function PassageTooltip({ active, payload }) {

  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-5 shadow-2xl">
      <h3 className="text-white font-bold text-xl">
        {data.name}
      </h3>

      <p className="text-white mt-2">
        Accuracy: <b>{data.accuracy}%</b>
      </p>

      <p className="text-slate-300">
        Questions: <b>{data.questions}</b>
      </p>

      <p className="text-slate-300">
        Correct: <b>{data.correct}</b>
      </p>

      <p className="text-slate-300">
        Avg Time: <b>{data.avgTime}s</b>
      </p>
    </div>
  );
}

export default function PassageTreemap({

  rcAttempts=[]

}){

const passages={};

rcAttempts.forEach((attempt)=>{

const archetype =
  attempt.sectional_question_content
    ?.sectional_passage_content
    ?.passage_enrichment
    ?.passageArchetype;

if (!archetype) return;

if(!passages[archetype]){

passages[archetype]={

questions:0,
correct:0,
time:0

};

}

passages[archetype].questions++;

if(attempt.is_correct)
passages[archetype].correct++;

passages[archetype].time+=attempt.time_taken_s||0;

});

const data=Object.entries(passages).map(([name,value])=>{
   



const accuracy=Math.round(
(value.correct/value.questions)*100
);

let color;

if (accuracy >= 85) color = "#22c55e";      // Emerald
else if (accuracy >= 70) color = "#06b6d4"; // Cyan
else if (accuracy >= 55) color = "#f59e0b"; // Amber
else color = "#ef4444";                     // Red

return {
  name,
  size: value.questions,
  accuracy,
  questions: value.questions,
  correct: value.correct,
  avgTime: Math.round(value.time / value.questions),
  fill: color,
};

});

const chartData = [...data].sort(
  (a, b) => b.accuracy - a.accuracy
);

return(

<div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8 mt-12">

<h2 className="text-3xl font-bold text-white mb-6">

Reading Domain Performance

</h2>

<p className="text-slate-400 mb-8">

Compare your accuracy across every reading domain. Lower scores reveal the topics that deserve more focused practice.

</p>

<div
  style={{
    height: "550px",
    width: "100%",
  }}
>

    <div className="flex flex-wrap gap-3 mb-6">

  <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5">
   <div
  className="rounded-full flex-shrink-0"
  style={{
    width: 12,
    height: 12,
    backgroundColor: "#22c55e",
  }}
/>
    <span className="text-sm text-slate-300">
      Excellent (85%+)
    </span>
  </div>

  <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5">
    <div
  className="rounded-full flex-shrink-0"
  style={{
    width: 12,
    height: 12,
    backgroundColor: "#06b6d4",
  }}
/>
    <span className="text-sm text-slate-300">
      Good (70–84%)
    </span>
  </div>

  <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5">
    <div
  className="rounded-full flex-shrink-0"
  style={{
    width: 12,
    height: 12,
    backgroundColor: "#f59e0b",
  }}
/>

    <span className="text-sm text-slate-300">
      Average (55–69%)
    </span>
  </div>

  <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5">
   <div
  className="rounded-full flex-shrink-0"
  style={{
    width: 12,
    height: 12,
    backgroundColor: "#ef4444",
  }}
/>
    <span className="text-sm text-slate-300">
      Needs Practice (&lt;55%)
    </span>
  </div>

</div>

<ResponsiveContainer width="100%" height={500}>

  <BarChart
    data={chartData}
    layout="vertical"
    margin={{
      top: 10,
      right: 40,
      left: 30,
      bottom: 10,
    }}
  >

    <CartesianGrid
      stroke="#1e293b"
      strokeDasharray="4 4"
    />

    <XAxis
      type="number"
      domain={[0,100]}
      tick={{ fill:"#94a3b8" }}
    />

    <YAxis
      type="category"
      dataKey="name"
      tick={{ fill:"#ffffff", fontSize:14 }}
      width={130}
    />

    <Tooltip
      content={<PassageTooltip />}
      cursor={{
        fill:"rgba(255,255,255,.04)"
      }}
    />

    <Bar
      dataKey="accuracy"
      radius={[0,10,10,0]}
      barSize={24}
    >

      {chartData.map((entry,index)=>(

        <Cell
          key={index}
          fill={entry.fill}
        />

      ))}

    </Bar>

  </BarChart>

</ResponsiveContainer>




</div>

</div>

);

}

