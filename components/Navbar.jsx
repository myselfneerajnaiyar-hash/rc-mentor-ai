"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar({ view, setView }) {
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

     const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("user_id", authData.user.id)
  .maybeSingle();

if (!error && data) {
  setProfile(data);
}
}
    loadProfile();
  }, []);

  return (
    <div style={navWrap}>
      <div style={leftSection}>
        <h3 style={{ cursor: "pointer" }} onClick={() => setView("home")}>
          AuctorRC
        </h3>

        <div style={tabs}>
          <button onClick={() => setView("home")} style={tabStyle(view==="home")}>Home</button>
          <button onClick={() => setView("rc")} style={tabStyle(view==="rc")}>RC</button>
          <button onClick={() => setView("vocab")} style={tabStyle(view==="vocab")}>Vocab</button>
          <button onClick={() => setView("speed")} style={tabStyle(view==="speed")}>Speed</button>
          <button onClick={() => setView("cat")} style={tabStyle(view==="cat")}>CAT</button>
        </div>
      </div>

     {/* Profile Section */}
<div style={{ position: "relative" }}>
  <div
    onClick={() => setOpen(!open)}
    style={avatar}
  >
    {profile?.name?.charAt(0)?.toUpperCase() || "U"}
  </div>

  {open && (
    <div style={dropdown}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>
          {profile?.name || "User"}
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {profile?.exam} • {profile?.attempt_year}
        </div>
      </div>

      <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />

     <button
  style={{
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
    fontWeight: 500,
    marginBottom: 8
  }}
  onClick={() => {
  setView("profile");
  setOpen(false);
}}
>
  View Profile
</button>

      <button
        style={logoutBtn}
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
      >
        Logout
      </button>
    </div>
  )}
</div>
    </div>
  );
}

/* Styles */

const navWrap = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 20px",
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
  position: "sticky",
  top: 0,
  zIndex: 50,
};

const leftSection = {
  display: "flex",
  alignItems: "center",
  gap: 30,
};

const tabs = {
  display: "flex",
  gap: 15,
};

const tabStyle = (active) => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: active ? "#2563eb" : "#e5e7eb",
  color: active ? "#fff" : "#111",
  cursor: "pointer",
  fontWeight: 600,
});

const avatar = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#2563eb",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  cursor: "pointer",
};

const dropdown = {
  position: "absolute",
  right: 0,
  top: 45,
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  width: 200,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  zIndex: 100,
};

const logoutBtn = {
  width: "100%",
  padding: 8,
  borderRadius: 8,
  border: "none",
  background: "#ef4444",
  color: "#fff",
  cursor: "pointer",
};