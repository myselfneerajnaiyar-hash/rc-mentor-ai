[09:14, 10/2/2026] Neraj Naiyar: import "./globals.css";
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
      </body>
    </html>
  );
}
[09:16, 10/2/2026] Neraj Naiyar: "use client";

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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (!showButton) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 9999,
      }}
    >
      <button
        onClick={handleInstall}
        style={{
          padding: "10px 14px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        📲 Install App
      </button>
    </div>
  );
}
