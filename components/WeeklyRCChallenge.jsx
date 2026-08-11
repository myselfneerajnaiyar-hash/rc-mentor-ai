"use client"

import { useCallback, useEffect, useState } from "react"
import { Award, Clock3, Target, Trophy } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function WeeklyRCChallenge() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(`/api/rc-weekly-challenge?page=${page}&limit=25`, {
      cache: "no-store",
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    })
    if (!response.ok) return
    setData(await response.json())
  }, [page])

  useEffect(() => {
    load()
    const refreshId = window.setInterval(load, 30000)
    return () => window.clearInterval(refreshId)
  }, [load])

  useEffect(() => {
    const clockId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(clockId)
  }, [])

  if (!data) {
    return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">Loading Weekly RC Challenge…</section>
  }

  const timeLeft = Math.max(0, new Date(data.competition.endsAt).getTime() - now)
  const me = data.currentUser

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75 shadow-xl shadow-black/10">
      <header className="border-b border-slate-800 bg-gradient-to-br from-slate-900 to-blue-950/30 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Current week</p>
            <h2 className="mt-2 text-2xl font-bold text-white">🏆 Weekly RC Challenge</h2>
            <p className="mt-2 text-sm text-slate-400">{data.competition.weekLabel} · {data.competition.timeZone}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-blue-100">
            <Clock3 size={18} aria-hidden="true" />
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/70">Time left</p><p className="font-mono text-lg font-semibold tabular-nums">{formatCountdown(timeLeft)}</p></div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={Trophy} label="Your rank" value={me ? `#${me.rank}` : "—"} />
          <Metric icon={Target} label="Your score" value={`${me?.weeklyCompositeScore || 0} pts`} />
          <Metric icon={Award} label="Eligible attempts" value={me?.attempts || 0} />
          <Metric icon={Target} label="Accuracy" value={me ? `${me.accuracy}%` : "—"} />
        </div>
      </header>

      <div className="mx-5 mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 sm:mx-6 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">🏆 Last Week&apos;s Champion</p>
        {data.latestChampion?.winner_name && data.latestChampion?.winner_score != null ? (
          <div className="mt-3">
            <p className="text-lg font-bold text-white">{data.latestChampion.winner_name}</p>
            <p className="mt-2 text-sm font-medium text-amber-100">🎉 Congratulations, {data.latestChampion.winner_name}!</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">You topped last week&apos;s Weekly RC Challenge with <span className="font-semibold text-amber-200">{data.latestChampion.winner_score} points</span>.</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No previous champion yet.</p>
        )}
      </div>

      <div className="mx-5 mt-4 rounded-xl border border-orange-500/20 bg-orange-500/[0.045] p-4 sm:mx-6 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-300">🔥 This Week&apos;s Challenge</p>
        <p className="mt-3 font-semibold text-white">Think you can take the crown?</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">Keep solving Daily RCs, build your score, and climb the leaderboard. The next Weekly Champion could be you! 🏆</p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-white">Leaderboard</h3><span className="text-xs text-slate-500">{data.pagination.totalParticipants} participants</span></div>

        {data.leaderboard.length ? (
          <div className="space-y-2">
            {data.leaderboard.map((player) => {
              const isCurrentUser = me?.userId === player.userId
              return <div key={player.userId} className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 sm:px-4 ${isCurrentUser ? "border-blue-400/45 bg-blue-500/10 shadow-[0_0_18px_rgba(59,130,246,0.08)]" : "border-slate-800 bg-slate-950/30"}`}>
                <span className="text-center text-sm font-bold text-slate-300">{rankLabel(player.rank)}</span>
                <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{player.name}{isCurrentUser ? " (You)" : ""}</p><p className="mt-0.5 text-[11px] text-slate-500">{player.attempts} attempt{player.attempts === 1 ? "" : "s"} · {player.accuracy}% accuracy</p></div>
                <span className={`font-semibold tabular-nums ${player.weeklyCompositeScore >= 0 ? "text-cyan-300" : "text-red-300"}`}>{player.weeklyCompositeScore} pts</span>
              </div>
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">No eligible RC attempts this week yet.</div>
        )}

        {data.pagination.totalPages > 1 && <div className="mt-5 flex items-center justify-center gap-3"><button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {page} of {data.pagination.totalPages}</span><button disabled={page >= data.pagination.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">Next</button></div>}

        <div className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">Weekly ranking combines CAT score with completion time.</div>
      </div>
    </section>
  )
}

function Metric({ icon: Icon, label, value }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><Icon size={15} className="text-blue-300" aria-hidden="true" /><p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>
}

function rankLabel(rank) {
  if (rank === 1) return "🥇"
  if (rank === 2) return "🥈"
  if (rank === 3) return "🥉"
  return `#${rank}`
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
}
