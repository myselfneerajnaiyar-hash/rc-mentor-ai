"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function RCArenaChampion() {

  const [champion, setChampion] = useState(null)
  const [myRank, setMyRank] = useState(null)
const [myPoints, setMyPoints] = useState(0)
const [pointsToTop5, setPointsToTop5] = useState(0)

  useEffect(() => {

    async function load() {

     const res = await fetch("/api/rc-champion")
const data = await res.json()

setChampion(data.top5)

const userRes =
  await supabase.auth.getUser()

const userId =
  userRes.data.user?.id

if (userId) {

  const rank =
    data.allPlayers.findIndex(
      p => p.user_id === userId
    ) + 1

  const me =
    data.allPlayers.find(
      p => p.user_id === userId
    )

  setMyRank(rank)
  setMyPoints(
    me?.championship_points || 0
  )

  const fifthPlayer =
    data.top5[4]

  if (
    fifthPlayer &&
    rank > 5
  ) {

    setPointsToTop5(
      fifthPlayer.championship_points -
      (me?.championship_points || 0) + 1
    )

  }
}
     
    }

    load()

  }, [])

  if (!champion) return null

  return (

  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

 <h2 className="text-xl font-semibold text-white">
  🏆 RC Arena Season Championship
</h2>

<p className="text-sm text-slate-400 mt-2">
  Season-long leaderboard based on Championship Points earned from Daily RC Arena performances.
</p>

<div className="mt-3 mb-5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
  <div className="text-yellow-300 text-sm font-semibold">
  How To Climb The Championship
</div>

<div className="text-slate-300 text-xs mt-1">
  Higher CAT Scores earn more points. Faster completion earns bonus points.
</div>
</div>

<div className="mb-5 bg-slate-800/60 rounded-xl p-4 border border-slate-700">

  <div className="text-xs text-slate-400">
    Your Championship Status
  </div>

  <div className="text-5xl font-black text-cyan-300 mt-1">
    #{myRank}
  </div>

  <div className="text-3xl text-yellow-400 font-black text-lg">
    {myPoints} pts
  </div>

  {myRank > 5 && (
    <div className="text-orange-300 text-sm mt-2">
      🎯 {pointsToTop5} more points needed to enter Top 5
    </div>
  )}

  <div className="text-slate-400 text-xs mt-2">
  {champion[0]?.championship_points - myPoints}
  pts behind the Champion
</div>

</div>

<div className="text-yellow-300 text-sm font-bold mb-3">
  👑 Current Champion
</div>


  <div className="space-y-3">

  {champion.map((player, index) => (

     <div
  key={index}
  className={`
    flex
    items-center
    justify-between
    rounded-xl
    px-4
    py-3

    ${
      index === 0
        ? "bg-yellow-500/10 border border-yellow-500/30"
        : "bg-slate-800/50"
    }
  `}
>

        <div>

         <div
  className={`
    font-bold text-white
    ${index === 0 ? "text-xl" : ""}
  `}
>

          {index === 0 && "👑 "}
{index === 1 && "🥈 "}
{index === 2 && "🥉 "}
{index > 2 && `#${index + 1} `}

            {player.name}

          </div>

          <div className="text-xs text-slate-400">
            🔥 {player.daily_rc_streak} day streak
          </div>

        </div>

        <div
  className={`
    text-yellow-400 font-black
    ${index === 0 ? "text-2xl" : ""}
  `}
>
          {player.championship_points} pts
        </div>

      </div>

      

    ))}

  </div>
<div className="mt-5 text-xs text-orange-400">
  🔥 Complete Daily RC Challenges every day to climb the Championship.
</div>
</div>
  )
}