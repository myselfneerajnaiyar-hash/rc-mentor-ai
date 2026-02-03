"use client";

export default function DiagnosisView({
  diagnosis,
  passageStats,
  previousDiagnosis, // optional: pass last sectional diagnosis if available
  onReview,
}) {
  /* ================= HELPERS ================= */
  const accuracy = diagnosis.attempted
    ? Math.round((diagnosis.correct / diagnosis.attempted) * 100)
    : 0;

  const sortedQT = Object.entries(diagnosis.byQuestionType || {}).sort(
    (a, b) =>
      b[1].total - a[1].total ||
      a[1].correct / a[1].total - b[1].correct / b[1].total
  );

  const priorityFixes = sortedQT
    .filter(([_, v]) => v.total >= 2 && v.correct / v.total < 0.4)
    .slice(0, 3);

  /* ================= STYLES ================= */
  const page = {
    background: "#f8fafc",
    minHeight: "100vh",
    padding: "40px 16px",
  };

  const card = {
    background: "#ffffff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    marginBottom: 24,
  };

  const h2 = { marginBottom: 8 };
  const muted = { color: "#64748b", fontSize: 14 };

  const statGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
    gap: 16,
    marginTop: 16,
  };

  const statBox = (accent) => ({
    borderLeft: `5px solid ${accent}`,
    padding: "12px 14px",
    background: "#f9fafb",
    borderRadius: 8,
  });

  const barWrap = {
    background: "#e5e7eb",
    borderRadius: 6,
    height: 8,
    overflow: "hidden",
  };

  const bar = (pct, color) => ({
    width: `${pct}%`,
    height: "100%",
    background: color,
  });

  const statusColor = (pct) =>
    pct >= 70 ? "#16a34a" : pct >= 40 ? "#f59e0b" : "#dc2626";

  /* ================= RENDER ================= */
  return (
    <div style={page}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* ================= HEADER ================= */}
        <div style={card}>
          <h2 style={h2}>RC Diagnosis Report</h2>
          <p style={muted}>
            Focuses on <b>decision patterns</b>, not isolated mistakes.
          </p>

          <div style={statGrid}>
            <div style={statBox("#2563eb")}>
              <div style={muted}>Score</div>
              <strong>{diagnosis.correct} / {diagnosis.total}</strong>
            </div>

            <div style={statBox("#dc2626")}>
              <div style={muted}>Incorrect Attempts</div>
              <strong>{diagnosis.incorrect}</strong>
            </div>

            <div style={statBox("#0ea5e9")}>
              <div style={muted}>Smart Skips</div>
              <strong>{diagnosis.unattempted}</strong>
            </div>

            <div style={statBox("#16a34a")}>
              <div style={muted}>Accuracy</div>
              <strong>{accuracy}%</strong>
            </div>
          </div>

          {/* ===== Comparison (only if previous exists) ===== */}
          {!previousDiagnosis && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
              📈 Progress comparison will appear after your next RC sectional.
            </p>
          )}

          {previousDiagnosis && (
            <p style={{ marginTop: 12, fontSize: 13 }}>
              Accuracy change:{" "}
              <b>
                {accuracy -
                  Math.round(
                    (previousDiagnosis.correct /
                      previousDiagnosis.attempted) *
                      100
                  )}
                %
              </b>
            </p>
          )}
        </div>

        {/* ================= PASSAGE STRATEGY ================= */}
        <div style={card}>
          <h3>Passage-wise CAT Strategy</h3>

          {passageStats.map((p, i) => {
            const pct = Math.round((p.correct / p.total) * 100);
            const label =
              pct >= 70
                ? "Selective Attempt"
                : pct >= 40
                ? "Needs Caution"
                : "Avoid in CAT";

            return (
              <div key={i} style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{p.genre} ({p.correct}/{p.total})</strong>
                  <span style={{ color: statusColor(pct), fontSize: 13 }}>
                    {label}
                  </span>
                </div>
                <div style={barWrap}>
                  <div style={bar(pct, statusColor(pct))} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= QUESTION TYPE MAP ================= */}
        <div style={card}>
          <h3>Question-Type Skill Map</h3>

          {sortedQT.map(([type, v]) => {
            const pct = Math.round((v.correct / v.total) * 100);
            return (
              <div key={type} style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>
                    {type} ({v.correct}/{v.total})
                  </strong>
                  <span style={{ color: statusColor(pct), fontSize: 13 }}>
                    {pct >= 70
                      ? "Strength"
                      : pct >= 40
                      ? "Needs Work"
                      : "Weak Area"}
                  </span>
                </div>
                <div style={barWrap}>
                  <div style={bar(pct, statusColor(pct))} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= TOP PRIORITY FIXES ================= */}
        <div style={card}>
          <h3>Top Priority Fixes (Next 7 Days)</h3>
          <p style={muted}>Focus ONLY on these. Ignore other RC work.</p>

          {priorityFixes.length === 0 && (
            <p style={{ color: "#16a34a" }}>
              ✅ No critical weaknesses detected. Maintain strengths.
            </p>
          )}

          {priorityFixes.map(([type, v], i) => (
            <div key={type} style={{ marginTop: 14 }}>
              <strong>
                {i + 1}. {type} ({v.correct}/{v.total})
              </strong>
              <div style={{ fontSize: 13, color: "#475569" }}>
                • Attempt focused drills only<br />
                • Write why each wrong option is wrong<br />
                • No mixed RC practice
              </div>
            </div>
          ))}
        </div>

        {/* ================= ACTION PLAN ================= */}
        <div style={card}>
          <h3>Actionable Rules (Until Accuracy ≥ 60%)</h3>
          <ul style={{ paddingLeft: 18, marginTop: 8 }}>
            <li>Attempt only <b>2 passages</b> per RC sectional.</li>
            <li>Skip abstract / unfamiliar tone passages.</li>
            <li>Analyse only incorrect attempts.</li>
            <li>Increase volume only after accuracy ≥ 60%.</li>
          </ul>

          <button
            onClick={onReview}
            style={{
              marginTop: 16,
              padding: "8px 14px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Review Questions
          </button>
        </div>
      </div>
    </div>
  );
}
