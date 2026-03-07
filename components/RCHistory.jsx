import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function RCHistory() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
const sessionsPerPage = 5;

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

  const totalPages = Math.ceil(sessions.length / sessionsPerPage);

const startIndex = (currentPage - 1) * sessionsPerPage;
const paginatedSessions = sessions.slice(
  startIndex,
  startIndex + sessionsPerPage
);

  return (
  <div className="mt-6 space-y-8">
      <h2>RC History</h2>

      {!selectedSession && (
        <>
       {paginatedSessions.map((session) => (
          <div
  key={session.id}
 className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 transition-all hover:border-slate-700"
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
  className={`px-3 py-1 rounded-full text-xs font-semibold ${
    session.total_questions &&
    (session.correct_answers / session.total_questions) * 100 >= 60
      ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
      : "bg-red-900/40 text-red-300 border border-red-700"
  }`}
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
  <div className="text-slate-300 text-sm">
  <span className="font-semibold text-white">
    {session.correct_answers} / {session.total_questions}
  </span>
  <span className="text-slate-500 ml-2">Score</span>
</div>

    <div className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-slate-400">
  {session.difficulty}
</div>
  </div>

  {/* Button */}
 <button
  onClick={() => loadSessionDetails(session)}
 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-sm text-white transition-all"
>
    View Detailed Review
  </button>
</div>
          ))}

         {totalPages > 1 && (
  <div className="mt-12 mb-16 flex justify-center">
    <div className="flex items-center gap-8 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl shadow-sm text-slate-400 text-sm">
      
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className={`transition ${
          currentPage === 1
            ? "opacity-40 cursor-not-allowed"
            : "hover:text-white"
        }`}
      >
        Prev
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() =>
          setCurrentPage(p => Math.min(totalPages, p + 1))
        }
        disabled={currentPage === totalPages}
        className={`transition ${
          currentPage === totalPages
            ? "opacity-40 cursor-not-allowed"
            : "hover:text-white"
        }`}
      >
        Next
      </button>

    </div>
  </div>
)}
        </>
      )}

      {selectedSession && (
        <>
         <div className="mb-6">
  <button
    onClick={() => {
      setSelectedSession(null);
      setQuestions([]);
      setCurrentPage(1);
    }}
    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-sm font-medium transition-all"
  >
    ← Back
  </button>
</div>
          <h3>Detailed Review</h3>

          {/* PASSAGE */}
          <div
           className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8"
          >
            <h4>Passage</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {selectedSession.passage_text}
            </p>
          </div>

          {questions.map((q, i) => (
            <div
              key={i}
             className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8"
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
     className={`px-4 py-3 rounded-xl mb-2 border transition-all ${
  isCorrect
    ? "bg-emerald-900/40 border-emerald-600 text-emerald-200"
    : isUser
    ? "bg-red-900/40 border-red-600 text-red-200"
    : "bg-slate-800 border-slate-700 text-slate-200"
}`}
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