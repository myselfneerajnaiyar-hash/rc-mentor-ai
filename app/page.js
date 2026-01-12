"use client";

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        fontFamily: "sans-serif",
        border: "5px solid red",
        padding: 30,
      }}
    >
      <h1 style={{ color: "red" }}>RC Mentor — TEST BUILD</h1>

      <p style={{ color: "blue", fontSize: 18 }}>
        If you can see this red border and blue text, your deployment is updating.
      </p>

      <textarea
        rows={8}
        style={{
          width: "100%",
          padding: 12,
          border: "3px solid red",
        }}
        placeholder="Paste your RC passage here..."
      />

      <br /><br />

      <button
        style={{
          background: "crimson",
          color: "white",
          padding: "12px 24px",
          fontSize: 18,
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        LET’S DISSECT (TEST MODE)
      </button>
    </main>
  );
}
