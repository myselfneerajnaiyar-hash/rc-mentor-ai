"use client";
import { useEffect, useState } from "react";

function LineChart({ data, color, label, unit }) {
  const w = 720;   // wider
  const h = 220;   // taller
  const pad = 28;

  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y =
      h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return { x, y, v };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 16, marginBottom: 10, fontWeight: 700 }}>
        {label}
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
        }}
      >
        <svg width={w} height={h}>
          <path d={path} fill="none" stroke={color} strokeWidth="3" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill={color} />
              <text
                x={p.x}
                y={p.y - 10}
                fontSize="11"
                textAnchor="middle"
                fill="#374151"
              >
                {p.v}{unit}
              </text>
            </g>
          ))}
        </svg>

        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          Last {data.length} tests
        </div>
      </div>
    </div>
  );
}

function Pie({ a, b, labelA, labelB, colorA, colorB }) {
  const total = a + b || 1;
  const angle = (a / total) * 360;

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `conic-gradient(${colorA} 0deg ${angle}deg, ${colorB} ${angle}deg 360deg)`,
          boxShadow:
            "inset 0 0 12px rgba(0,0,0,0.15), 0 6px 12px rgba(0,0,0,0.15)",
        }}
      />

      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 600 }}>{labelA}</div>
        <div style={{ color: colorA }}>{a}</div>

        <div style={{ marginTop: 8, fontWeight: 600 }}>{labelB}</div>
        <div style={{ color: colorB }}>{b}</div>
      </div>
    </div>
  );
}

