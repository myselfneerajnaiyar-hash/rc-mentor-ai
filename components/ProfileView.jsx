"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";


export default function ProfileView({ setView }) {
  const [profile, setProfile] = useState(null);
  const detailRef = useRef(null);
  const [stats, setStats] = useState({
    rcTests: 0,
    accuracy: 0,
    vocab: 0,
    sectionals: 0,
  });
  const [profileTab, setProfileTab] = useState("overview");

  const [showEdit, setShowEdit] = useState(false);
const [editData, setEditData] = useState({
  name: "",
  exam: "",
  attempt_year: "",
});


  useEffect(() => {
  async function loadProfile() {

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const userId = authData.user.id;

    // 1️⃣ Fetch profile info
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    setProfile(data);
    setEditData({
      name: data?.name || "",
      exam: data?.exam || "",
      attempt_year: data?.attempt_year || "",
    });

    // 2️⃣ 🔥 ADD THIS ENTIRE BLOCK HERE 🔥

    const { data: questions } = await supabase
      .from("rc_questions")
      .select("*")
      .eq("user_id", userId);

    if (questions) {
      const totalQ = questions.length;
      const correctQ = questions.filter(q => q.is_correct).length;

      const accuracy =
        totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

      const sessions = new Set(
        questions.map(q => q.session_id)
      );

      setStats({
        rcTests: sessions.size,
        accuracy,
        vocab: JSON.parse(localStorage.getItem("vocabBank") || "[]").length,
        sectionals: Object.keys(
          JSON.parse(localStorage.getItem("catRCResults") || "{}")
        ).length,
      });
    }
  }

  loadProfile();
}, []);

  useEffect(() => {
  if (profileTab !== "overview" && detailRef.current) {
    setTimeout(() => {
      detailRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }
}, [profileTab]);

  if (!profile) return null;

  async function handleLogout() {
  await supabase.auth.signOut();
  setView("home");
}

  return (
  <div style={page}>
  <div style={container}>
      <button onClick={() => setView("home")} style={backBtn}>
        ← Back to Home
      </button>

      {/* HERO SECTION */}
      <div style={hero}>
        <div style={avatar}>
          {profile.name?.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 style={{ margin: 0 }}>{profile.name}</h2>
          <p style={subText}>
            {profile.exam} • {profile.attempt_year}
          </p>
          <p style={joined}>
            Joined{" "}
            {new Date(profile.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <button
  onClick={() => setShowEdit(true)}
  style={{
    marginTop: 10,
    padding: "8px 16px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  }}
>
  Edit Profile
</button>
          
        </div>
      </div>
      

      {/* PERFORMANCE CARDS */}
      <div style={grid}>
        <StatCard label="RC Tests" value={stats.rcTests} />
        <StatCard label="RC Accuracy" value={`${stats.accuracy}%`} />
        <StatCard label="Vocab Words" value={stats.vocab} />
        <StatCard label="CAT Sectionals" value={stats.sectionals} />
      </div>

      {/* SKILL BREAKDOWN */}
      <div style={section}>
        <h3>Skill Breakdown</h3>

        <ProgressBar label="Reading Accuracy" value={stats.accuracy} />
        <ProgressBar
          label="Vocabulary Strength"
          value={Math.min(stats.vocab * 5, 100)}
        />
      </div>

      <div style={section}>
  <h3>Overall Snapshot</h3>

  <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
    You have attempted <b>{stats.rcTests}</b> RC tests with an average
    accuracy of <b>{stats.accuracy}%</b>. Your vocabulary bank contains
    <b> {stats.vocab} words</b>.
  </p>

  <p style={{ color: "#cbd5e1", marginTop: 10 }}>
    Focus Area:{" "}
    <b>
      {stats.accuracy < 50
        ? "Improve comprehension accuracy"
        : "Improve speed under pressure"}
    </b>
  </p>
</div>

     {/* GROWTH & ACTIONS */}
<div style={section}>
  <h3 style={{ marginBottom: 20 }}>Growth & Next Steps</h3>

  <div style={actionGrid}>
    <ActionCard
  title="Performance Trends"
  desc="Track accuracy improvement over time"
  onClick={() => setProfileTab("trends")}
/>

<ActionCard
  title="Weakness Diagnosis"
  desc="Identify question-type gaps"
  onClick={() => setProfileTab("diagnosis")}
/>

<ActionCard
  title="Sectional Analytics"
  desc="Deep CAT sectional insights"
  onClick={() => setProfileTab("sectionals")}
/>

<ActionCard
  title="Subscription & Courses"
  desc="View enrolled programs"
  onClick={() => setProfileTab("subscription")}
/>
  </div>
</div>

<div ref={detailRef}>
{profileTab === "trends" && (
  <div style={section}>
    <h3>Performance Trends</h3>
   <p style={{ marginBottom: 15 }}>
  Your last {stats.rcTests} RC tests show an average accuracy of{" "}
  <strong>{stats.accuracy}%</strong>.
</p>

<div style={barOuter}>
  <div
    style={{
      ...barInner,
      width: `${stats.accuracy}%`,
    }}
  />
</div>

<p style={{ fontSize: 13, marginTop: 10, color: "#94a3b8" }}>
  Aim to consistently cross 70% for CAT-level readiness.
</p>
  </div>
)}

{profileTab === "diagnosis" && (
  <div style={section}>
    <h3>Weakness Diagnosis</h3>
   <p style={{ marginBottom: 10 }}>
  Based on your current accuracy:
</p>

{stats.accuracy < 50 && (
  <p style={{ color: "#dc2626" }}>
    ⚠ You need to improve comprehension accuracy.
  </p>
)}

{stats.accuracy >= 50 && stats.accuracy < 70 && (
  <p style={{ color: "#f59e0b" }}>
    ⚡ You're improving. Focus on reducing silly mistakes.
  </p>
)}

{stats.accuracy >= 70 && (
  <p style={{ color: "#16a34a" }}>
    ✅ Strong performance. Maintain consistency.
  </p>
)}
  </div>
)}

{profileTab === "sectionals" && (
  <div style={section}>
    <h3>Sectional Analytics</h3>
    <p>
  You have attempted{" "}
  <strong>{stats.sectionals}</strong> CAT sectionals.
</p>

{stats.sectionals === 0 && (
  <p style={{ color: "#94a3b8", marginTop: 10 }}>
    Start your first sectional to unlock analytics.
  </p>
)}
  </div>
)}

{profileTab === "subscription" && (
  <div style={section}>
    <h3>Subscription</h3>
    <p style={{ marginBottom: 10 }}>
  Current Plan: <strong>Free</strong>
</p>

<p style={{ color: "#94a3b8" }}>
  Upgrade to Pro for advanced analytics, AI diagnosis,
  and full sectional sync.
</p>

<button
  style={{
    marginTop: 15,
    padding: "10px 18px",
    background: "#2563eb",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  Upgrade Plan
</button>
  </div>
)}

</div>
{showEdit && (
  <div style={modalOverlay}>
    <div style={modalBox}>
      <h3 style={{ marginBottom: 20 }}>Edit Profile</h3>

      <input
        placeholder="Name"
        value={editData.name}
        onChange={(e) =>
          setEditData({ ...editData, name: e.target.value })
        }
        style={input}
      />

      <input
        placeholder="Exam (CAT)"
        value={editData.exam}
        onChange={(e) =>
          setEditData({ ...editData, exam: e.target.value })
        }
        style={input}
      />

      <input
        placeholder="Attempt Year (2026)"
        value={editData.attempt_year}
        onChange={(e) =>
          setEditData({ ...editData, attempt_year: e.target.value })
        }
        style={input}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={async () => {
            const { data: authData } =
              await supabase.auth.getUser();

            await supabase
              .from("profiles")
              .update(editData)
              .eq("user_id", authData.user.id);

            setProfile({ ...profile, ...editData });
            setShowEdit(false);
          }}
          style={saveBtn}
        >
          Save
        </button>

        <button
          onClick={() => setShowEdit(false)}
          style={cancelBtn}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
<div style={{ textAlign: "center", marginTop: 40 }}>
  <button
    onClick={handleLogout}
    style={{
      padding: "10px 20px",
      background: "#ef4444",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontWeight: 600,
      cursor: "pointer",
    }}
  >
    Logout
  </button>
</div>

    </div>
    </div>
    
  );
}

/* ---------- COMPONENTS ---------- */

function StatCard({ label, value }) {
  return (
    <div style={card}>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>{label}</p>
    <h2 style={{ margin: "6px 0", fontSize: 34, fontWeight: 700 }}>
  {value}
</h2>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ marginBottom: 6 }}>{label}</p>
      <div style={barOuter}>
        <div style={{ ...barInner, width: `${value}%`}} />
      </div>
    </div>
  );
}

function ActionCard({ title, desc, onClick }) {
  return (
    <div style={actionCard}>
      <h4 style={{ margin: "0 0 6px 0" }}>{title}</h4>
      <p style={{ fontSize: 13, color: "#94a3b8" }}>{desc}</p>
      <button style={actionBtn} onClick={onClick}>
        Explore →
      </button>
    </div>
  );
}
/* ---------- STYLES ---------- */

const page = {
  minHeight: "100vh",
  background: "#020617",
  padding: "40px 20px 140px",
};

const container = {
  maxWidth: 1000,
  margin: "0 auto",
};

const backBtn = {
  marginBottom: 24,
  background: "none",
  border: "none",
  color: "#38bdf8",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 15,
};

const hero = {
  display: "flex",
  gap: 24,
  alignItems: "center",
  padding: 32,
  background: "#0f172a",
  borderRadius: 22,
  border: "1px solid #1e293b",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  marginBottom: 32,
};

const avatar = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "#2563eb",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 32,
  fontWeight: 700,
};

const subText = {
  color: "#94a3b8",
  margin: "4px 0",
};

const joined = {
  fontSize: 13,
  color: "#94a3b8",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 20,
  marginBottom: 40,
};

const card = {
  background: "#0f172a",
  padding: 22,
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  textAlign: "center",
};

const section = {
  background: "#0f172a",
  padding: 30,
  borderRadius: 20,
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  marginBottom: 30,
};

const barOuter = {
  height: 8,
  background: "#e5e7eb",
  borderRadius: 6,
};

const barInner = {
  height: "100%",
  background: "#2563eb",
  borderRadius: 6,
};

const primaryBtn = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "8px 16px",
  background: "#e2e8f0",
  color: "#1e293b",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
};

const actionGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 20,
};

const actionCard = {
  background: "#020617",
  padding: 22,
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
  transition: "all 0.2s ease",
};

const actionBtn = {
  marginTop: 10,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: 10,
  fontSize: 13,
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalBox = {
  background: "#0f172a",
  padding: 32,
  borderRadius: 16,
  width: 400,
  border: "1px solid #1e293b",
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  color: "#e2e8f0",
};

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e2e8f0",
};

const saveBtn = {
  padding: "10px 18px",
  background: "#2563eb",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const cancelBtn = {
  padding: "10px 18px",
  background: "#1e293b",
  border: "none",
  borderRadius: 8,
  color: "#e2e8f0",
  cursor: "pointer",
};