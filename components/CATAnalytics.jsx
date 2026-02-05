"use client";

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
              ...placeholderBox,
              borderRadius: "50%",
              height: 180,
              width: 180,
              margin: "20px auto",
            }}
          >
            ⭕
          </div>

          <div style={{ textAlign: "center", color: "#64748b" }}>
            Donut chart coming here
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

          <div style={placeholderBox}>
            ⏱ Bar chart coming here
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
