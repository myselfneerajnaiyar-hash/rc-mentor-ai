export default function PracticeSwitcher({ view, setView }) {

  return (
    <div className="md:hidden mb-6 mt-2">

      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-full">

        <button
          onClick={() => setView("rc")}
          className={`flex-1 py-2 text-sm rounded-lg transition ${
            view === "rc"
              ? "bg-indigo-600 text-white"
              : "text-slate-400"
          }`}
        >
          RC
        </button>

        <button
          onClick={() => setView("vocab")}
          className={`flex-1 py-2 text-sm rounded-lg transition ${
            view === "vocab"
              ? "bg-indigo-600 text-white"
              : "text-slate-400"
          }`}
        >
          Vocab
        </button>

        <button
          onClick={() => setView("speed")}
          className={`flex-1 py-2 text-sm rounded-lg transition ${
            view === "speed"
              ? "bg-indigo-600 text-white"
              : "text-slate-400"
          }`}
        >
          Speed
        </button>

      </div>

    </div>
  );
}