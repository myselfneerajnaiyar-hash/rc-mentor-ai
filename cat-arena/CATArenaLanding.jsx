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
      <h1 style={{ marginBottom: 24 }}>🔥 CAT Arena</h1>

      {sectionals.map((s) => {
        const attempted = attemptedMap[s.id];

        return (
          <div key={s.id} style={card(attempted)}>
            <h3>{s.title}</h3>

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
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
  background: attempted ? "#e0f2fe" : "#f8fafc",
  border: "1px solid #e5e7eb",
});

const primaryBtn = {
  width: "100%",
  padding: 10,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  marginBottom: 10,
  fontWeight: 700,
};

const analyseBtn = {
  width: "100%",
  padding: 10,
  background: "#fff",
  border: "1px solid #3b82f6",
  borderRadius: 10,
  fontWeight: 600,
};