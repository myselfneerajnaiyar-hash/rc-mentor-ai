"use client";

import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    // Detect if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: if Chrome never fires the event
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        setManual(true);
        setVisible(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={wrap}>
      {!manual ? (
        <button style={btn} onClick={installApp}>
          Install AuctorRC App
        </button>
      ) : (
        <div style={manualBox}>
          <b>Install AuctorRC</b>
          <p style={{ margin: "8px 0" }}>
            Tap <b>⋮</b> in Chrome<br />
            then tap <b>Install app</b>
          </p>
          <button style={btn} onClick={() => setVisible(false)}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== styles ===== */

const wrap = {
  position: "fixed",
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 9999,
};

const btn = {
  padding: "14px 22px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  fontWeight: 700,
  fontSize: 15,
};

const manualBox = {
  background: "#ffffff",
  padding: 16,
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  textAlign: "center",
  maxWidth: 260,
};
