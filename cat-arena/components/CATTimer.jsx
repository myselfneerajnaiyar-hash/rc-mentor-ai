"use client";

import { useEffect, useRef, useState } from "react";
import { remainingSectionalSeconds } from "../../lib/cat-arena/sectionalTiming";

export default function CATTimer({ durationMinutes, deadlineAt, onTimeUp }) {
  const initialSeconds = deadlineAt
    ? remainingSectionalSeconds(Date.now(), deadlineAt)
    : durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  const expiredRef = useRef(false);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    expiredRef.current = false;
    const interval = setInterval(() => {
      setSecondsLeft((previous) => {
        const next = deadlineAt
          ? remainingSectionalSeconds(Date.now(), deadlineAt)
          : Math.max(0, previous - 1);
        if (next === 0) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onTimeUpRef.current?.();
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt, durationMinutes]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div style={{ fontWeight: 600, color: "#f87171" }}>
      ⏱ {mins}:{secs}
    </div>
  );
}
