"use client"

import { useEffect, useState } from "react"

export default function HistoryPage() {

const [history, setHistory] = useState([])

useEffect(() => {

async function loadHistory() {

  const res = await fetch(
    "/api/get-editorial-history"
  )

  const data = await res.json()

  setHistory(data.history || [])

}

loadHistory()

}, [])

return (

<div className="min-h-screen bg-slate-950 text-white px-6 py-10">

  <div className="max-w-6xl mx-auto">

    {/* TOP NAV */}

    <div className="mb-12">

      <div className="inline-flex bg-slate-900 border border-slate-800 rounded-2xl p-1">

        <button
          onClick={() =>
            window.location.href = "/birbal-v2"
          }
          className="px-6 py-3 rounded-xl font-semibold text-slate-300 hover:text-white transition"
        >
          Analyze
        </button>

        <button
          className="px-6 py-3 rounded-xl font-semibold bg-cyan-500 text-black"
        >
          History
        </button>

      </div>

    </div>

    {/* PAGE TITLE */}

    <div className="mb-12">

      <h1 className="text-5xl font-bold mb-4">
        Birbal History
      </h1>

      <p className="text-slate-400 text-lg">
        Revisit your past editorial intelligence sessions.
      </p>

    </div>

    {/* EMPTY STATE */}

    {history.length === 0 && (

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">

        <div className="text-3xl font-bold mb-4">
          No Editorials Yet
        </div>

        <p className="text-slate-400">
          Analyze your first editorial to build your Birbal memory archive.
        </p>

      </div>

    )}

    {/* HISTORY GRID */}

    <div className="grid md:grid-cols-2 gap-6">

      {history.map((item) => (

        <div
          key={item.id}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/30 transition"
        >

          {/* TOP ROW */}

          <div className="flex items-start justify-between mb-5">

            <div>

              <div className="text-sm text-slate-500">

                {new Date(
                  item.created_at
                ).toLocaleString()}

              </div>

              <h2 className="text-2xl font-bold mt-2 leading-snug">

                {item.title || "Untitled Editorial"}

              </h2>

            </div>

            <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 text-sm whitespace-nowrap">

              {item.readingDifficulty || "Medium"}

            </div>

          </div>

          {/* META ROW */}

          <div className="flex flex-wrap gap-3 mb-5">

            <div className="px-3 py-1 rounded-full bg-slate-800 text-sm text-slate-300">

              {item.readingTime || 5} min read

            </div>

            <div className="px-3 py-1 rounded-full bg-slate-800 text-sm text-slate-300">

              {item.inferenceDensity || 70}% inference

            </div>

            <div className="px-3 py-1 rounded-full bg-slate-800 text-sm text-slate-300">

              {item.trapProbability || "High"} traps

            </div>

          </div>

          {/* PREVIEW */}

          <p className="text-slate-400 leading-relaxed line-clamp-3">

            {item.extracted_text?.slice(0, 220)}...

          </p>

          {/* BUTTON */}

          <a
            href={`/birbal-v2?session=${item.id}`}
            className="inline-block mt-6 px-5 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:opacity-90 transition"
          >
            Open Full Analysis →
          </a>

        </div>

      ))}

    </div>

  </div>

</div>

)
}