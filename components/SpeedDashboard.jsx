"use client";
import { useEffect, useState } from "react";

function LineChart({ data, color, label, unit }) {
  const w = 720;
  const h = 220;
  const pad = 28;

  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  if (!isFinite(max) || !isFinite(min) || max === min) return null;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
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
                {p.v}
                {unit}
              </text>
            </g>
          ))}
        </svg>

        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          Last {data.length} drills
        </div>
      </div>
    </div>
  );
}

function Pie({ a, b, labelA, labelB, colorA, colorB }) {
  const safeA = Number.isFinite(a) ? a : 0;
  const safeB = Number.isFinite(b) ? b : 0;

  const total = safeA + safeB || 1;
  const angle = (safeA / total) * 360;

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
        }}
      />

      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 600 }}>{labelA}</div>
        <div style={{ color: colorA }}>{safeA}</div>

        <div style={{ marginTop: 8, fontWeight: 600 }}>{labelB}</div>
        <div style={{ color: colorB }}>{safeB}</div>
      </div>
    </div>
  );
}

export default function SpeedDashboard() {
  const [active, setActive] = useState("overview");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("speedProfile") || "[]");

    const clean = raw.filter(
      r =>
        Number.isFinite(r.rawWPM) &&
        Number.isFinite(r.effectiveWPM) &&
        Number.isFinite(r.accuracy)
    );

    setHistory(clean);
  }, []);

  if (!history.length) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Speed Profile</h2>
        <p>No speed drills yet. Start Speed Reading Gym.</p>
      </div>
    );
  }

  const recent = history.slice(-15);

  const effTimeline = recent.map(d => d.effectiveWPM);
  const accTimeline = recent.map(d => d.accuracy);

  const drills = history.length;

  const avgEff = drills
    ? Math.round(history.reduce((a, b) => a + b.effectiveWPM, 0) / drills)
    : 0;

  const avgRaw = drills
    ? Math.round(history.reduce((a, b) => a + b.rawWPM, 0) / drills)
    : 0;

  const avgAcc = drills
    ? Math.round(history.reduce((a, b) => a + b.accuracy, 0) / drills)
    : 0;

  const accDelta =
    effTimeline.length > 1
      ? effTimeline.at(-1) - effTimeline[0]
      : 0;

  const momentum =
    accDelta > 15
      ? "Acceleration phase. Your fluency engine is compounding."
      : accDelta < -15
      ? "Regression detected. Fatigue or rushing may be hurting comprehension."
      : "Stable base. Consistency will convert this into growth.";

  const readingMode =
    avgAcc < 60
      ? "You are pushing speed before meaning stabilizes. The eyes move, but the mind lags."
      : avgEff < 220
      ? "You read carefully, but hesitation caps velocity. Confidence must rise."
      : "Speed and comprehension are aligning. This is CAT-ready fluency.";

  const under = history.filter(d => d.accuracy >= 70).length;
  const miss = drills - under;

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Speed Profile</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["overview", "speed", "accuracy", "today", "plan"].map(t => (
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
              { label: "Effective WPM", value: avgEff },
              { label: "Raw WPM", value: avgRaw },
              { label: "Avg Accuracy", value: avgAcc + "%" },
              { label: "Drills", value: drills },
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
            data={effTimeline}
            color="#22c55e"
            label="Effective Speed Trend"
            unit=""
          />

          <LineChart
            data={accTimeline}
            color="#3b82f6"
            label="Accuracy Trend"
            unit="%"
          />

          <div style={{ display: "flex", gap: 40, marginTop: 16 }}>
            <Pie
              a={under}
              b={miss}
              labelA="Comprehended"
              labelB="Missed"
              colorA="#22c55e"
              colorB="#ef4444"
            />
          </div>

          <div style={{ marginTop: 24 }}>
            <h4>Your Reading Mode</h4>
            <p>{readingMode}</p>

            <h4>Momentum</h4>
            <p>{momentum}</p>
          </div>
        </>
      )}
    </div>
  );
}
