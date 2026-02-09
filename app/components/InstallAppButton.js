"use client";
import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <button
      onClick={installApp}
      style={{
        position: "fixed",
        bottom: "80px",
        right: "16px",
        zIndex: 9999,
        padding: "12px 16px",
        background: "#2563eb",
        color: "#fff",
        borderRadius: "12px",
        border: "none",
        fontWeight: "600",
      }}
    >
      Install App
    </button>
  );
}
