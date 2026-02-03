"use client";

export default function DiagnosisView({
  diagnosis = {},
  passageStats = [],
  previousDiagnosis = null,
  onReview = () => {},
}) {
  /* ================= SAFE NORMALIZATION ================= */
  const safeDiagnosis = {
    total: diagnosis.total ?? 0,
    correct: diagnosis.correct ?? 0,
    attempted:
      diagnosis.attempted ??
      (diagnosis.correct ?? 0) + (diagnosis.incorrect ?? 0),
    incorrect: diagnosis.incorrect ?? 0,
    unattempted: diagnosis.unattempted ?? 0,
    byQuestionType: diagnosis.byQuestionType ?? {},
  };

  const accuracy =
    safeDiagnosis.attempted > 0
      ? Math.round((safeDiagnosis.correct / safeDiagnosis.attempted) * 100)
      : 0;

  const qtEntries = Object.entries(safeDiagnosis.byQuestionType);

  const sortedQT = qtEntries.sort(
    (a, b) =>
      b[1].total - a[1].total ||
      a[1].correct / (a[1].total || 1) -
        b[1].correct / (b[1].total || 1)
  );

  const priorityFixes = sortedQT
    .filter(([_, v]) => v.total >= 2 && v.correct / v.total < 0.4)
    .slice(0, 3);

  /* ================= STYLES ================= */
  const page = {
    background: "linear-gradient(180deg, #f8fafc, #eef2ff)",
    minHeight: "100vh",
    padding: "40px 16px",
  };

  const card = {
    background: "#ffffff",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    marginBottom: 26,
  };

  const muted = { color: "#64748b", fontSize: 14 };
  const h2 = { marginBottom: 6 };

  const statGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
    gap: 16,
    marginTop: 18,
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
    marginTop: 6,
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
              <strong>
                {safeDiagnosis.correct} / {safeDiagnosis.total}
              </strong>
            </div>

            <div style={statBox("#dc2626")}>
              <div style={muted}>Incorrect Attempts</div>
              <strong>{safeDiagnosis.incorrect}</strong>
            </div>

            <div style={statBox("#0ea5e9")}>
              <div style={muted}>Smart Skips</div>
              <strong>{safeDiagnosis.unattempted}</strong>
            </div>

            <div style={statBox("#16a34a")}>
              <div style={muted}>Accuracy</div>
              <strong>{accuracy}%</strong>
            </div>
          </div>

          {!previousDiagnosis && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
              📊 Comparison will unlock after your next RC sectional.
            </p>
          )}
        </div>

        {/* ================= PASSAGE STRATEGY ================= */}
        <div style={card}>
          <h3>Passage-wise CAT Strategy</h3>

          {passageStats.length === 0 && (
            <p style={muted}>No passage data available.</p>
          )}

          {passageStats.map((p, i) => {
            const pct =
              p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;

            const label =
              pct >= 70
                ? "Selective Attempt"
                : pct >= 40
                ? "Needs Caution"
                : "Avoid in CAT";

            return (
              <div key={i} style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>
                    {p.genre} ({p.correct}/{p.total})
                  </strong>
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

          {sortedQT.length === 0 && (
            <p style={muted}>No question-type data available.</p>
          )}

          {sortedQT.map(([type, v]) => {
            const pct =
              v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0;

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
          <p style={muted}>Ignore everything else.</p>

          {priorityFixes.length === 0 && (
            <p style={{ color: "#16a34a" }}>
              ✅ No critical weaknesses detected.
            </p>
          )}

          {priorityFixes.map(([type, v], i) => (
            <div key={type} style={{ marginTop: 14 }}>
              <strong>
                {i + 1}. {type}
              </strong>
              <div style={{ fontSize: 13, color: "#475569" }}>
                • Analyse only wrong options<br />
                • Identify elimination error<br />
                • No mixed RC practice
              </div>
            </div>
          ))}
        </div>

        {/* ================= ACTION RULES ================= */}
        <div style={card}>
          <h3>Action Rules (Until Accuracy ≥ 60%)</h3>
          <ul style={{ paddingLeft: 18 }}>
            <li>Attempt only 2 passages per sectional.</li>
            <li>Skip abstract / unfamiliar tones.</li>
            <li>Analyse incorrect attempts only.</li>
            <li>Increase volume only after accuracy ≥ 60%.</li>
          </ul>

          <button
            onClick={onReview}
            style={{
              marginTop: 14,
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
