"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function RCLeaderboard({ category = "cat_pyq" }) {

  const [data, setData] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setData([])
    setError(null)

    const loadCurrentCategory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`/api/rc-leaderboard?category=${encodeURIComponent(category)}`, { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} })
        const json = await res.json()
        if (!active) return
        if (!res.ok) {
          setError(json.error || "Could not load this leaderboard. Please try again.")
          return
        }
        setError(null)
        setData(json.top || [])
      } catch {
        if (active) setError("Could not load this leaderboard. Please try again.")
      }
    }

    loadCurrentCategory()

    const interval =
      setInterval(loadCurrentCategory, 20000)

    return () => {
      active = false
      clearInterval(interval)
    }

  }, [category])

  function medal(index) {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `#${index + 1}`
  }

  if (error) {
    return (
      <div role="alert" className="bg-slate-900 border border-amber-800 rounded-2xl p-6 text-amber-200">
        {error}
      </div>
    )
  }

  if (!data.length) {

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400">
        {category === "daily_rc_challenge" ? "No Daily RC Challenge attempts today" : "No CAT PYQ attempts today"}
      </div>
    )
  }

  return (

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

      <h3 className="text-xl font-black text-cyan-300 mb-4">
        {category === "daily_rc_challenge" ? "Daily RC Challenge Leaderboard" : "Daily CAT PYQ Leaderboard"}
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
