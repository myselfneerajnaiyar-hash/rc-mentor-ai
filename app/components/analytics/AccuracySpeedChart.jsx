"use client";

import { calculateReadingIQ } from "../../../lib/readingIQ";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

export default function AccuracySpeedChart({ attempts }) {
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

        avgTime: Math.round(
          (t.time_taken_s || 0) /
            Math.max(t.total_questions || 1, 1)
        ),

        score: t.score || 0,
        correct: t.correct || 0,
        wrong: t.wrong || 0,

        rciq: calculateReadingIQ(t),
      };
    });

  function getColor(rciq) {
    if (rciq >= 75) return "#22c55e";
    if (rciq >= 60) return "#06b6d4";
    if (rciq >= 40) return "#eab308";
    return "#ef4444";
  }

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-700 p-8 mb-10">

      <h2 className="text-3xl font-black text-white mb-3">
        Accuracy vs Reading Speed
      </h2>

      <p className="text-slate-400 mb-8">
        Every point represents one mock. Compare your reading
        speed with your accuracy to understand whether you're
        rushing or spending too much time.
      </p>

      <div
  className="
    rounded-3xl
    border border-cyan-500/20
    bg-gradient-to-br
    from-slate-950
    via-slate-900
    to-slate-950
    p-6
    shadow-inner
  "
  style={{
    width: "100%",
    height: 470,
  }}
>

        <ResponsiveContainer>

          <ScatterChart
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >

            <CartesianGrid
              stroke="#334155"
              strokeDasharray="3 3"
            />

            <XAxis
              type="number"
              dataKey="avgTime"
              name="Average Time"
              unit=" sec"
              stroke="#94a3b8"
              domain={[0, 120]}
            />

            <YAxis
              type="number"
              dataKey="accuracy"
              name="Accuracy"
              unit="%"
              stroke="#94a3b8"
              domain={[0, 100]}
            />

            {/* Quadrants */}

            <ReferenceLine
              x={60}
              stroke="#475569"
              strokeDasharray="5 5"
            />

            <ReferenceLine
              y={70}
              stroke="#475569"
              strokeDasharray="5 5"
            />

            <Tooltip
              cursor={{ strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;

                const d = payload[0].payload;

                return (
                  <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-3 w-44 shadow-2xl">

                    <div className="font-bold text-white mb-2">
                      {d.test}
                    </div>

                    <div className="space-y-1 text-sm">

                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Reading IQ
                        </span>

                        <span className="text-cyan-400 font-bold">
                          {d.rciq}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Accuracy
                        </span>

                        <span className="text-emerald-400">
                          {d.accuracy}%
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Avg Time
                        </span>

                        <span className="text-cyan-300">
                          {d.avgTime}s
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Score
                        </span>

                        <span className="text-yellow-400">
                          {d.score}
                        </span>
                      </div>

                    </div>

                  </div>
                );
              }}
            />

            <Scatter data={chartData}>

              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={getColor(entry.rciq)}
                />
              ))}

            </Scatter>

          </ScatterChart>

        </ResponsiveContainer>

      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="text-green-400 font-bold">
            🟢 Fast + Accurate
          </div>
          <div className="text-slate-400 mt-2">
            Ideal reading behaviour.
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="text-yellow-400 font-bold">
            🟡 Slow + Accurate
          </div>
          <div className="text-slate-400 mt-2">
            Good understanding but slow.
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="text-orange-400 font-bold">
            🟠 Fast + Inaccurate
          </div>
          <div className="text-slate-400 mt-2">
            You're rushing.
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="text-red-400 font-bold">
            🔴 Slow + Inaccurate
          </div>
          <div className="text-slate-400 mt-2">
            Reading strategy needs work.
          </div>
        </div>

      </div>

    </div>
  );
}