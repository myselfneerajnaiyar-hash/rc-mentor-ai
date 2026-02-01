"use client";

import { useEffect, useState } from "react";

export default function CATTimer({
  durationMinutes = 30,
  onTimeUp,
}) {
  const [secondsLeft, setSecondsLeft] = useState(
    durationMinutes * 60
  );

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp && onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(s => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const isCritical = secondsLeft <= 300; // last 5 min

  return (
    <div
      style={{
        fontWeight: 600,
        fontSize: 18,
        color: isCritical ? "#dc2626" : "#b91c1c",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      ⏱️ {String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </div>
  );
}
