"use client";
import { useEffect, useState } from "react";

function LineChart({ data, color, label, unit }) {
  const w = 420;
  const h = 120;
  const pad = 16;

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
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 14, marginBottom: 6, fontWeight: 600 }}>{label}</div>
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
        Last {data.length} tests
      </div>
    </div>
  );
}

function Pie({ a, b, labelA, labelB, colorA, colorB }) {
  const total = a + b || 1;
  const angle = (a / total) * 360;

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: `conic-gradient(${colorA} 0deg ${angle}deg, ${colorB} ${angle}deg 360deg)`,
        }}
      />
      <div style={{ fontSize: 13 }}>
        <div>🟢 {labelA}: {a}</div>
        <div>🔴 {labelB}: {b}</div>
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
    </div>
  );
}
