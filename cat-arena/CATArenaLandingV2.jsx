"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import CATAnalytics from "../app/components/CATAnalytics";



export default function CATArenaLanding({
  isMobile,
  onStartRC,
  onViewDiagnosis,
}) {
  const [attemptedMap, setAttemptedMap] = useState({});
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pyq");

  const [sectionals, setSectionals] = useState([]);
  const [plan, setPlan] = useState(null);

  useEffect(() => {

  async function loadPlan() {

    const { data: authData } =
      await supabase.auth.getUser();

    if (!authData?.user) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", authData.user.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    setPlan(data?.plan || null);
  }

  loadPlan();

}, []);
  useEffect(() => {
  async function loadTests() {
    const { data, error } = await supabase
      .from("sectional_test_content")
      .select("*")
      .eq("is_published", true)
      .order("test_number");

    if (!error) {
      setSectionals(data || []);
    }
  }

  loadTests();
}, []);

  useEffect(() => {
    async function loadAttempts() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data } = await supabase
  .from("mentor_test_attempts")
  .select("id,test_id")
  .eq("user_id", authData.user.id);

      const map = {};

(data || []).forEach((row) => {
  map[row.test_id] = row.id;
});

setAttemptedMap(map);
    }

    loadAttempts();
  }, []);

  
const hasFullCATAccess =
  plan === "yearly" ||
  plan === "half_yearly";


   return (
  <div
  style={{
    width: "100%",
    maxWidth: "100%",
    padding: "20px 40px",
  }}
>
    <div style={{ marginBottom: 36 }}>

  <h1
    style={{
      fontSize: 36,
      fontWeight: 800,
      color: "#ffffff",
      marginBottom: 8,
    }}
  >
    🔥 CAT Arena
  </h1>

  <p
    style={{
      color: "#94a3b8",
      fontSize: 16,
      marginBottom: 24,
    }}
  >
    Train Like The Real CAT.
    Official CAT Papers, Auctor Mock Tests and AI Diagnosis.
  </p>

  <div
    style={{
      display: "grid",
     gridTemplateColumns: isMobile
  ? "repeat(2,1fr)"
  : "repeat(4,1fr)",
      gap: 16,
      marginBottom: 28,
    }}
  >

    <div style={statCard}>
      <div style={statNumber}>{sectionals.length}</div>
      <div style={statLabel}>Tests</div>
    </div>

    <div style={statCard}>
      <div style={statNumber}>
        {Object.keys(attemptedMap).length}
      </div>
      <div style={statLabel}>Attempted</div>
    </div>

    <div style={statCard}>
      <div style={statNumber}>40</div>
      <div style={statLabel}>Minutes</div>
    </div>

    <div style={statCard}>
      <div style={statNumber}>24</div>
      <div style={statLabel}>Questions</div>
    </div>

  </div>

  <div
    style={{
     display: isMobile ? "grid" : "flex",
gridTemplateColumns: isMobile ? "1fr" : undefined,
gap: 12,
marginBottom: 30,
    }}
  >

    <button
      onClick={() => setActiveTab("pyq")}
      style={tab(activeTab === "pyq")}
    >
      📘 Official CAT PYQs
    </button>

    <button
      onClick={() => setActiveTab("mock")}
      style={tab(activeTab === "mock")}
    >
      🧪 Auctor Mocks
    </button>

    <button
      onClick={() => setActiveTab("analytics")}
      style={tab(activeTab === "analytics")}
    >
      📊 Analytics
    </button>

  </div>

</div>


     {activeTab !== "analytics" && (
      <div
    style={{
      display: "grid",
     gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(2,minmax(0,1fr))",
      gap: 20,
      alignItems: "start",
    }}
  >
{sectionals
  .filter((s) =>
    activeTab === "pyq"
      ? s.test_type === "pyq"
    
      : s.test_type === "mock"
  )
  .map((s) => {
      const attemptId = attemptedMap[s.id];
const attempted = !!attemptId;
const locked =
  !s.is_free &&
  !hasFullCATAccess;

        return (
          <div key={s.id} style={card(attempted)}>
           <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  }}
>
  <h3
    style={{
      fontSize: 20,
      fontWeight: 700,
      color: "#fff",
      margin: 0,
    }}
  >
    {s.test_type === "pyq"
      ? `📘 ${s.exam} ${s.exam_year} • Slot ${s.exam_slot}`
      : `🧪 Auctor Mock ${s.test_number}`}
  </h3>

 <div
  style={{
    background: attempted
      ? "#14532d"
      : locked
      ? "#7c2d12"
      : "#1e3a8a",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  }}
>
  {attempted
    ? "ATTEMPTED ✓"
    : locked
    ? "🔒 PREMIUM"
    : "🟢 AVAILABLE"}
</div>
</div>

<p
  style={{
    color: "#94a3b8",
    marginBottom: 14,
  }}
>
  {s.test_type === "pyq"
    ? "Official CAT VARC Paper"
    : "Official Auctor VARC Mock"}
</p>

<div
  style={{
    display: "flex",
    gap: 20,
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 18,
  }}
>
  <span>⏱️ 40 min</span>
  <span>❓24 Questions</span>
</div>

<hr
  style={{
    border: "none",
    borderTop: "1px solid #334155",
    marginBottom: 18,
  }}
/>
          {attempted ? (

  <button
    style={{
      ...primaryBtn,


      background:"#16a34a"
    }}
    onClick={() =>
      router.push(`/arena/result/${attemptId}`)
    }
  >
    Review Analysis
  </button>

) : (

  <button
  style={{
    ...primaryBtn,
    width: 180,
    background: locked ? "#475569" : "#2563eb",
  }}
 onClick={() => {

  if (isMobile) {
    alert(
      "CAT VARC tests are currently available only on desktop."
    );
    return;
  }

  if (locked) {
    router.push("/pricing");
    return;
  }

  onStartRC(s.id);
}}
>
  {locked ? "Unlock Premium" : "Start Test"}
</button>

)}
          </div>
        );
     })}

     </div>
   )}

      {activeTab === "analytics" && (
        <CATAnalytics />
      )}
        

    </div>
  );
}
 
const card = (attempted) => ({
  borderRadius: 18,
  padding: 20,
  minHeight: 210,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",

  background: "#162235",

  border: attempted
    ? "1px solid #22c55e"
    : "1px solid #334155",

  boxShadow: "0 10px 30px rgba(0,0,0,.35)",
});
const primaryBtn = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 22px",
  fontWeight: 700,
  cursor: "pointer",
};

const analyseBtn = {
  width: "100%",
  padding: 12,
  background: "transparent",
  border: "1px solid #3b82f6",
  color: "#3b82f6",
  borderRadius: 12,
  fontWeight: 600,
};

const statCard = {
  background:"#1e293b",
  border:"1px solid #334155",
  borderRadius:16,
  padding:20,
  textAlign:"center",
};

const statNumber = {
  fontSize:28,
  fontWeight:700,
  color:"#3b82f6",
};

const statLabel = {
  color:"#94a3b8",
  marginTop:6,
};

const tab = (active)=>({
  padding:"12px 22px",
  borderRadius:12,
  border:"none",
  cursor:"pointer",
  fontWeight:700,
  background:active ? "#2563eb" : "#1e293b",
  color:"#fff",
});

const analyticsCard = {
  background:"#1e293b",
  border:"1px solid #334155",
  borderRadius:18,
  padding:30,
};