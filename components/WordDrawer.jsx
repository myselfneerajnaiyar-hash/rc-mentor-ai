"use client";
"use client";

import { useEffect } from "react";

export default function WordDrawer({
  lookup,
  setLookup,
  words = [],
}) {
  if (!lookup) return null;

  const currentIndex = words.findIndex(
  w => w.word === lookup.word
);

const prevWord =
  currentIndex > 0
    ? words[currentIndex - 1]
    : null;

const nextWord =
  currentIndex < words.length - 1
    ? words[currentIndex + 1]
    : null;

    useEffect(() => {
  function handleKey(e) {
    if (e.key === "ArrowLeft" && prevWord)
      setLookup(prevWord);

    if (e.key === "ArrowRight" && nextWord)
      setLookup(nextWord);

    if (e.key === "Escape")
      setLookup(null);
  }

  window.addEventListener("keydown", handleKey);

  return () => window.removeEventListener("keydown", handleKey);
}, [lookup, prevWord, nextWord]);

  const difficultyColor = {
    Basic: "bg-emerald-600",
    Intermediate: "bg-amber-500",
    Advanced: "bg-red-600",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setLookup(null)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-screen w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto">

        <div className="p-6">

          {/* Header */}
          <div className="flex justify-between items-start">

            <div>
              <h2 className="text-3xl font-bold text-white">
                {lookup.word}
              </h2>

<p className="text-sm text-slate-400 mt-1">
  {currentIndex + 1} of {words.length}
</p>
              <div className="mt-2 flex gap-2 flex-wrap">

                {lookup.partOfSpeech && (
                  <span className="px-2 py-1 rounded bg-slate-800 text-sm">
                    {lookup.partOfSpeech}
                  </span>
                )}

                {lookup.difficulty_tag && (
                  <span
                    className={`px-2 py-1 rounded text-sm text-white ${
                      difficultyColor[lookup.difficulty_tag] ||
                      "bg-slate-700"
                    }`}
                  >
                    {lookup.difficulty_tag}
                  </span>
                )}

                {lookup.frequency_rank && (
                  <span className="px-2 py-1 rounded bg-blue-700 text-sm">
                    Rank #{lookup.frequency_rank}
                  </span>
                )}
              </div>
            </div>

            <button
  onClick={() => navigator.clipboard.writeText(lookup.word)}
  className="mr-3 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sm"
>
  Copy
</button>

            <button
              onClick={() => setLookup(null)}
              className="text-2xl text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
<div className="sticky top-0 z-20 bg-slate-900 py-4 flex gap-3 border-b border-slate-700">

  <button
    disabled={!prevWord}
    onClick={() => setLookup(prevWord)}
    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-3
      hover:bg-slate-700 disabled:opacity-30"
  >
    ← Previous
  </button>

  <button
    disabled={!nextWord}
    onClick={() => setLookup(nextWord)}
    className="flex-1 rounded-xl border border-orange-500 bg-orange-500/10 py-3
      hover:bg-orange-500/20 disabled:opacity-30"
  >
    Next →
  </button>

</div>

          {/* Meaning */}

          <div className="mt-8 space-y-5">

            <Section
              title="Meaning"
              value={lookup.meaning}
            />

            <Section
              title="Usage"
              value={lookup.usage}
            />

            <Section
              title="Root"
              value={lookup.root}
            />

            <Section
              title="Synonyms"
              value={
                Array.isArray(lookup.synonyms)
                  ? lookup.synonyms.join(", ")
                  : lookup.synonyms
              }
            />

            <Section
              title="Antonyms"
              value={
                Array.isArray(lookup.antonyms)
                  ? lookup.antonyms.join(", ")
                  : lookup.antonyms
              }
            />

          </div>

        </div>
      </div>
    </>
  );
}

function Section({ title, value }) {
  return (
    <div>
      <h4 className="text-orange-400 font-semibold mb-1">
        {title}
      </h4>

      <p className="text-slate-300 leading-7">
        {value || "—"}
      </p>
    </div>
  );
}