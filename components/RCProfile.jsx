"use client";
import { useEffect, useState } from "react";

function LineChart({ data, color, label, unit }) {
  const w = 260;
  const h = 90;
  const pad = 12;

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
    <div style={{ width: w }}>
      <div style={{ fontSize: 13, marginBottom: 6 }}>{label}</div>
      <svg width={w} height={h}>
        <path d={path} fill="none" stroke={color} strokeWidth="2" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill={color} />
            <text
              x={p.x}
              y={p.y - 6}
              fontSize="10"
              textAnchor="middle"
              fill="#374151"
            >
              {p.v}{unit}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 11, color: "#6b7280" }}>
        Test 1 → Test {data.length}
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

  const accuracy = Math.round((correct / totalQ) * 100);
  const avgTime = Math.round(all.reduce((a, b) => a + b.time, 0) / totalQ);

  const accuracyTimeline = tests.map(t => {
    const total = t.questions.length;
    const correct = t.questions.filter(q => q.correct).length;
    return Math.round((correct / total) * 100);
  });

  const timeTimeline = tests.map(t => {
    const total = t.questions.length;
    const sum = t.questions.reduce((a, b) => a + b.time, 0);
    return Math.round(sum / total);
  });

  const accDelta =
    accuracyTimeline.length > 1
      ? accuracyTimeline.at(-1) - accuracyTimeline[0]
      : 0;

  const timeDelta =
    timeTimeline.length > 1
      ? timeTimeline.at(-1) - timeTimeline[0]
      : 0;

  const readingStyle =
    avgTime < 25 && accuracy < 70
      ? "You rush before clarity forms. Speed is replacing structure."
      : avgTime > 45 && accuracy < 70
      ? "You over-process without full clarity."
      : "You balance speed with comprehension.";

  const momentum =
    accDelta > 5
      ? "Strong upward momentum. Your comprehension engine is stabilizing."
      : accDelta < -5
      ? "Momentum is slipping. Fatigue or guessing may be creeping in."
      : "Momentum is steady. Consistency will unlock growth.";

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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <LineChart
              data={accuracyTimeline}
              color="#22c55e"
              label="Accuracy Trend"
              unit="%"
            />
            <LineChart
              data={timeTimeline}
              color="#3b82f6"
              label="Avg Time Trend"
              unit="s"
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
    </div>
  );
}
