"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import CATAnalytics from "../app/components/CATAnalytics";



export default function CATArenaLanding({
  onStartRC,
  onViewDiagnosis,
}) {
  const [attemptedMap, setAttemptedMap] = useState({});
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pyq");

  const [sectionals, setSectionals] = useState([]);
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

  
   return (
  <div
  style={{
    width: "100%",
    maxWidth: "100%",
    padding: "24px 40px",
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
      gridTemplateColumns: "repeat(4,1fr)",
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
      display: "flex",
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


     {activeTab !== "analytics" &&
sectionals
  .filter((s) =>
    activeTab === "pyq"
      ? s.test_type === "pyq"
      : s.test_type === "mock"
  )
  .map((s) => {
      const attemptId = attemptedMap[s.id];
const attempted = !!attemptId;

        return (
          <div key={s.id} style={card(attempted)}>
           <h3
  style={{
    marginBottom: 8,
    fontSize: 20,
    fontWeight: 700,
    color: "#ffffff",
  }}
>
  {s.test_type === "pyq"
    ? `${s.exam} ${s.exam_year} • Slot ${s.exam_slot}`
    : `Auctor Mock ${s.test_number}`}
</h3>

<p
  style={{
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 18,
  }}
>
  {s.test_type === "pyq"
    ? "Official CAT Paper"
    : "Full-Length Mock Test"}
</p>

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
    Review Test
  </button>

) : (

  <button
    style={primaryBtn}
    onClick={() => onStartRC(s.id)}
  >
    Take Test
  </button>

)}
          </div>
        );
     })}

      {activeTab === "analytics" && (
        <CATAnalytics />
      )}
        

    </div>
  );
}
 
const card = (attempted) => ({
  borderRadius: 20,
  padding: 24,
  marginBottom: 24,
  background: "#1e293b",
  border: attempted
    ? "1px solid #22c55e"
    : "1px solid #334155",
  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
});

const primaryBtn = {
  width: "100%",
  padding: 12,
  color: "#fff",
  border: "none",
  borderRadius: 12,
  marginBottom: 12,
  fontWeight: 700,
  fontSize: 14,
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