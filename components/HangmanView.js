"use client";

import { useState, useEffect  } from "react";
import { supabase } from "../lib/supabase";
import { useRef } from "react";

export default function HangmanView() {
 
const [puzzle, setPuzzle] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessed, setGuessed] = useState([]);
  const [lives, setLives] = useState(10);
 const [timeElapsed, setTimeElapsed] = useState(0);
 



 
  const [lastGuess, setLastGuess] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [attemptMessage, setAttemptMessage] = useState(null);
  const [streak, setStreak] = useState(null);

  const scoreRef = useRef(null);
  

useEffect(() => {
  async function loadPuzzle() {
    const today = new Date().toISOString().split("T")[0];

    // ✅ GET USER
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) return;

    const res = await fetch("/api/hangman-streak", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: userId }),
});

const streakData = await res.json();
setStreak(streakData.streak);

    // ✅ CHECK IF USER ALREADY PLAYED
    const { data: existing } = await supabase
      .from("hangman_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("attempt_date", today)
      .maybeSingle();

    // 🔥 IF ALREADY ATTEMPTED → STOP GAME
    if (existing) {
      setAttemptMessage({
        score: existing.score,
        time: existing.time_taken
      });
      return;
    }

    // ✅ LOAD TODAY PUZZLE
    const { data, error } = await supabase
      .from("daily_hangman")
      .select("*")
      .eq("date", today)
      .single();

    if (error || !data) {
      console.error("No puzzle found for today");
      return;
    }

    setPuzzle(data);
  }

  loadPuzzle();
}, []);

  useEffect(() => {
  if (!puzzle || finalScore !== null) return; // ✅ STOP when game ends

  const timer = setInterval(() => {
    setTimeElapsed(t => t + 1);
  }, 1000);

  return () => clearInterval(timer);
}, [puzzle, finalScore]);

useEffect(() => {
  if (puzzle) {
    setLives(puzzle.max_lives);
  }
}, [puzzle]);

useEffect(() => {
  if (finalScore !== null && scoreRef.current) {
    scoreRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [finalScore]);

if (attemptMessage) {
  return (
    <div className="max-w-4xl mx-auto p-6">

        {streak !== null && (
  <div className="mb-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-orange-400 font-semibold text-center">
    🔥 {streak} {streak === 1 ? "day" : "days"} streak
  </div>
)}

      <div className="bg-indigo-900/30 border border-indigo-500 rounded-xl p-6 text-center">

        <div className="text-indigo-400 font-semibold text-lg">
          🔥 You've already completed today's challenge!
        </div>

        <div className="mt-3 text-white font-bold text-xl">
          🎯 Score: {attemptMessage.score}
        </div>

        <div className="text-slate-400 text-sm">
          ⏱ Time: {Math.floor(attemptMessage.time / 60)}:
          {String(attemptMessage.time % 60).padStart(2, "0")}
        </div>

        <div className="mt-3 text-yellow-400 text-sm">
          Come back tomorrow to beat your score 🚀
        </div>

      </div>

    </div>
  );
}

if (!puzzle) return <div className="p-6 text-white">Loading puzzle...</div>;

 const current = puzzle.words[currentIndex];
const word = current.answer.toUpperCase();
  const wrongGuesses = guessed.filter(l => !word.includes(l));

  const display = word.split("").map(l => guessed.includes(l) ? l : "");

  const isSolved = display.every(l => l !== "");


 function handleGuess(letter) {
    letter = letter.toUpperCase();
  if (guessed.includes(letter) || isSolved || lives <= 0) return;

  setLastGuess(letter);

  const newGuessed = [...guessed, letter];
  setGuessed(newGuessed);

  if (!word.includes(letter)) {
    setLives(prev => prev - 1);
  }

  // ✅ CHECK SOLVE HERE
  const newDisplay = word.split("").map(l => newGuessed.includes(l) ? l : "");

  if (newDisplay.every(l => l !== "")) {
    setShowSuccess(true);
  }
}

  function nextWord() {
  setCurrentIndex(i => i + 1);
  setGuessed([]);
  setShowSuccess(false); // ✅ IMPORTANT
  setLastGuess(null);    // optional cleanup
}

function calculateScore() {
  const base = 100;

  const mistakePenalty = (puzzle.max_lives - lives) * 10;
  const timePenalty = Math.floor(timeElapsed / 5);

  const multiplier =
    puzzle.level === "easy" ? 1 :
    puzzle.level === "medium" ? 1.5 :
    2;

  const finalScore = (base - mistakePenalty - timePenalty) * multiplier;

  return Math.max(10, Math.floor(finalScore));
}

const handleSubmit = async () => {
  console.log("Submitting...");

const { data: sessionData } = await supabase.auth.getSession()
console.log("USER ID:", sessionData.session?.user?.id);

const payload = {
  user_id: sessionData.session?.user?.id,   // ✅ REAL USER ID
  puzzle_id: puzzle.id,
  mistakes: puzzle.max_lives - lives,
  time_taken: timeElapsed,
  score: calculateScore(),
  attempt_date: new Date().toISOString().split("T")[0]
}

  console.log(payload);

  const res = await fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

 const data = await res.json();
 if (data.success) {
  const res = await fetch("/api/streak", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: payload.user_id }),
  });

  const streakData = await res.json();
  setStreak(streakData.streak);
}



  
  console.log("Response:", data);
  const score = calculateScore();
