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

function StatCard({ label, value }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#555" }}>{label}</div>
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

  const drills = history.length;
  const recent = history.slice(-15);

  const effTimeline = recent.map(d => d.effectiveWPM);
  const rawTimeline = recent.map(d => d.rawWPM);
  const accTimeline = recent.map(d => d.accuracy);

  const avgEff = Math.round(
    history.reduce((a, b) => a + b.effectiveWPM, 0) / drills
  );
  const avgRaw = Math.round(
    history.reduce((a, b) => a + b.rawWPM, 0) / drills
  );
  const avgAcc = Math.round(
    history.reduce((a, b) => a + b.accuracy, 0) / drills
  );

  const last3 = history.slice(-3);

  const last3Eff = last3.map(d => d.effectiveWPM);
  const last3Acc = last3.map(d => d.accuracy);

  const effDelta =
    effTimeline.length > 1
      ? effTimeline.at(-1) - effTimeline[0]
      : 0;

  const momentum =
    effDelta > 15
      ? "Acceleration phase. Fluency is compounding."
      : effDelta < -15
      ? "Regression detected. Fatigue or rushing may be hurting comprehension."
      : "Stable base. Consistency will convert this into growth.";

  const readingMode =
    avgAcc < 60
      ? "You push speed before meaning stabilizes."
      : avgEff < 220
      ? "Careful but hesitant. Confidence must rise."
      : "Speed and comprehension are aligning.";

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
            <StatCard label="Effective WPM" value={avgEff} />
            <StatCard label="Raw WPM" value={avgRaw} />
            <StatCard label="Avg Accuracy" value={avgAcc + "%"} />
            <StatCard label="Drills" value={drills} />
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

          <div style={{ marginTop: 24 }}>
            <h4>Your Reading Mode</h4>
            <p>{readingMode}</p>

            <h4>Momentum</h4>
            <p>{momentum}</p>
          </div>
        </>
      )}

      {active === "speed" && (
        <>
          <LineChart
            data={rawTimeline}
            color="#f59e0b"
            label="Raw Speed"
            unit=""
          />
          <LineChart
            data={effTimeline}
            color="#22c55e"
            label="Effective Speed"
            unit=""
          />
          <p style={{ color: "#555" }}>
            The gap between Raw and Effective speed shows how much comprehension
            you lose when pushing pace.
          </p>
        </>
      )}

      {active === "accuracy" && (
        <>
          <LineChart
            data={accTimeline}
            color="#3b82f6"
            label="Accuracy Stability"
            unit="%"
          />
          <p style={{ color: "#555" }}>
            Stable accuracy above 70% is the signal that speed can safely rise.
          </p>
        </>
      )}

      {active === "today" && (
        <>
          <h3>Your Last 3 Drills</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {last3.map((d, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                }}
              >
                <div><b>Effective:</b> {d.effectiveWPM}</div>
                <div><b>Raw:</b> {d.rawWPM}</div>
                <div><b>Accuracy:</b> {d.accuracy}%</div>
              </div>
            ))}
          </div>
        </>
      )}

      {active === "plan" && (
        <>
          <h3>Speed Growth Plan</h3>
          <ol style={{ lineHeight: 1.8 }}>
            <li>Stabilize accuracy above 70% at current speed.</li>
            <li>Push Raw WPM by +20 for 5 drills.</li>
            <li>Only upgrade level when Effective WPM crosses the band.</li>
          </ol>
          <p style={{ color: "#555" }}>
            Your current effective baseline is <b>{avgEff} WPM</b>.  
            Target next band: <b>{avgEff + 20}+</b>.
          </p>
        </>
      )}
    </div>
  );
}
