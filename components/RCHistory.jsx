import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function RCHistory() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("rc_sessions")
    
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSessions(data);
    }

    setLoading(false);
  }

  async function loadSessionDetails(session) {
    setSelectedSession(session);

    const { data, error } = await supabase
      .from("rc_session_questions")
      .select("*")
      .eq("session_id", session.id);

    if (!error && data) {
      setQuestions(data);
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading history...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>RC History</h2>

      {!selectedSession && (
        <>
          {sessions.map((session) => (
           <div
  key={session.id}
  style={{
    marginBottom: 25,
    padding: 20,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "white",
    boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
    transition: "all 0.2s ease"
  }}
>
  {/* Top Row */}
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  }}>
    <div>
      <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
        {new Date(session.created_at).toLocaleString()}
      </p>
    </div>

    <div
      style={{
        padding: "6px 12px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        background:
          session.total_questions &&
          (session.correct_answers / session.total_questions) * 100 >= 60
            ? "#dcfce7"
            : "#fee2e2",
        color:
          session.total_questions &&
          (session.correct_answers / session.total_questions) * 100 >= 60
            ? "#166534"
            : "#991b1b"
      }}
    >
      {session.total_questions
        ? Math.round(
            (session.correct_answers / session.total_questions) * 100
          )
        : 0}
      % Accuracy
    </div>
  </div>

  {/* Score + Difficulty */}
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15
  }}>
    <div style={{ fontSize: 16 }}>
      <b>Score:</b> {session.correct_answers} / {session.total_questions}
    </div>

    <div style={{
      padding: "4px 10px",
      background: "#f3f4f6",
      borderRadius: 8,
      fontSize: 13,
      color: "#374151"
    }}>
      {session.difficulty}
    </div>
  </div>

  {/* Button */}
  <button
    onClick={() => loadSessionDetails(session)}
    style={{
      width: "100%",
      backgroundColor: "#2563eb",
      color: "white",
      padding: "10px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
      transition: "all 0.2s ease"
    }}
    onMouseOver={(e) =>
      (e.target.style.backgroundColor = "#1d4ed8")
    }
    onMouseOut={(e) =>
      (e.target.style.backgroundColor = "#2563eb")
    }
  >
    View Detailed Review
  </button>
</div>
          ))}
        </>
      )}

      {selectedSession && (
        <>
          <button
            onClick={() => {
              setSelectedSession(null);
              setQuestions([]);
            }}
            style={{
              marginBottom: 20,
              backgroundColor: "#e5e7eb",
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer"
            }}
          >
            ← Back
          </button>

          <h3>Detailed Review</h3>

          {/* PASSAGE */}
          <div
            style={{
              marginBottom: 25,
              padding: 15,
              background: "#f3f4f6",
              borderRadius: 8
            }}
          >
            <h4>Passage</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {selectedSession.passage_text}
            </p>
          </div>

          {questions.map((q, i) => (
            <div
              key={i}
              style={{
                marginBottom: 30,
                padding: 15,
                border: "1px solid #ddd",
                borderRadius: 8
              }}
            >
             <p><b>Question:</b> {q.question_text}</p>
             <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
  {q.question_type && (
    <span style={{ marginRight: 15 }}>
      Type: <b>{q.question_type}</b>
    </span>
  )}

  {q.time_taken_sec && (
    <span>
      Time: <b>{q.time_taken_sec}s</b>
    </span>
  )}
</div>
{q.options && q.options.map((opt, idx) => {
  const letter = String.fromCharCode(65 + idx);

  const isUser =
    q.user_answer === opt ||
    q.user_answer === letter ||
    q.user_answer === idx ||
    q.user_answer === String(idx);

  const isCorrect =
    q.correct_answer === opt ||
    q.correct_answer === letter ||
    q.correct_answer === idx ||
    q.correct_answer === String(idx);

  return (
    <div
      key={idx}
      style={{
        padding: "8px 12px",
        marginTop: 8,
        borderRadius: 8,
        backgroundColor: isCorrect
          ? "#22c55e22"
          : isUser
          ? "#ef444422"
          : "#f3f4f6",
        border: isCorrect
          ? "2px solid #16a34a"
          : isUser
          ? "2px solid #dc2626"
          : "1px solid #e5e7eb",
        fontWeight: isCorrect || isUser ? "600" : "400",
        transition: "all 0.2s ease"
      }}
    >
      <b>{letter}.</b> {opt}
    </div>
  );
})}

<p style={{ marginTop: 10 }}>
  <b>Your Answer:</b> {q.user_answer}
</p>

<p>
  <b>Correct Answer:</b> {q.correct_answer}
</p>
              <p><b>Explanation:</b> {q.explanation}</p>

              {q.temptation && (
                <>
                  <p><b>Why your option felt right:</b></p>
                  <p style={{ color: "#7c2d12" }}>{q.temptation}</p>
                </>
              )}

              {q.why_wrong &&
                typeof q.why_wrong === "object" && (
                  <div style={{ marginTop: 10 }}>
                    <b>Why other options are wrong:</b>
                    {Object.entries(q.why_wrong).map(
                      ([key, value]) => (
                        <div key={key} style={{ marginTop: 5 }}>
                          <b>Option {String.fromCharCode(65 + Number(key))}:</b>{" "}
                          {value}
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}