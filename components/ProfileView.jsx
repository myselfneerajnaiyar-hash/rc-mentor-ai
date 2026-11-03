"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useTenant } from "@/components/providers/TenantProvider";
import TenantLogo from "@/components/tenant/TenantLogo";
import { ProfilePlanRow } from "@/components/TrialPromotions";
import profileStyles from "./profile-view.module.css";
import usePricingVisibility from "@/components/usePricingVisibility";


export default function ProfileView({ setView }) {
  const { branding, capabilities, entitlement } = useTenant();
  const showPricing = usePricingVisibility();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState("");
  const detailRef = useRef(null);
  const [stats, setStats] = useState({
    rcTests: 0,
    accuracy: 0,
    vocab: 0,
    sectionals: 0,
  });
  const [profileTab, setProfileTab] = useState("overview");
  const [subscription, setSubscription] = useState(null)

  const [showEdit, setShowEdit] = useState(false);
const [editData, setEditData] = useState({
  name: "",
  exam: "",
  attempt_year: "",
  phone: "",
});


  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileLoadError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData?.user) {
        setProfileLoadError("Your profile could not be loaded. Retry or sign in again.");
        return;
      }

      const userId = authData.user.id;
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!data) {
        setProfileLoadError("We couldn't find your profile. Retry loading it.");
        return;
      }

      setProfile(data);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .maybeSingle();

      setSubscription(sub);
      setEditData({
        name: data.name || "",
        exam: data.exam || "",
        attempt_year: data.attempt_year || "",
        phone: data.phone || "",
      });

      const { data: questions } = await supabase
        .from("rc_questions")
        .select("*")
        .eq("user_id", userId);

      if (questions) {
        const totalQ = questions.length;
        const correctQ = questions.filter(q => q.is_correct).length;
        const sessions = new Set(questions.map(q => q.session_id));

        setStats({
          rcTests: sessions.size,
          accuracy: totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0,
          vocab: JSON.parse(localStorage.getItem("vocabBank") || "[]").length,
          sectionals: Object.keys(JSON.parse(localStorage.getItem("catRCResults") || "{}")).length,
        });
      }
    } catch {
      setProfileLoadError("We couldn't load your profile. Check your connection and retry.");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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

  if (!profile && profileLoading) return (
    <div className={profileStyles.page}>
      <div className={profileStyles.container}>
        <ProfilePlanRow />
        <p role="status" style={{ color: "#94a3b8", fontSize: 13 }}>Loading your profile…</p>
      </div>
    </div>
  );
  if (!profile) return (
    <div className={profileStyles.page}>
      <div className={profileStyles.container}>
        <ProfilePlanRow />
        <section className={profileStyles.section} role="alert">
          <p>{profileLoadError || "We couldn't load your profile."}</p>
          <button className={profileStyles.retryButton} onClick={loadProfile} disabled={profileLoading}>
            {profileLoading ? "Retrying…" : "Retry"}
          </button>
        </section>
      </div>
    </div>
  );
  const isCAT = capabilities.isCAT;

  async function handleLogout() {
  await supabase.auth.signOut();
  setView("home");
}

  return (
  <div className={profileStyles.page}>
  <div className={profileStyles.container}>
      <ProfilePlanRow />
      <button onClick={() => setView("home")} className={profileStyles.backButton}>
        ← Back to Home
      </button>
      <div className={profileStyles.brand}><TenantLogo className="h-8 w-8 rounded-lg object-contain" /><div><p>{branding.brandName}</p>{branding.isInstitute && <small>Powered by Auctor Labs</small>}</div></div>

      <section className={profileStyles.historyLinks} aria-label="History and progress"><h2>History and progress</h2><Link href="/?view=workout&tab=history">Workout history</Link>{capabilities.showDailyRC&&<Link href="/rc-history">Daily RC history</Link>}{entitlement.hasAccess&&<><Link href="/?view=rc&tab=history">RC practice history</Link><Link href="/?view=vocab&tab=profile">Vocabulary progress</Link><Link href="/?view=speed&tab=profile">Speed progress</Link></>}</section>
      <Link className={profileStyles.tourLink} href="/?view=home&tour=replay">Replay Product Tour</Link>
      {/* HERO SECTION */}
      <section className={profileStyles.hero}>
        <div className={profileStyles.avatar}>
          {profile.name?.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2>{profile.name}</h2>
          <p className={profileStyles.subText}>
            {profile.exam} • {profile.attempt_year}
          </p>
          {branding.isInstitute && <p style={{ color: "var(--brand-secondary)", fontSize: 13, margin: "5px 0" }}>{branding.brandName} student portal</p>}

          <p className={profileStyles.metaText}>
  📱 {profile.phone || "Phone not added"}
</p>

{showPricing && subscription && (
  <p
    style={{
      color: "#22c55e",
      fontSize: 14,
      marginTop: 6,
      fontWeight: 600,
    }}
  >
    ⭐ Pro {subscription.plan === "monthly" ? "Monthly" : "Yearly"} Active
    <br />
    Expires on{" "}
    {new Date(subscription.expires_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}
  </p>
)}
          <p className={profileStyles.joined}>
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
      </section>
      

      {/* PERFORMANCE CARDS */}
      <div className={profileStyles.statsGrid}>
  <StatCard label="RC Tests" value={stats.rcTests} />
  <StatCard label="RC Accuracy" value={`${stats.accuracy}%`} />
  <StatCard label="Vocab Words" value={stats.vocab} />

  {isCAT && (
    <StatCard label="CAT Sectionals" value={stats.sectionals} />
  )}
</div>

      {/* SKILL BREAKDOWN */}
      <div className={profileStyles.section}>
        <h3>Skill Breakdown</h3>

        <ProgressBar label="Reading Accuracy" value={stats.accuracy} />
        <ProgressBar
          label="Vocabulary Strength"
          value={Math.min(stats.vocab * 5, 100)}
        />
      </div>

      <div className={profileStyles.section}>
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
<div className={profileStyles.section}>
  <h3 className={profileStyles.sectionTitle}>Growth & Next Steps</h3>

  <div className={profileStyles.actionGrid}>
    <ActionCard className={profileStyles.actionCard}
  title="Performance Trends"
  desc="Track accuracy improvement over time"
  onClick={() => setProfileTab("trends")}
/>

<ActionCard className={profileStyles.actionCard}
  title="Weakness Diagnosis"
  desc="Identify question-type gaps"
  onClick={() => setProfileTab("diagnosis")}
/>
{isCAT && (
  <ActionCard className={profileStyles.actionCard}
    title="Sectional Analytics"
    desc="Deep CAT sectional insights"
    onClick={() => setProfileTab("sectionals")}
  />
)}

<ActionCard className={profileStyles.actionCard}
  title={showPricing ? "Subscription & Courses" : "Institute access"}
  desc="View enrolled programs"
  onClick={() => setProfileTab("subscription")}
/>
  </div>
</div>

<div ref={detailRef}>
{profileTab === "trends" && (
  <div className={profileStyles.section}>
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
  Aim to consistently cross 70% for Exam-level readiness.
</p>
  </div>
)}

{profileTab === "diagnosis" && (
  <div className={profileStyles.section}>
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
  <div className={profileStyles.section}>
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
  <div className={profileStyles.section}>
    <h3>{showPricing ? "Subscription" : "Institute access"}</h3>
   <p style={{ marginBottom: 10 }}>
  Current Plan:{" "}
  <strong>
    {!showPricing || entitlement.isInstituteStudent
      ? "Institute-sponsored access"
      : subscription
      ? `Pro ${
          subscription.plan === "monthly"
            ? "Monthly"
            : "Yearly"
        }`
      : "Free"}
  </strong>
</p>

<p style={{ color: "#94a3b8" }}>
  {entitlement.isInstituteStudent
    ? "Your institute provides full access to the features available for your exam."
    : showPricing ? "Upgrade to Pro for advanced analytics, AI diagnosis, and full sectional sync." : "Your institute access is managed by AN ACADEMY."}
</p>

  </div>
)}

</div>
{showEdit && (
  <div className={profileStyles.modalOverlay}>
    <div className={profileStyles.modalBox}>
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
      <input
  placeholder="Phone Number"
  value={editData.phone}
  onChange={(e) =>
    setEditData({ ...editData, phone: e.target.value })
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
<div className={profileStyles.logout}>
  <button
    onClick={handleLogout}
    className={profileStyles.logoutButton}
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
    <div className={profileStyles.statCard}>
      <p>{label}</p>
    <h2>
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

function ActionCard({ title, desc, onClick, className }) {
  return (
    <div className={className}>
      <h4 style={{ margin: "0 0 6px 0" }}>{title}</h4>
      <p style={{ fontSize: 13, color: "#94a3b8" }}>{desc}</p>
      <button onClick={onClick}>
        Explore →
      </button>
    </div>
  );
}
/* ---------- STYLES ---------- */

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

