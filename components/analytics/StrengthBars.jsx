export default function StrengthBars({ data }) {
  return (
    <div>
      {data.map((d, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>
            {d.label} ({d.value})
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 6,
              background: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${d.percent}%`,
                height: "100%",
                background: d.color,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
