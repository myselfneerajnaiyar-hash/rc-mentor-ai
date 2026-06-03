"use client"

import { useEffect, useState } from "react"

export default function RCLeaderboard() {

  const [data, setData] = useState([])

  async function load() {

    const res = await fetch("/api/rc-leaderboard")

    if (!res.ok) return

    const json = await res.json()

    setData(json.top || [])
  }

  useEffect(() => {

    load()

    const interval =
      setInterval(load, 20000)

    return () =>
      clearInterval(interval)

  }, [])

  function medal(index) {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `#${index + 1}`
  }

  if (!data.length) {

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400">
        No RC attempts today
      </div>
    )
  }

  return (

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

      <h3 className="text-xl font-black text-cyan-300 mb-4">
        Daily RC Arena
      </h3>

      <div className="space-y-3">

        {data.map((row, index) => (

          <div
            key={row.user_id}
            className="
              flex
              justify-between
              items-center
              p-4
              rounded-xl
              bg-slate-800
            "
          >

            <div className="flex gap-3 items-center">

              <div>
                {medal(index)}
              </div>

              <div>
                {row.profiles?.name}
              </div>

            </div>

            <div className="text-cyan-300 font-black">

              {row.score}

              <span className="text-xs text-slate-400 ml-2">
                {row.time_taken}s
              </span>

            </div>

          </div>

        ))}

      </div>

    </div>

  )
}