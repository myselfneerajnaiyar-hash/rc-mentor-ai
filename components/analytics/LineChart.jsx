export default function LineChart({ data, color }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 300;
      const y = 120 - (d / max) * 100;
      return ${x},${y};
    })
    .join(" ");

  return (
    <svg width="100%" height="140" viewBox="0 0 300 140">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        points={points}
        strokeLinecap="round"
      />
    </svg>
  );
}
