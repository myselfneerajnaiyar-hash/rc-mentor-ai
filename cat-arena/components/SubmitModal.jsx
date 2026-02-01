"use client";

export default function SubmitModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: 12 }}>Submit Test?</h3>

        <p style={{ marginBottom: 16, color: "#374151" }}>
          Are you sure you want to submit the test?
          <br />
          You will not be able to change your answers after submission.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={cancelBtn}>
            Cancel
          </button>

          <button onClick={onConfirm} style={submitBtn}>
            Submit
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
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 20000,              // 🔥 VERY IMPORTANT
  pointerEvents: "auto",      // 🔥 ENSURES CLICK WORKS
};

const modalStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 6,
  width: 360,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const cancelBtn = {
  padding: "6px 14px",
  border: "1px solid #9ca3af",
  background: "#fff",
  cursor: "pointer",
};

const submitBtn = {
  padding: "6px 14px",
  border: "1px solid #dc2626",
  background: "#dc2626",
  color: "#fff",
  cursor: "pointer",
};
