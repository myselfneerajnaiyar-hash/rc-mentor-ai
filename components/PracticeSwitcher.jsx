export default function PracticeSwitcher({ view, setView }) {
  return (
    <div className="md:hidden mb-6 mt-2">

      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-full overflow-x-auto">

        {/* RC */}
        <button
          onClick={() => setView("rc")}
          className={`flex-1 min-w-[70px] py-2 text-sm rounded-lg transition ${
            view === "rc"
              ? "bg-indigo-600 text-white"
              : "text-slate-400"
          }`}
        >
          RC
        </button>

        {/* Vocab */}
        <button
          onClick={() => setView("vocab")}
          className={`flex-1 min-w-[70px] py-2 text-sm rounded-lg transition ${
            view === "vocab"
              ? "bg-indigo-600 text-white"
              : "text-slate-400"
          }`}
        >
          Vocab
        </button>

        {/* Speed */}
        <button
          onClick={() => setView("speed")}
          className={`flex-1 min-w-[70px] py-2 text-sm rounded-lg transition ${
            view === "speed"
              ? "bg-indigo-600 text-white"
              : "text-slate-400"
          }`}
        >
          Speed
        </button>

        {/* 🔥 Precision */}
        <button
          onClick={() => setView("precision")}
          className={`flex-1 min-w-[90px] py-2 text-sm rounded-lg transition ${
            view === "precision"
              ? "bg-purple-600 text-white"
              : "text-slate-400"
          }`}
        >
          🎯 Precision
        </button>

      </div>

    </div>
  );
}