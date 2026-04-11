"use client";

import { useState } from "react";
import puzzles from "../data/puzzles.json";

export default function HangmanPage() {
  const puzzle = puzzles[0]; // first puzzle

  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessed, setGuessed] = useState([]);
  const [lives, setLives] = useState(puzzle.maxLives);

  const currentWord = puzzle.words[currentIndex].answer;

 function handleGuess(letter) {
  if (guessed.includes(letter) || isSolved || lives <= 0) return;

  setGuessed([...guessed, letter]);

  if (!currentWord.includes(letter)) {
    setLives((prev) => prev - 1);
  }
}

  function nextWord() {
    setCurrentIndex(currentIndex + 1);
    setGuessed([]);
  }

  const displayWord = currentWord
    .split("")
    .map((l) => (guessed.includes(l) ? l : "_"))
    .join(" ");

  const isSolved = !displayWord.includes("_");

  return (
    <div style={{ padding: 20 }}>
      <h2>📖 Passage</h2>
      <p>{puzzle.passage}</p>

      <hr />

      <h3>Word {currentIndex + 1} / {puzzle.words.length}</h3>
      <p><b>Clue:</b> {puzzle.words[currentIndex].clue}</p>

     <div style={{ fontSize: 32, margin: "20px 0" }}>
  {currentWord.split("").map((l, i) => (
    <span
      key={i}
      style={{
        borderBottom: "2px solid white",
        margin: "0 8px",
        display: "inline-block",
        width: 20,
        textAlign: "center",
      }}
    >
      {guessed.includes(l) ? l : ""}
    </span>
  ))}
</div>

      <p>❤️ Lives: {lives}</p>
      <p>
  ❌ Wrong guesses:{" "}
  {guessed.filter((l) => !currentWord.includes(l)).join(", ")}
</p>

    <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 600 }}>
  {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
    const isUsed = guessed.includes(letter);

    return (
      <button
        key={letter}
        onClick={() => handleGuess(letter)}
        disabled={isUsed || lives <= 0}
        style={{
          margin: 4,
          padding: "10px 14px",
          background: isUsed ? "#555" : "#222",
          color: "white",
          border: "1px solid #444",
          cursor: isUsed ? "not-allowed" : "pointer",
        }}
      >
        {letter}
      </button>
    );
  })}
</div>

      {isSolved && (
        <div>
          <h3>✅ Correct!</h3>
          {currentIndex < puzzle.words.length - 1 ? (
            <button onClick={nextWord}>Next Word</button>
          ) : (
            <h2>🎉 Completed!</h2>
          )}
        </div>
      )}

      {lives <= 0 && <h2>💀 Game Over</h2>}
    </div>
  );
}