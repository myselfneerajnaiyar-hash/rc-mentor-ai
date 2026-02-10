export default function HomeView({ setView, startAdaptiveRC }) {
  return (
    <div style={wrap}>
      <div style={panel}>
        <h1 style={title}>AuctorRC</h1>
        <p style={subtitle}>Today, build clarity. One RC at a time.</p>

        {/* Progress Card */}
        <div style={progressCard}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Today’s Progress</b>
            <span>1 / 3 RCs</span>
          </div>

          <div style={barOuter}>
            <div style={barInner} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <span>Weekly Target: 12 RCs</span>
            <span>Accuracy: 72%</span>
          </div>
        </div>

        {/* Action Grid */}
        <div style={grid}>
          <Card
            title="Adaptive RC Flow"
            desc="Train your weakest RC skills."
            color="#4f7cff"
            onClick={() => {
              setView("rc");
              startAdaptiveRC();
            }}
            label="Start Adaptive RC"
          />

          <Card
            title="Vocabulary Lab"
            desc="Improve vocabulary for CAT passages."
            color="#f59e0b"
            onClick={() => setView("vocab")}
            label="Practice Vocabulary"
          />

          <Card
            title="Speed Reading Gym"
            desc="Boost reading speed & retention."
            color="#22c55e"
            onClick={() => setView("speed")}
            label="Start Speed Drill"
          />

          <Card
            title="CAT RC Arena"
            desc="Full-length RC practice tests."
            color="#6366f1"
            onClick={() => setView("cat")}
            label="Start 30-Min Test"
          />
        </div>

        {/* Why This Works */}
        <div style={why}>
          <h3>Why This Works</h3>
          <ul>
            <li>You don’t fail CAT because of weak vocabulary.</li>
            <li>You fail by misreading logic and falling for traps.</li>
            <li>AuctorRC trains how you think, not just what you read.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, label, color, onClick }) {
  const isVocab = color === "#f59e0b";

  return (
    <div
      onClick={onClick}
      style={{
        ...card,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3>{title}</h3>

      {/* FIX 1: equal text height */}
      <p style={{ minHeight: 48 }}>{desc}</p>

      {/* Button wrapper */}
      <div style={{ marginTop: "auto" }}>
        <button
          style={{
            ...btn,
            width: "100%",
            background: isVocab ? "#fff7ed" : color,
            color: isVocab ? "#d97706" : "#fff",
            border: isVocab ? "2px solid #f59e0b" : "none",
            fontWeight: 600,
          }}
        >
          {label} →
        </button>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  paddingTop: 20,
  color: "#0f172a",
};

const panel = {
  width: "100%",
  maxWidth: 720,
  padding: "20px 16px 90px",
  borderRadius: 0,
  background: "linear-gradient(180deg, #f0f9ff, #e0f2fe)",
};

const title = { fontSize: 28, fontWeight: 800, marginBottom: 4 };
const subtitle = { color: "#475569", marginBottom: 20, fontSize: 14 };

const progressCard = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 16,
  marginBottom: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const barOuter = {
  height: 8,
  background: "#e5e7eb",
  borderRadius: 6,
  marginTop: 8,
};

const barInner = {
  height: "100%",
  width: "33%",
  background: "#f59e0b",
  borderRadius: 6,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 24,
};

const card = {
  background: "rgba(255,255,255,0.85)",
  borderRadius: 18,
  padding: 22,
  boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
};

const btn = {
  marginTop: 12,
  border: "none",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
};

const why = {
  marginTop: 20,
  background: "rgba(255,255,255,0.6)",
  borderRadius: 14,
  padding: 16,
  fontSize: 14,
  color: "#475569",
};
