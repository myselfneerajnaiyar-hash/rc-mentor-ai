"use client";

import { useEffect, useState } from "react";

export default function CATTimer({
  durationMinutes = 30,
  onTimeUp,
}) {
  const TOTAL_SECONDS = durationMinutes * 60;

  const [secondsLeft, setSecondsLeft] = useState(() => {
    const saved = localStorage.getItem("cat_timer");
    return saved ? Number(saved) : TOTAL_SECONDS;
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      localStorage.removeItem("cat_timer");
      onTimeUp && onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1;
        localStorage.setItem("cat_timer", next);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const danger = secondsLeft <= 300; // last 5 minutes

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 600,
        color: danger ? "#dc2626" : "#374151",
      }}
    >
      ⏱️ {String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </div>
  );
}
