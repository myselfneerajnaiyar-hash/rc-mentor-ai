"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CATArenaLanding({
  onStartRC,
  onViewDiagnosis,
}) {
  const [attemptedMap, setAttemptedMap] = useState({});

  const sectionals = Array.from({ length: 10 }).map((_, i) => ({
    id: `sectional-${String(i + 1).padStart(2, "0")}`,
    title: `CAT RC Sectional ${String(i + 1).padStart(2, "0")}`,
  }));

  useEffect(() => {
    async function loadAttempts() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data } = await supabase
        .from("sectional_tests")
        .select("sectional_id")
        .eq("user_id", authData.user.id);

      const map = {};
      (data || []).forEach((row) => {
        map[row.sectional_id] = true;
      });

      setAttemptedMap(map);
    }

    loadAttempts();
  }, []);

  
   return (
  <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ 
        fontSize: 32, 
        fontWeight: 800, 
        display: "flex", 
        alignItems: "center", 
        gap: 12 
      }}>
        <span style={{ color: "#f97316" }}>🔥</span>
        CAT Arena
      </h1>
      <p style={{ color: "#94a3b8", marginTop: 8 }}>
        Sectional RC Tests. Real CAT Pattern. Real Pressure.
      </p>
    </div>


      {sectionals.map((s) => {
        const attempted = attemptedMap[s.id];

        return (
          <div key={s.id} style={card(attempted)}>
            <h3 style={{ 
  marginBottom: 16, 
  fontSize: 18, 
  fontWeight: 700, 
  color: "#e2e8f0" 
}}>
  {s.title}
</h3>

            <button
              onClick={() => {
                if (!attempted) onStartRC(s.id);
              }}
              style={{
                ...primaryBtn,
                background: attempted ? "#94a3b8" : "#2563eb",
                pointerEvents: attempted ? "none" : "auto",
              }}
            >
              {attempted ? "✓ Completed" : "Take Test"}
            </button>

            {attempted && (
              <button
                style={analyseBtn}
                onClick={() => {
                  console.log("OPEN DIAGNOSIS", s.id);
                  onViewDiagnosis(s.id);
                }}
              >
                Analyse Test
              </button>
            )}
          </div>
        );
      })}
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