setFinalScore(score);
};

 return (
  <div className="max-w-4xl mx-auto p-6">

   

    {streak !== null && (
  <div className="mb-4">

    {/* 🔥 STREAK BADGE */}
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 text-orange-400 text-sm font-semibold inline-block">
      🔥 {streak} {streak === 1 ? "day" : "days"} streak
    </div>

    {/* 💡 MOTIVATION */}
    <div className="text-xs text-slate-400 mt-1">
      {streak < 3 && "Keep going! Build your streak 🔥"}
      {streak >= 3 && streak < 7 && "You're on fire 🚀"}
      {streak >= 7 && "Elite consistency 💎"}
    </div>

  </div>
)}

<div className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/80 p-6 rounded-2xl overflow-visible">
  {/* 🔥 Accent line */}
  <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-l-2xl" />

  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold text-yellow">
      📖 Reading Context
    </h2>

   

    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-md">
  {puzzle.level?.toUpperCase()} LEVEL
</span>
  </div>

  <p className="text-xs text-slate-500 mb-3">
  The answer appears somewhere in the passage
</p>

  {/* 👇 STEP 2 CODE HERE */}

 <div className="text-slate-300 leading-relaxed text-[15px] tracking-wide space-y-4 break-words whitespace-pre-wrap">
  {puzzle.passage
    .split(". ")
    .reduce((acc, sentence, i) => {
      if (i % 2 === 0) {
        acc.push(sentence + ". ");
      } else {
        acc[acc.length - 1] += sentence + ".";
      }
      return acc;
    }, [])
    .map((para, i) => (
      <p key={i} className="text-slate-400 hover:text-white transition duration-200">
        {para}
      </p>
    ))}
</div>

</div>

      {/* 🔥 Game Card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">

       <div className="flex justify-between items-center mb-4">
  
  {/* LEFT SIDE */}
  <h3 className="text-lg font-semibold text-indigo-400">
    Word {currentIndex + 1} / {puzzle.words.length}
  </h3>

  {/* RIGHT SIDE */}
  <div className="flex gap-4 items-center">
    
    {/* ⏱ TIMER */}
    <div className="text-yellow-400 font-semibold">
     ⏱ {Math.floor(timeElapsed / 60)}:{String(timeElapsed % 60).padStart(2, "0")}
    </div>

    {/* ❤️ LIVES */}
   <div className="text-red-400 font-semibold animate-pulse">
  ❤️ {lives}
</div>

  </div>
</div>

        {/* Clue */}
        <p className="text-slate-400 mb-4 text-sm">
          {current.clue}
        </p>

        {showSuccess && (
  <div className="text-green-400 text-lg font-bold text-center mb-3 animate-bounce">
    ✅ Correct!
  </div>
)}

        {/* Word */}
        <div className="flex gap-3 mb-6 justify-center">
          {display.map((l, i) => (
            <div
              key={i}
              className="w-10 h-12 border-b-2 border-white text-center text-xl"
            >
              {l}
            </div>
          ))}
        </div>

        {/* Wrong guesses */}
        <div className="text-sm text-red-400 mb-4 text-center">
          {wrongGuesses.length > 0 && `Wrong: ${wrongGuesses.join(", ")}`}
        </div>

        {/* Keyboard */}
        <div className="flex flex-wrap gap-2 justify-center">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => {
            const used = guessed.includes(letter);

            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={used || lives <= 0}
                className={`w-10 h-10 rounded-md text-sm font-semibold transition

  ${used ? "bg-slate-700 text-slate-500" : "bg-slate-900 hover:bg-indigo-600"}

  ${lastGuess === letter && word.includes(letter) ? "bg-green-500 text-white" : ""}
  ${lastGuess === letter && !word.includes(letter) ? "bg-red-500 text-white" : ""}
`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Result */}
{isSolved && (
  <div className="mt-6 text-center">

    {currentIndex < puzzle.words.length - 1 ? (
      <button
        onClick={nextWord}
        className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500"
      >
        Next →
      </button>
    ) : (
      <div>

        <button
          onClick={handleSubmit}
          disabled={finalScore !== null}
          className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
        >
          Submit Score 🚀
        </button>

       {finalScore !== null && (
  <div ref={scoreRef} className="mt-4 bg-green-900/30 border border-green-600 rounded-xl p-4">
            <h2 className="text-green-400 text-xl font-bold">
              🎯 Your Score: {finalScore}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Great job! Try again tomorrow to improve 🔥
            </p>
          </div>
        )}

      </div>
    )}

  </div>
)}

        {lives <= 0 && (
          <div className="mt-6 text-center text-red-500 font-semibold">
            Game Over
          </div>
        )}

      </div>
    
     
    </div>
  );
}