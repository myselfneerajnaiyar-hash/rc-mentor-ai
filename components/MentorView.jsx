"use client";

export default function MentorView({
  text,
  setText,
  splitPassage,
  setShowGenerator,
}) {

  const wordCount = text.trim().length
  ? text.trim().split(/\s+/).length
  : 0;

const paragraphCount = text.trim().length
  ? text.split(/\n\s*\n/).filter(Boolean).length
  : 0;

function estimateDifficulty(count) {
  if (count < 300) return "Easy";
  if (count < 450) return "Moderate";
  if (count < 600) return "CAT-Level";
  return "Advanced / Pro";
}

const difficulty = estimateDifficulty(wordCount);

const readingTime = Math.max(1, Math.round(wordCount / 200)); // 200 wpm

const idealMin = 350;
const idealMax = 600;

const inIdealRange = wordCount >= idealMin && wordCount <= idealMax;

const progressPercent = Math.min(
  100,
  Math.round((wordCount / idealMax) * 100)
);
 return (
  <div className="mt-16 max-w-4xl mx-auto">

    {/* Header */}
    <div className="text-center mb-10">
      <h1 className="text-3xl font-bold tracking-tight">
        Paste Your RC Passage
      </h1>
      <p className="text-slate-400 mt-3 text-lg">
        We’ll break it down paragraph by paragraph and train your reading depth.
      </p>
    </div>

    {/* Instruction Panel */}
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
      <h3 className="font-semibold text-slate-200 mb-4">
        How it works
      </h3>
      <ol className="text-slate-400 space-y-2 text-sm list-decimal list-inside">
        <li>Paste a CAT-style RC passage (300–600 words recommended).</li>
        <li>We split it into paragraphs automatically.</li>
        <li>You master each paragraph before taking the full test.</li>
      </ol>
    </div>

    {/* Text Area Card */}
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your CAT-style RC passage here..."
        className="w-full h-56 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />

      {/* Live Stats */}
    <div className="mt-6 space-y-4">

  {/* Metrics Row */}
  <div className="flex flex-wrap justify-between gap-4 text-sm text-slate-400">
    
    <div>
      Words: <span className="text-slate-200 font-semibold">{wordCount}</span>
    </div>

    <div>
      Paragraphs:{" "}
      <span className="text-slate-200 font-semibold">
        {paragraphCount}
      </span>
    </div>

    <div>
      Est. Reading Time:{" "}
      <span className="text-slate-200 font-semibold">
        {readingTime} min
      </span>
    </div>

    <div>
      Difficulty:{" "}
      <span
        className={`font-semibold ${
          difficulty === "Easy"
            ? "text-green-400"
            : difficulty === "Moderate"
            ? "text-yellow-400"
            : difficulty === "CAT-Level"
            ? "text-indigo-400"
            : "text-red-400"
        }`}
      >
        {difficulty}
      </span>
    </div>
  </div>

  {/* CAT Ideal Range Bar */}
  <div>
    <div className="flex justify-between text-xs text-slate-500 mb-1">
      <span>Ideal CAT Range: 350–600 words</span>
      <span>
        {inIdealRange ? "✔ In Range" : "Outside Range"}
      </span>
    </div>

    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${
          inIdealRange
            ? "bg-emerald-500"
            : "bg-yellow-500"
        }`}
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  </div>

</div>
      {/* CTA */}
      <div className="mt-6 text-right">
        <button
          onClick={splitPassage}
          disabled={wordCount < 50}
          className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
            wordCount < 50
              ? "bg-slate-700 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          Split Into Paragraphs
        </button>
      </div>

    </div>
  </div>
);
}
