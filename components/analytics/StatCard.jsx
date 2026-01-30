export default function StatCard({ title, value, subtitle, color }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        border: `1px solid ${color}33`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 13, color: "#475569" }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{subtitle}</div>
    </div>
  );
}
