"use client";
import { useEffect, useState } from "react";

export default function PlanTab() {
  const WEEKLY_SKILLS = [
    ["main-idea", "detail"],
    ["inference", "function"],
    ["tone", "author-agreement"],
    ["purpose", "application"],
    ["assumption", "strengthen"],
    ["weaken", "next-paragraph"],
    ["mixed", "mixed"],
  ];

  const today = new Date();

  function getWeekId(d) {
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = (d - start) / 86400000;
    return d.getFullYear() + "-W" + Math.ceil((diff + start.getDay() + 1) / 7);
  }

  const weekId = getWeekId(today);
  const [weeks, setWeeks] = useState({});

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("rcWeeklyPlan") || "{}");

    if (!raw[weekId]) {
      const index = Object.keys(raw).length % WEEKLY_SKILLS.length;
      const [a, b] = WEEKLY_SKILLS[index];

      raw[weekId] = {
        created: Date.now(),
        skills: [a, b],
        days: Array.from({ length: 7 }).map(() => ({
          rcDone: 0,
          skillQs: 0,
        })),
      };

      localStorage.setItem("rcWeeklyPlan", JSON.stringify(raw));
    }

    setWeeks(raw);
  }, []);

  const current = weeks[weekId];
  if (!current) return null;

  const dayIndex = (today.getDay() + 6) % 7;
  const todayData = current.days[dayIndex];

  const rcTarget = 3;
  const skillTarget = 10;

  const rcPct = Math.min(100, Math.round((todayData.rcDone / rcTarget) * 100));
  const skillPct = Math.min(
    100,
    Math.round((todayData.skillQs / skillTarget) * 100)
  );

  const completed =
    todayData.rcDone >= rcTarget && todayData.skillQs >= skillTarget;

  return (
    <div style={{ marginTop: 20 }}>
      <h2>This Week’s Plan</h2>

      <div style={{ marginTop: 12, padding: 20, borderRadius: 14, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 14, color: "#555" }}>Focus Skills</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          {current.skills[0].toUpperCase()} + {current.skills[1].toUpperCase()}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {current.days.map((d, i) => {
            const done = d.rcDone >= rcTarget && d.skillQs >= skillTarget;
            return (
              <div key={i} style={{ padding: 10, borderRadius: 10, textAlign: "center", background: done ? "#dcfce7" : "#ffffff", border: "1px solid #e5e7eb", opacity: i > dayIndex ? 0.4 : 1 }}>
                <div style={{ fontSize: 12, color: "#666" }}>Day {i + 1}</div>
                <div style={{ fontSize: 12 }}>{d.rcDone}/{rcTarget} RC</div>
                <div style={{ fontSize: 12 }}>{d.skillQs}/{skillTarget} Q</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20 }}>
          <h4>Today’s Target 🎯</h4>

          <div>RCs: {todayData.rcDone}/{rcTarget}</div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: rcPct + "%", height: "100%", background: "#22c55e" }} />
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("start-plan-drill"))}
            style={{ marginTop: 16, padding: "12px 18px", borderRadius: 10, background: "#2563eb", color: "#fff", border: "none", fontWeight: 700 }}
          >
            Start Today’s Drill
          </button>

          <div style={{ marginTop: 8 }}>
            {current.skills.join(" + ")} Questions: {todayData.skillQs}/{skillTarget}
          </div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: skillPct + "%", height: "100%", background: "#3b82f6" }} />
          </div>

          {completed && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#ecfeff", border: "1px solid #67e8f9" }}>
              🎉 <b>Bravo!</b> You’ve completed today’s plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
