"use client";
import { useState, useEffect } from "react";
import MentorView from "./MentorView";

export default function RCView({ setView }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "system-ui",
        background: "linear-gradient(180deg, #eef2ff, #f8fafc)",
        color: "#1f2937",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0 }}>RC Mentor</h2>

          <div style={{ display: "flex", gap: 8 }}>
            {["home", "rc", "vocab", "speed", "cat"].map(v => (
              <button
                key={v}
                onClick={() => {
                  if (v === "home") setView("home");
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                }}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <MentorView />
      </div>
    </div>
  );
}
