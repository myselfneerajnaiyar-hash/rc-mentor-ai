"use client";

export default function TabGroup({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 6,
        borderRadius: 14,
        background: "#0f172a",
        border: "1px solid #1f2937",
        gap: 6,
      }}
    >
      {tabs.map((tab) => {
        const value = typeof tab === "string" ? tab : tab.value;
        const label = typeof tab === "string" ? tab : tab.label;

        const isActive = active === value;

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s ease",
              background: isActive
                ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                : "transparent",
              color: isActive ? "#fff" : "#9ca3af",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}