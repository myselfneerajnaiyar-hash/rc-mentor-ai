"use client";
import { useState } from "react";
import { Ban, BookOpen, Gauge, HelpCircle, Target, Zap } from "lucide-react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";
import TabGroup from "./TabGroup";

export default function SpeedContainer() {
  const [tab, setTab] = useState("drill");
  const [started, setStarted] = useState(false);

  return (
    <div style={page}>
      {/* HEADER */}
      <div style={header}>
        <h1 style={title}>Speed Reading Gym</h1>
        <p style={subtitle}>
          Train how fast you read without losing meaning.
        </p>

       <TabGroup
  tabs={[
    { label: "Speed Drill", value: "drill" },
    { label: "Speed Profile", value: "profile" },
  ]}
  active={tab}
  onChange={(val) => {
    setTab(val);
    if (val === "drill") setStarted(false);
  }}
/>

        <div style={infoStrip}>
          ⏱️ 3–5 min drills · 🎯 Eye-span & focus · 📈 Progress tracked automatically
        </div>
      </div>

      {/* CONTENT */}
      {tab === "drill" && (
        <div style={drillCard}>
          {!started ? (
            <>
              <section style={drillIntro}>
                <p style={introEyebrow}>SPEED PRACTICE</p>
                <h2 style={introTitle}>Speed Drill</h2>
                <p style={introSubtitle}>Train your reading speed without sacrificing comprehension. Read one paragraph at a time, answer immediately, and build both speed and understanding.</p>

                <div style={introDivider} />

                <h3 style={sectionTitle}>How it works</h3>
                <div style={howItWorksList}>
                  <InfoRow icon={Zap} text="The passage is divided into 4 short paragraphs." />
                  <InfoRow icon={BookOpen} text="You read one paragraph at a time under a time limit based on your current target WPM." />
                  <InfoRow icon={HelpCircle} text="After each paragraph, a comprehension question appears immediately." />
                  <InfoRow icon={Ban} text="Once you move to the next paragraph, you cannot return to previous paragraphs." />
                  <InfoRow icon={Target} text="The drill rewards both speed and comprehension. Reading fast without understanding will reduce your Effective Speed." />
                </div>

                <div style={calculationCard}>
                  <div style={calculationHeading}><Gauge size={18} aria-hidden="true" /><h3 style={sectionTitle}>How your score is calculated</h3></div>
                  <div style={formulaList}>
                    <p><b>Raw WPM</b> = Total words read ÷ Total reading time × 60</p>
                    <p><b>Accuracy</b> = Correct answers ÷ Attempted questions</p>
                    <p><b>Effective Speed</b> = Raw WPM × Accuracy%</p>
                  </div>
                  <div style={formulaExplanation}>
                    <p>Raw WPM measures how fast you read.</p>
                    <p>Effective Speed measures how fast you read while actually understanding the passage.</p>
                  </div>
                  <div style={exampleCard}>
                    <span>Example</span>
                    <p>Raw Speed: <b>300 WPM</b></p>
                    <p>Accuracy: <b>80%</b></p>
                    <p>Effective Speed: <b>240 WPM</b></p>
                  </div>
                </div>

                <p style={adaptationNote}>Your next target is adapted using your recent performance, not a single drill. Consistent performance with good comprehension gradually increases the target.</p>
              </section>

              <div style={ctaRow}>
                <button
  onClick={() => setStarted(true)}
  className="mt-6 px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/20"
>
  Start Drill
</button>
              </div>
            </>
          ) : (
            <SpeedGym />
          )}
        </div>
      )}

      {tab === "profile" && (
        <div style={profileCard}>
          <SpeedDashboard />
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, text }) {
  return <div style={infoRow}><span style={infoIcon}><Icon size={17} aria-hidden="true" /></span><span>{text}</span></div>;
}

/* ================= STYLES ================= */

/* ================= DARK PERFORMANCE THEME ================= */

const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0f172a, #0b1220)",
  padding: "clamp(16px, 4vw, 32px)",
  boxSizing: "border-box",
  overflowX: "hidden",
  color: "#e2e8f0",
};

const header = {
  background: "#111827",
  borderRadius: 24,
  padding: "clamp(16px, 4vw, 28px)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  border: "1px solid #1f2937",
};

const title = {
  fontSize: 32,
  letterSpacing: "-0.5px",
  fontWeight: 800,
  color: "#f8fafc",
};

const subtitle = {
  color: "#94a3b8",
  fontSize: 14,
  marginBottom: 14,
};




const infoStrip = {
  marginTop: 12,
  fontSize: 13,
  background: "#0b1220",
  border: "1px solid #1e293b",
  color: "#94a3b8",
  borderRadius: 12,
  padding: "10px 14px",
};

const drillCard = {
  marginTop: 18,
  background: "#111827",
  boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
  border: "1px solid #1f2937",
  borderRadius: 22,
  padding: "clamp(16px, 4vw, 22px)",
};

const sectionTitle = {
  fontSize: 20,
  fontWeight: 800,
  margin: 0,
  color: "#f8fafc",
};

const drillIntro = { maxWidth: 760, margin: "0 auto" };
const introEyebrow = { margin: "0 0 8px", color: "#38bdf8", fontSize: 12, fontWeight: 800, letterSpacing: "0.1em" };
const introTitle = { margin: 0, fontSize: "clamp(28px, 5vw, 36px)", letterSpacing: "-0.6px", fontWeight: 800, color: "#f8fafc" };
const introSubtitle = { margin: "12px 0 0", maxWidth: 680, color: "#94a3b8", fontSize: 16, lineHeight: 1.65 };
const introDivider = { height: 1, margin: "24px 0", background: "#1f2937" };
const howItWorksList = { display: "grid", gap: 10, marginTop: 14 };
const infoRow = { display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 14, background: "#0f172a", border: "1px solid #1e293b", color: "#cbd5e1", fontSize: 14, lineHeight: 1.55 };
const infoIcon = { display: "grid", placeItems: "center", flex: "0 0 auto", width: 30, height: 30, borderRadius: 10, color: "#7dd3fc", background: "#172554" };
const calculationCard = { marginTop: 22, padding: "clamp(16px, 3vw, 20px)", borderRadius: 18, background: "#0f172a", border: "1px solid #1e293b" };
const calculationHeading = { display: "flex", alignItems: "center", gap: 9, color: "#38bdf8" };
const formulaList = { marginTop: 14, color: "#e2e8f0", fontSize: 14, lineHeight: 1.7 };
const formulaExplanation = { marginTop: 14, paddingTop: 14, borderTop: "1px solid #1e293b", color: "#94a3b8", fontSize: 13, lineHeight: 1.6 };
const exampleCard = { marginTop: 16, padding: 14, borderRadius: 14, background: "#111827", border: "1px solid #26354d", color: "#cbd5e1", fontSize: 14, lineHeight: 1.6 };
const adaptationNote = { margin: "18px 0 0", padding: "12px 14px", borderRadius: 12, background: "#172554", border: "1px solid #1d4ed8", color: "#bfdbfe", fontSize: 13, lineHeight: 1.6 };

const steps = {
  paddingLeft: 18,
  fontSize: 14,
  lineHeight: "1.8",
  color: "#cbd5e1",
};

const benefits = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginTop: 16,
};

const benefitBox = {
  background: "#0f172a",
  padding: 14,
  borderRadius: 14,
  fontSize: 13,
  fontWeight: 600,
  border: "1px solid #1e293b",
  color: "#e2e8f0",
};

const ctaRow = {
  marginTop: 18,
  display: "flex",
  justifyContent: "center",
};


const profileCard = {
  marginTop: 18,
  background: "#111827",
  borderRadius: 22,
  padding: "clamp(16px, 4vw, 20px)",
  border: "1px solid #1f2937",
};

