"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    async function loadProfile() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (data) setProfile(data);
    }

    loadProfile();
  }, []);

  const isActive = (path) => pathname === path;

  return (
    <div style={navWrap}>
      {/* LEFT SIDE */}
      <div style={leftSection}>
        <h3 style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
          AuctorRC
        </h3>

        <div style={tabs}>
          <button onClick={() => router.push("/")} style={tabStyle(isActive("/"))}>
            Home
          </button>
          <button onClick={() => router.push("/rc")} style={tabStyle(isActive("/rc"))}>
            RC
          </button>
          <button onClick={() => router.push("/vocab")} style={tabStyle(isActive("/vocab"))}>
            Vocab
          </button>
          <button onClick={() => router.push("/speed")} style={tabStyle(isActive("/speed"))}>
            Speed
          </button>
          <button onClick={() => router.push("/cat")} style={tabStyle(isActive("/cat"))}>
            CAT
          </button>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ position: "relative" }}>
        {profile ? (
          <>
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
                  style={profileBtn}
                  onClick={() => {
                    router.push("/profile");
                    setOpen(false);
                  }}
                >
                  View Profile
                </button>

                <button
                  style={logoutBtn}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push("/login");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            style={loginBtn}
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

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

const profileBtn = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#f1f5f9",
  cursor: "pointer",
  fontWeight: 500,
  marginBottom: 8,
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

const loginBtn = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};