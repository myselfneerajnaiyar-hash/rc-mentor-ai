"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar({ view, setView }) {
  const [profile, setProfile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      setProfile(data.user);
    }
    loadProfile();
  }, []);

  // 🔥 MOBILE VIEW
  if (isMobile) {
    if (!profile) {
      return (
        <div style={mobileBar}>
          <button
            style={loginBtn}
            onClick={() => (window.location.href = "/login")}
          >
            Login
          </button>
        </div>
      );
    }

    return null; // Logged in mobile → no top navbar
  }

  // 💻 DESKTOP VIEW
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

      {!profile ? (
        <button
          style={loginBtn}
          onClick={() => (window.location.href = "/login")}
        >
          Login
        </button>
      ) : (
        <div style={avatar}>
          {profile.email?.charAt(0).toUpperCase()}
        </div>
      )}
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
};

const loginBtn = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};

const mobileBar = {
  display: "flex",
  justifyContent: "flex-end",
  padding: 10,
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
};