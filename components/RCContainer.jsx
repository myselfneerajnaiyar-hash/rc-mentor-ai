"use client";
import RCView from "./RCView";

export default function RCContainer({ view, setView }) {
  return (
    <div style={{ padding: 20 }}>
      <RCView view={view} setView={setView} />
    </div>
  );
}