"use client";

import { calculateReadingIQ } from "../../../lib/readingIQ";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function RCIQTrend({ attempts }) {
    console.log(attempts[0].sectional_test_content);
  console.log(attempts[0].sectional_test_content);

const chartData = attempts
  .slice()
  .reverse()
  .map((t, index) => {
    const content = t.sectional_test_content;

    return {
      test: content
        ? `CAT ${content.exam_year} • Slot ${content.exam_slot}`
        : `Test ${index + 1}`,

      accuracy: t.accuracy_percent || 0,
      score: t.score || 0,
      correct: t.correct || 0,
      wrong: t.wrong || 0,
      rciq: calculateReadingIQ(t),
    };
  });

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-700 p-8 mb-10">

      <h2 className="text-3xl font-black text-white mb-4">
        Reading IQ Trend
      </h2>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 mb-8">
        <h3 className="text-cyan-300 font-bold mb-3">
          What is Reading IQ?
        </h3>

        <p className="text-slate-300 leading-7">
          Reading IQ is Birbal's estimate of your reading ability.
          It combines your accuracy, score and overall performance
          into a single score.
        </p>
      </div>

     <div
  style={{
    width: 900,
    height: 420,
    background: "#111827",
  }}
>

         <AreaChart
  width={900}
  height={420}
  data={chartData}
  onMouseMove={(e) => console.log("MOVE", e)}
>

            <defs>
              <linearGradient id="readingIQFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#334155"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="test"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />

            <YAxis
              domain={[0,100]}
              tick={{ fill:"#94a3b8" }}
            />

           <Tooltip
  cursor={{
    stroke: "#22d3ee",
    strokeWidth: 2,
    strokeDasharray: "4 4",
  }}
  content={({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    return (
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl w-44">

      <div className="font-bold text-white text-base mb-1">
          {data.test}
        </div>

        <div className="space-y-1 text-sm">

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400">Reading IQ</span>
            <span className="font-bold text-cyan-400">
              {data.rciq}
            </span>
          </div>

           <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400">Accuracy</span>
            <span className="text-emerald-400">
              {data.accuracy}%
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400">Score</span>
            <span className="text-yellow-400">
              {data.score}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400">Correct</span>
            <span className="text-emerald-400">
              {data.correct}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400">Wrong</span>
            <span className="text-red-400">
              {data.wrong}
            </span>
          </div>

        </div>

       

      </div>
    );
  }}
/>
            <Area
              type="monotone"
              dataKey="rciq"
              stroke="#22d3ee"
              strokeWidth={4}
              fill="url(#readingIQFill)"
              activeDot={{
                r:8,
              }}
            />

          </AreaChart>

    

      </div>

    </div>
  );
}