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
            label="Start 40-Min Test"
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
  return (
    <div style={card}>
      <h3>{title}</h3>
      <p>{desc}</p>
      <button style={{ ...btn, background: color }} onClick={onClick}>
        {label} →
      </button>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "#0f172a",
};

const panel = {
  width: "100%",
  maxWidth: 1100,
  padding: 32,
  borderRadius: 24,
  background: "linear-gradient(180deg, #f0f9ff, #e0f2fe)",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
};

const title = { fontSize: 36, marginBottom: 6 };
const subtitle = { color: "#475569", marginBottom: 30 };

const progressCard = {
  background: "rgba(255,255,255,0.8)",
  borderRadius: 16,
  padding: 20,
  marginBottom: 28,
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
  gap: 20,
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
  marginTop: 30,
  background: "rgba(255,255,255,0.75)",
  borderRadius: 16,
  padding: 20,
};
