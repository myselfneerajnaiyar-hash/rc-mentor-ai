"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function WordHuntLeaderboard() {

  const [data, setData] = useState([])
  const [streak, setStreak] = useState(0)
  const [currentUser, setCurrentUser] = useState(null)
  const [yourRank, setYourRank] = useState(null)
  const [total, setTotal] = useState(0)

  async function load() {

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id

    // 🔥 FETCH STREAK
try {
  if (!userId) {
    setStreak(0);
  } else {
    const streakRes = await fetch("/api/streak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (streakRes.ok) {
      const streakJson = await streakRes.json();
      setStreak(streakJson.streak || 0);
    } else {
      setStreak(0);
    }
  }
} catch (err) {
  console.log("Streak fetch failed:", err);
  setStreak(0);
}
    setCurrentUser(userId)

    const res = await fetch("/api/wordhunt-leaderboard", {
      headers: {
        Authorization: `Bearer ${sessionData.session?.access_token}`
      }
    })

    if (!res.ok) return

    const json = await res.json()

    setData(json.top || [])
    setYourRank(json.yourRank)
    setTotal(json.totalParticipants)
  }

  useEffect(() => {
    load()

    const interval = setInterval(load, 20000)
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
        No attempts yet today 🚀
      </div>
    )
  }

  return (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">

    {/* 🔥 ADD THIS BLOCK */}
   <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 text-orange-400 text-sm font-semibold mb-3 inline-block">
    🔥 {streak} {streak === 1 ? "day" : "days"} streak
    </div>

    <div className="text-xs text-slate-400">
  {streak < 3 && "Keep going! Build your streak 🔥"}
  {streak >= 3 && streak < 7 && "You're on fire 🚀"}
  {streak >= 7 && "Elite consistency 💎"}
</div>

      {data.map((row, index) => {
        const isYou = row.user_id === currentUser

        return (
          <div
            key={row.user_id}
            className={`flex justify-between items-center p-4 rounded-xl
              ${isYou
                ? "bg-green-600/20 border border-green-500/40"
                : "bg-slate-800"}
            `}
          >
            <div className="flex items-center gap-4">
              <span>{medal(index)}</span>

              <span className={isYou ? "text-green-400" : "text-white"}>
                {row.profiles?.name}
                {isYou && " (You)"}
              </span>
            </div>

            <span className="text-green-400 font-bold">
              {row.score}
            </span>
          </div>
        )
      })}

      {yourRank && (
        <div className="text-center text-sm text-slate-400 mt-3">
          Your Rank:
          <span className="text-green-400 ml-1 font-semibold">
            {yourRank}
          </span> / {total}
        </div>
      )}

    </div>
  )
}