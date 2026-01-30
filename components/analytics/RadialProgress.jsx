export default function RadialProgress({ percent, label, color }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="140" height="140">
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="#e5e7eb"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text
          x="70"
          y="78"
          textAnchor="middle"
          fontSize="24"
          fontWeight="700"
          fill="#111827"
        >
          {percent}%
        </text>
      </svg>
      <div style={{ fontSize: 13, color: "#475569" }}>{label}</div>
    </div>
  );
}