export default function RCProfile() {
  const [active, setActive] = useState("overview");
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
    setTests(raw.tests || []);
  }, []);

  if (!tests.length) {
    return (
      <div style={{ padding: 24 }}>
        <h2>RC Profile</h2>
        <p>No test data yet. Take at least one RC test.</p>
      </div>
    );
  }

  const all = tests.flatMap(t => t.questions);
  const totalQ = all.length;
  const correct = all.filter(q => q.correct).length;
  const wrong = totalQ - correct;

  const accuracy = Math.round((correct / totalQ) * 100);
  const avgTime = Math.round(all.reduce((a, b) => a + b.time, 0) / totalQ);

  const recent = tests.slice(-15);

  const accuracyTimeline = recent.map(t => {
    const total = t.questions.length;
    const c = t.questions.filter(q => q.correct).length;
    return Math.round((c / total) * 100);
  });

  const timeTimeline = recent.map(t => {
    const total = t.questions.length;
    const sum = t.questions.reduce((a, b) => a + b.time, 0);
    return Math.round(sum / total);
  });

  const rushed = all.filter(q => q.time < 15).length;
  const slow = all.filter(q => q.time > 45).length;

  const readingStyle =
    avgTime < 25 && accuracy < 70
      ? "You are moving faster than your comprehension is stabilizing. Decisions are being made before structure forms."
      : avgTime > 45 && accuracy < 70
      ? "You invest time but without clarity. The mind is working, but the passage is not being internalized cleanly."
      : "You are learning to synchronize speed with understanding. This is the CAT-ready direction.";

  const accDelta =
    accuracyTimeline.length > 1
      ? accuracyTimeline.at(-1) - accuracyTimeline[0]
      : 0;

  const momentum =
    accDelta > 5
      ? "Upward trajectory. Your RC engine is stabilizing and compounding."
      : accDelta < -5
      ? "Form is dipping. Fatigue or guessing patterns may be emerging."
      : "Flat but stable. Consistency will convert this into growth.";

  return (
    <div style={{ marginTop: 20 }}>
      <h2>RC Profile</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["overview", "skills", "speed", "today", "plan"].map(t => (
          <button
            key={t}
            onClick={() => setActive(t)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: active === t ? "#2563eb" : "#f3f4f6",
              color: active === t ? "#fff" : "#111",
              fontWeight: 600,
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {active === "overview" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: "Accuracy", value: accuracy + "%" },
              { label: "Avg Time / Q", value: avgTime + "s" },
              { label: "RCs Attempted", value: tests.length },
              { label: "Total Questions", value: totalQ },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{c.label}</div>
              </div>
            ))}
          </div>

          <LineChart
            data={accuracyTimeline}
            color="#22c55e"
            label="Accuracy Trend"
            unit="%"
          />

          <LineChart
            data={timeTimeline}
            color="#3b82f6"
            label="Average Time Trend"
            unit="s"
          />

          <div style={{ display: "flex", gap: 40, marginTop: 16 }}>
            <Pie
              a={correct}
              b={wrong}
              labelA="Correct"
              labelB="Wrong"
              colorA="#22c55e"
              colorB="#ef4444"
            />

            <Pie
              a={rushed}
              b={slow}
              labelA="Rushed"
              labelB="Overthinking"
              colorA="#f59e0b"
              colorB="#3b82f6"
            />
          </div>

          <div style={{ marginTop: 24 }}>
            <h4>Your Reading Style</h4>
            <p>{readingStyle}</p>

            <h4>Momentum</h4>
            <p>{momentum}</p>
          </div>
        </>
      )}
      
     {active === "skills" && (() => {
  const CAT_TYPES = [
    "main-idea",
    "tone",
    "inference",
    "detail",
    "function",
    "author-agreement",
    "purpose",
    "assumption",
    "strengthen",
    "weaken",
    "application",
    "next-paragraph",
  ];

  const byType = {};
  CAT_TYPES.forEach(t => {
    byType[t] = { total: 0, correct: 0, time: 0, fastWrong: 0, slowWrong: 0 };
  });

  all.forEach(q => {
    if (!byType[q.type]) return;
    const t = byType[q.type];
    t.total++;
    t.time += q.time;
    if (q.correct) t.correct++;
    if (!q.correct && q.time < 20) t.fastWrong++;
    if (!q.correct && q.time > 45) t.slowWrong++;
  });

  function diagnosis(type, acc, fw, sw) {
    if (fw > sw && acc < 60)
      return {
        text: "You answer before the passage has settled in your mind.",
        habit: "Pause for 3 seconds and restate the question in your own words.",
      };
    if (sw > fw && acc < 60)
      return {
        text: "You think, but without anchoring in the passage.",
        habit: "Force yourself to re-locate the exact line before choosing.",
      };
    if (acc > 75)
      return {
        text: "This is becoming a reliable strength.",
        habit: "Maintain rhythm. Do not overthink.",
      };

    return {
      text: "Pattern still forming in this zone.",
      habit: "Slow down and verify every option against the author’s intent.",
    };
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {CAT_TYPES.map(type => {
        const d = byType[type];
        if (!d.total) return null;

        const acc = Math.round((d.correct / d.total) * 100);
        const avg = Math.round(d.time / d.total);
        const wrong = d.total - d.correct;
        const fwPct = wrong ? Math.round((d.fastWrong / wrong) * 100) : 0;
        const swPct = 100 - fwPct;

        const diag = diagnosis(type, acc, d.fastWrong, d.slowWrong);

        return (
          <div
            key={type}
            style={{
              padding: 20,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              gap: 20,
            }}
          >
            {/* Left Stats */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{acc}%</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {type.replace("-", " ")}
              </div>
              <div style={{ fontSize: 11, marginTop: 6 }}>
                Avg: {avg}s
              </div>

              {/* Accuracy Bar */}
              <div
                style={{
                  marginTop: 10,
                  height: 8,
                  borderRadius: 6,
                  background: "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: acc + "%",
                    height: "100%",
                    background: acc > 70 ? "#22c55e" : acc > 50 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
            </div>

            {/* Right Content */}
            <div>
              <p style={{ margin: 0, fontSize: 14 }}>{diag.text}</p>
              <p style={{ marginTop: 6, fontStyle: "italic", fontSize: 13 }}>
                Habit → {diag.habit}
              </p>

              {/* Behaviour Bar */}
              {wrong > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>
                    Error Pattern
                  </div>
                  <div
                    style={{
                      display: "flex",
                      height: 8,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "#e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        width: fwPct + "%",
                        background: "#f59e0b",
                      }}
                      title="Fast & Wrong"
                    />
                    <div
                      style={{
                        width: swPct + "%",
                        background: "#3b82f6",
                      }}
                      title="Slow & Wrong"
                    />
                  </div>
                  <div style={{ fontSize: 10, marginTop: 4, color: "#666" }}>
                    🟡 Impulsive {fwPct}% &nbsp; | &nbsp; 🔵 Confused {swPct}%
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
})()}
      
{active === "speed" && (() => {
  const bands = {
    rushed: { label: "< 15s", min: 0, max: 14, color: "#f59e0b", total: 0, wrong: 0 },
    optimal: { label: "15–45s", min: 15, max: 45, color: "#22c55e", total: 0, wrong: 0 },
    slow: { label: "> 45s", min: 46, max: 999, color: "#3b82f6", total: 0, wrong: 0 },
  };

  all.forEach(q => {
    for (let k in bands) {
      const b = bands[k];
      if (q.time >= b.min && q.time <= b.max) {
        b.total++;
        if (!q.correct) b.wrong++;
      }
    }
  });

  const maxCount = Math.max(...Object.values(bands).map(b => b.total));

  const rushedWrong = bands.rushed.wrong;
  const slowWrong = bands.slow.wrong;

  let diagnosis = "";
  let prescription = "";

  if (rushedWrong > slowWrong) {
    diagnosis =
      "Most of your errors happen in the first few seconds. You are reacting, not reading.";
    prescription =
      "Adopt a 3-second rule: restate the question mentally before seeing options.";
  } else if (slowWrong > rushedWrong) {
    diagnosis =
      "You are investing time but not anchoring in the passage. Effort is not converting into clarity.";
    prescription =
      "Force line-mapping: every answer must point to a sentence in the passage.";
  } else {
    diagnosis =
      "Your timing errors are balanced. This is a control issue, not a panic issue.";
    prescription =
      "Maintain 35–40s rhythm and exit any question crossing 50s.";
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Speed Profile</h3>

      <div style={{ display: "grid", gap: 20, marginTop: 12 }}>
        {Object.entries(bands).map(([k, b]) => {
          const height = Math.round((b.total / maxCount) * 180);

          return (
            <div
              key={k}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {b.label}
              </div>

              <div
                style={{
                  height: 12,
                  background: "#e5e7eb",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: (b.total / maxCount) * 100 + "%",
                    height: "100%",
                    background: b.color,
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#555" }}>
                Attempts: {b.total} &nbsp; | &nbsp; Wrong: {b.wrong}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
        }}
      >
        <h4>Mentor Diagnosis</h4>
        <p>{diagnosis}</p>

        <h4>Speed Prescription</h4>
        <p>{prescription}</p>
      </div>
    </div>
  );
})()}

{active === "today" && (
  <div style={{ marginTop: 20 }}>
    <h3>Today’s Action</h3>
  </div>
)}

{active === "plan" && (
  <div style={{ marginTop: 20 }}>
    <h3>Action Plan</h3>
  </div>
)}
    </div>
  );
}
