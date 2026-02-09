[02:44, 10/2/2026] Neraj Naiyar: import "./globals.css";
import InstallAppButton from "./components/InstallAppButton";

export const metadata = {
  title: "AuctorRC",
  description: "CAT Reading Comprehension Mentor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        {children}
        <InstallAppButton />

        {/* REQUIRED for PWA install eligibility */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js'…
[03:03, 10/2/2026] Neraj Naiyar: "use client";

import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert(
        "To install:\n\nChrome menu (⋮) → Add to Home screen → Install"
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowButton(false);
    }
  };

  if (!showButton) return null;

  return (
    <div style={styles.wrapper}>
      <button onClick={handleInstall} style={styles.button}>
        📲 Install AuctorRC App
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "sticky",
    top: 0,
    zIndex: 9999,
    background: "#2563eb",
    padding: "10px",
    textAlign: "center",
  },
  button: {
    background: "white",
    color: "#2563eb",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
