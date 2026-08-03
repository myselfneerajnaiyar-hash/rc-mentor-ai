"use client";

import { useState } from "react";

export default function Page() {
  const [reply, setReply] = useState("");

  async function askBirbal() {
    const res = await fetch("/api/birbal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "2b4b635d-3f74-4764-ba59-d14e4ee1001f",
        messages: [
          {
            role: "user",
            content: "How should I improve my RC?"
          }
        ]
      }),
    });

    const data = await res.json();

    console.log(data);

    setReply(data.reply || JSON.stringify(data));
  }

  return (
    <div style={{ padding: 30 }}>
      <button onClick={askBirbal}>
        Ask Birbal
      </button>

      <pre>{reply}</pre>
    </div>
  );
}