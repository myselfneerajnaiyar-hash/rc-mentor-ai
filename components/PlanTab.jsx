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
    <div style={{ marginTop: 24, maxWidth: 1000 }}>
      <h2 style={{ marginBottom: 12 }}>This Week’s Plan</h2>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Focus Skills */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Focus Skills</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {current.skills[0].toUpperCase()}{" "}
            <span style={{ color: "#94a3b8" }}>+</span>{" "}
            {current.skills[1].toUpperCase()}
          </div>
        </div>

        {/* Week Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {current.days.map((d, i) => {
            const done = d.rcDone >= rcTarget && d.skillQs >= skillTarget;
            const isToday = i === dayIndex;

            return (
              <div
                key={i}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  textAlign: "center",
                  background: done ? "#dcfce7" : "#f8fafc",
                  border: isToday
                    ? "2px solid #2563eb"
                    : "1px solid #e5e7eb",
                  opacity: i > dayIndex ? 0.4 : 1,
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Day {i + 1}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {d.rcDone}/{rcTarget} RC
                </div>
                <div style={{ fontSize: 12 }}>
                  {d.skillQs}/{skillTarget} Q
                </div>
              </div>
            );
          })}
        </div>

        {/* Today’s Mission */}
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ marginTop: 0 }}>🎯 Today’s Mission</h3>

          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            RCs: {todayData.rcDone}/{rcTarget}
          </div>

          <div
            style={{
              height: 10,
              background: "#e5e7eb",
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: rcPct + "%",
                height: "100%",
                background: "linear-gradient(90deg, #22c55e, #16a34a)",
              }}
            />
          </div>

          <button
            onClick={() => {
              const todayKey = new Date().toISOString().slice(0, 10);
              const done = localStorage.getItem("rcPlanDone-" + todayKey);

              if (done) {
                alert(
                  "You have already completed today’s drill. Come back tomorrow."
                );
                return;
              }

              window.dispatchEvent(new CustomEvent("start-plan-drill"));
            }}
            style={{
              padding: "14px 22px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
              cursor: "pointer",
            }}
          >
            Start Today’s Drill
          </button>

          <div style={{ marginTop: 14, fontWeight: 600 }}>
            {current.skills.join(" + ")} Questions:{" "}
            {todayData.skillQs}/{skillTarget}
          </div>

          <div
            style={{
              height: 10,
              background: "#e5e7eb",
              borderRadius: 999,
              overflow: "hidden",
              marginTop: 6,
            }}
          >
            <div
              style={{
                width: skillPct + "%",
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6, #1d4ed8)",
              }}
            />
          </div>

          {completed && (
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 12,
                background: "#ecfeff",
                border: "1px solid #67e8f9",
                fontWeight: 600,
              }}
            >
              🎉 Bravo! You’ve completed today’s plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
