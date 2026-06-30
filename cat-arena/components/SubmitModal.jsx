"use client";

import { useState } from "react";

export default function SubmitModal({ open, onCancel, onConfirm }) {
  const [loading, setLoading] = useState(false);
  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: 12 }}>Submit Test?</h3>

      <p style={{ marginBottom: 18, color: "#cbd5e1", lineHeight: 1.6 }}>
          Are you sure you want to submit the test?
          <br />
          You will not be able to change your answers after submission.
        </p>

     {loading && (
  <div
    style={{
      marginBottom: 20,
      padding: 18,
      borderRadius: 10,
      background: "#0f172a",
      border: "1px solid #1e3a5f",
      color: "#e2e8f0",
      lineHeight: 1.7,
      fontSize: 14,
    }}
  >
    <div
      style={{
        fontWeight: 700,
        color: "#67e8f9",
        marginBottom: 10,
      }}
    >
      🧠 Birbal is preparing your Intelligence Report
    </div>

    <div style={{ marginBottom: 12 }}>
      ✅ Your test has been submitted successfully.
    </div>

    <div style={{ marginBottom: 10 }}>
      We're now generating:
    </div>

    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li>Reading IQ & Performance Score</li>
      <li>Cognitive Diagnosis</li>
      <li>Question-wise AI Review</li>
      <li>Reading DNA Profile</li>
      <li>Personalized Improvement Plan</li>
    </ul>

    <div style={{ marginTop: 14, color: "#94a3b8" }}>
      This usually takes <strong>30–60 seconds</strong>. Please keep this
      window open while Birbal prepares your report.
    </div>
  </div>
)}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
         <button
  onClick={() => !loading && onCancel()}
  style={{
    ...cancelBtn,
    opacity: loading ? 0.6 : 1,
  }}
  disabled={loading}
>
            Cancel
          </button>

          <button
  onClick={async () => {
    if (loading) return;
    setLoading(true);
    await onConfirm?.();
  }}
  style={{
    ...submitBtn,
    opacity: loading ? 0.7 : 1,
    cursor: loading ? "not-allowed" : "pointer",
  }}
  disabled={loading}
>
           {loading ? "Generating Report..." : "Submit Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== styles ===== */

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 20000,              // 🔥 VERY IMPORTANT
  pointerEvents: "auto",      // 🔥 ENSURES CLICK WORKS
};

const modalStyle = {
  background: "#111827",
  padding: 24,
  borderRadius: 12,
  width: 380,
  border: "1px solid #334155",
  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  color: "#e5e7eb",
};

const cancelBtn = {
  padding: "8px 16px",
  border: "1px solid #334155",
  background: "#1f2937",
  color: "#e5e7eb",
  borderRadius: 6,
  cursor: "pointer",
};

const submitBtn = {
  padding: "8px 18px",
  border: "none",
  background: "#ef4444",
  color: "#fff",
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
};
