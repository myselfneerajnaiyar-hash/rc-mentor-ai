import { useEffect, useState } from "react";

export default function VocabProfile() {
  const [vocabStats, setVocabStats] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem("vocabStats");
    if (stored) {
      setVocabStats(JSON.parse(stored));
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Vocab Profile</h2>
    </div>
  );
}
