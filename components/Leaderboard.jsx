"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Leaderboard() {

  const [data, setData] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  const [yourRank, setYourRank] = useState(null)
  const [total, setTotal] = useState(0)

  const [leaderScore, setLeaderScore] = useState(0)
  const [yourScore, setYourScore] = useState(0)
  const [gap, setGap] = useState(0)

  // 🔥 MAIN LOAD FUNCTION
  async function load() {

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id
    setCurrentUser(userId)

   const res = await fetch("/api/leaderboard", {
  headers: {
    Authorization: `Bearer ${sessionData.session?.access_token}`
  }
})

if (!res.ok) {
  console.log("Leaderboard API failed")
  return
}

const json = await res.json()

    const topData = json.top || []

    setData(topData)
    setYourRank(json.yourRank)
    setTotal(json.totalParticipants)

    if (topData.length > 0) {

      const leaderValue = Number(topData[0].total_score)

      const youRow = topData.find(row => row.user_id === userId)
      const yourValue = youRow ? Number(youRow.total_score) : 0

      const computedGap = Math.max(0, leaderValue - yourValue)

      setLeaderScore(leaderValue)
      setYourScore(yourValue)
      setGap(computedGap)
    }
  }

  // 🔄 AUTO REFRESH EVERY 20 SECONDS
  useEffect(() => {

    load()

    const interval = setInterval(() => {
      load()
    }, 20000)

    return () => clearInterval(interval)

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
        No attempts yet today. Be the first 🚀
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">

      {data.map((row, index) => {
        const isYou = row.user_id === currentUser

        return (
          <div
            key={row.user_id}
            className={`flex justify-between items-center p-4 rounded-xl transition
              ${isYou
                ? "bg-indigo-600/20 border border-indigo-500/40"
                : "bg-slate-800"}
            `}
          >
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold">
                {medal(index)}
              </span>

              <span className={`font-medium ${isYou ? "text-indigo-400" : "text-white"}`}>
                {row.profiles?.name || "Anonymous"}
                {isYou && " (You)"}
              </span>
            </div>

            <span className="text-green-400 font-bold">
              {Number(row.total_score).toFixed(2)}
            </span>
          </div>
        )
      })}

      {yourRank && (
        <div className="mt-4 text-center text-sm text-slate-400">
          Your Rank:
          <span className="text-indigo-400 font-semibold ml-1">
            {yourRank}
          </span> / {total}

          {total > 1 && (
            <div className="mt-2">
              {gap === 0 ? (
                <span className="text-green-400 font-medium">
                  🔥 You are leading today
                </span>
              ) : (
                <span className="text-yellow-400 font-medium">
                  {gap.toFixed(2)} pts to reach #1 🚀
                </span>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}