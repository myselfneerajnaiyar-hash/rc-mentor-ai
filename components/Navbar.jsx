export default function Navbar({ view, setView }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}
    >
      <h2 style={{ margin: 0, color: "#111" }}>RC Mentor</h2>

      <div style={{ display: "flex", gap: 8 }}>
        {["home", "rc", "vocab", "speed", "cat"].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
              background: view === v ? "#2563eb" : "#f3f4f6",
              color: view === v ? "#fff" : "#111",
              border: "1px solid #e5e7eb",
            }}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
