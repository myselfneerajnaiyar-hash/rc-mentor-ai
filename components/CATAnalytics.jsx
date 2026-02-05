"use client";
const STORAGE_KEY = "catRCResults";

function getAverageTimePerQuestion() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    let totalTime = 0;
    let totalAttempts = 0;

    Object.values(data).forEach(sectionAttempts => {
      if (!Array.isArray(sectionAttempts)) return;

      sectionAttempts.forEach(attempt => {
        const times = attempt.questionTime || {};
        const answers = attempt.answers || {};

        Object.keys(answers).forEach(qid => {
          if (answers[qid] !== null && times[qid]) {
            totalTime += times[qid];
            totalAttempts += 1;
          }
        });
      });
    });

    if (totalAttempts === 0) return null;

    return Math.round(totalTime / totalAttempts);
  } catch {
    return null;
  }
}
function getOverallAccuracy() {
  try {
    const data = JSON.parse(localStorage.getItem("catRCResults")) || {};

    let correct = 0;
    let attempted = 0;

    Object.values(data).forEach(sectionAttempts => {
      if (!Array.isArray(sectionAttempts)) return;

      sectionAttempts.forEach(attempt => {
        const answers = attempt.answers || {};
        const questions = attempt.questions || {};

        Object.keys(answers).forEach(qid => {
          if (answers[qid] !== null) {
            attempted += 1;
            if (answers[qid] === questions[qid]?.correctOption) {
              correct += 1;
            }
          }
        });
      });
    });

    if (attempted === 0) return null;

    return Math.round((correct / attempted) * 100);
  } catch {
    return null;
  }
}

export default function CATAnalytics() {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      {/* ================= HEADER ================= */}
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>
        📊 CAT Sectional Analytics
      </h1>

      <p style={{ color: "#64748b", marginBottom: 28 }}>
        This analytics page reflects only your performance in CAT RC sectional
        tests. Practice RC, SpeedGym, and Vocabulary are not included.
      </p>

      {/* ================= GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* -------- Learning Overview -------- */}
        <div style={card}>
          <h3 style={cardTitle}>Learning Overview</h3>
          <p style={cardSub}>
            Tracks your sectional test performance over time
          </p>

          <div style={placeholderBox}>
            📈 Line chart coming here
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <Stat label="Total Sectionals" value="—" />
            <Stat label="Total Attempts" value="—" />
          </div>
        </div>

        {/* -------- Average Performance -------- */}
        <div style={card}>
          <h3 style={cardTitle}>Average Performance</h3>
          <p style={cardSub}>Overall accuracy across sectionals</p>

          <div
  style={{
    height: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {(() => {
    const accuracy = getOverallAccuracy();

    if (!accuracy) {
      return <span style={{ color: "#64748b" }}>No data yet</span>;
    }

    return (
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `conic-gradient(
            #3b82f6 ${accuracy * 3.6}deg,
            #e5e7eb 0deg
          )`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {accuracy}%
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Accuracy
          </div>
        </div>
      </div>
    );
  })()}
</div>
        </div>
      </div>

      {/* ================= SECOND ROW ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
        }}
      >
        {/* -------- Skill Breakdown -------- */}
        <div style={card}>
          <h3 style={cardTitle}>RC Skill Profile</h3>
          <p style={cardSub}>Accuracy & selection intelligence</p>

          <div style={placeholderBox}>
            🕸 Radar chart coming here
          </div>
        </div>

        {/* -------- Time Analysis -------- */}
        <div style={card}>
          <h3 style={cardTitle}>Time Analysis</h3>
          <p style={cardSub}>Average time per question</p>

         <div
  style={{
    height: 160,
    borderRadius: 12,
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {(() => {
    const avg = getAverageTimePerQuestion();

    if (!avg) {
      return <span style={{ color: "#64748b" }}>No data yet</span>;
    }

    const min = Math.floor(avg / 60);
    const sec = avg % 60;

    return (
      <>
        <div style={{ fontSize: 26, fontWeight: 700 }}>
          {min}m {sec}s
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Avg time per question
        </div>
      </>
    );
  })()}
</div>
        </div>

        {/* -------- Plan of Action -------- */}
        <div style={card}>
          <h3 style={cardTitle}>Plan of Action</h3>
          <p style={cardSub}>What you should focus on next</p>

          <ul style={{ paddingLeft: 18, color: "#334155" }}>
            <li>Improve passage selection</li>
            <li>Reduce time spent on low ROI passages</li>
            <li>Increase accuracy above threshold</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const card = {
  background: "#ffffff",
  borderRadius: 14,
  padding: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 4,
};

const cardSub = {
  fontSize: 13,
  color: "#64748b",
  marginBottom: 16,
};

const placeholderBox = {
  height: 160,
  borderRadius: 12,
  background: "#f1f5f9",
  border: "1px dashed #cbd5e1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontSize: 14,
};
