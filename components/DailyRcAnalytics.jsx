"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, CheckCircle2, Clock3, Flame, Gauge, Target, Trophy } from "lucide-react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts"
import { supabase } from "@/lib/supabase"

const ranges = [{ id: "all", label: "All Time" }, { id: "30d", label: "Last 30 Days" }, { id: "7d", label: "Last 7 Days" }]

export default function DailyRcAnalytics({ onOpenToday }) {
  const [range, setRange] = useState("all")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/daily-rc-analytics?range=${range}`, { cache: "no-store", headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} })
      const result = response.ok ? await response.json() : null
      if (!cancelled) { setData(result); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [range])

  return (
    <section className="space-y-6" aria-labelledby="daily-rc-analytics-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Daily RC Analytics</p>
          <h2 id="daily-rc-analytics-title" className="mt-2 text-3xl font-black text-white sm:text-4xl">Your reading performance</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Understand your reading performance, speed and accuracy across every RC you attempt.</p>
        </div>
        <div className="grid grid-cols-3 rounded-xl border border-slate-800 bg-slate-900/70 p-1" role="group" aria-label="Analytics time range">
          {ranges.map((item) => <button key={item.id} type="button" onClick={() => setRange(item.id)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${range === item.id ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25" : "text-slate-400 hover:text-white"}`}>{item.label}</button>)}
        </div>
      </div>

      {loading ? <AnalyticsLoading /> : !data?.overview ? <EmptyState onOpenToday={onOpenToday} /> : <AnalyticsContent data={data} />}
    </section>
  )
}

function AnalyticsContent({ data }) {
  const overview = data.overview
  const metrics = [
    { label: "RCs Attempted", value: overview.attempted, icon: CheckCircle2 },
    { label: "Average Accuracy", value: `${overview.averageAccuracy}%`, icon: Target },
    { label: "Average Time", value: formatDuration(overview.averageTime), icon: Clock3 },
    { label: "Average Score", value: formatScore(overview.averageScore), icon: Gauge },
    { label: "Best Accuracy", value: `${overview.bestAccuracy}%`, icon: Trophy },
    { label: "Current Streak", value: `${overview.currentStreak} day${overview.currentStreak === 1 ? "" : "s"}`, icon: Flame },
  ]

  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{metrics.map((metric) => <Metric key={metric.label} {...metric} />)}</div>

    <div className="grid gap-6 xl:grid-cols-2">
      <TrendCard title="Accuracy Trend" subtitle={accuracyTrendText(data.trend)}><ResponsiveContainer width="100%" height="100%"><LineChart data={data.accuracyTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip valueFormatter={(value) => `${value}%`} />} /><Line type="monotone" dataKey="accuracy" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3, fill: "#22d3ee" }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></TrendCard>
      <TrendCard title="Speed Trend" subtitle={speedTrendText(data.speedTrendSummary)}><ResponsiveContainer width="100%" height="100%"><LineChart data={data.speedTrend} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(value) => `${Math.round(value / 60)}m`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip valueFormatter={formatDuration} />} /><Line type="monotone" dataKey="time" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3, fill: "#818cf8" }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></TrendCard>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Panel title="Accuracy vs Speed" subtitle="Each point represents one RC attempt. Zones are relative to your own median accuracy and time.">
        <div className="h-72"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" /><XAxis type="number" dataKey="time" name="Time" tickFormatter={(value) => `${Math.round(value / 60)}m`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} /><YAxis type="number" dataKey="accuracy" name="Accuracy" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} /><ZAxis range={[55, 55]} /><Tooltip cursor={{ strokeDasharray: "3 3" }} content={<ScatterTooltip />} /><Scatter data={data.scatter.points} fill="#22d3ee" /></ScatterChart></ResponsiveContainer></div>
        {data.scatter.strongestZone && <div className="mt-3 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] p-3 text-sm text-slate-300"><span className="font-semibold text-cyan-200">Your strongest zone:</span> Most attempts fall in “{data.scatter.strongestZone}” relative to your own median performance.</div>}
      </Panel>
      <RecentPerformance attempts={data.recent} />
    </div>

    {(data.questionTypes.length > 0 || data.difficulties.length > 0 || data.sources.length > 0) && <div className="grid gap-6 lg:grid-cols-3">
      {data.questionTypes.length > 0 && <Breakdown title="Question Performance" rows={data.questionTypes} type="questions" />}
      {data.difficulties.length > 0 && <Breakdown title="Difficulty Performance" rows={data.difficulties} />}
      {data.sources.length > 0 && <Breakdown title="Source / Year Performance" rows={data.sources} />}
    </div>}

    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Consistency data={data.consistency} />
      <Panel title="Personal Bests"><div className="grid gap-3 sm:grid-cols-2">{data.personalBests.map((best) => <div key={best.label} className="rounded-xl border border-slate-800 bg-slate-950/35 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{best.label}</p><p className="mt-2 text-xl font-black text-white">{best.value}</p><p className="mt-1 truncate text-xs text-slate-400">{best.detail}</p></div>)}</div></Panel>
    </div>

    <Panel title="Your Reading Profile" subtitle="Deterministic observations from your recorded attempts."><div className="grid gap-3 md:grid-cols-3">{data.readingProfile.map((observation, index) => <div key={observation} className="flex gap-3 rounded-xl border border-blue-500/15 bg-blue-500/[0.05] p-4 text-sm leading-6 text-slate-300"><span className="font-bold text-blue-300">{index + 1}</span><p>{observation}</p></div>)}</div></Panel>
  </div>
}

function Metric({ label, value, icon: Icon }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4"><Icon size={16} className="text-cyan-300" aria-hidden="true" /><p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div> }
function Panel({ title, subtitle, children }) { return <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 sm:p-5"><h3 className="font-bold text-white">{title}</h3>{subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}<div className="mt-4">{children}</div></section> }
function TrendCard({ title, subtitle, children }) { return <Panel title={title} subtitle={subtitle}><div className="h-64 sm:h-72">{children}</div></Panel> }

function RecentPerformance({ attempts }) { return <Panel title="Recent Performance" subtitle="Your latest 10 Daily RC attempts."><div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">{attempts.map((attempt) => <Link key={attempt.id} href={`/rc-session/${attempt.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-slate-800 bg-slate-950/35 p-3 transition-colors hover:border-cyan-500/25"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{attempt.title}</p><p className="mt-1 text-xs text-slate-500">{formatDate(attempt.date)} · {formatDuration(attempt.time)}</p></div><div className="text-right"><p className={`text-sm font-bold ${attempt.score >= 0 ? "text-cyan-300" : "text-red-300"}`}>{formatScore(attempt.score)}</p><p className="mt-1 text-xs text-slate-400">{attempt.accuracy}% · {attempt.correct}C/{attempt.incorrect}W</p></div></Link>)}</div></Panel> }

function Breakdown({ title, rows, type }) { return <Panel title={title}><div className="space-y-3">{rows.map((row) => <div key={row.label}><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium capitalize text-slate-300">{row.label}</span><span className="shrink-0 text-slate-400">{type === "questions" ? `${row.attempted} attempted · ` : `${row.attempts} RC${row.attempts === 1 ? "" : "s"} · `}<strong className="text-white">{row.accuracy}%</strong></span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(2, row.accuracy)}%` }} /></div>{row.averageTime != null && <p className="mt-1 text-[11px] text-slate-500">Average time {formatDuration(row.averageTime)}</p>}</div>)}</div></Panel> }

function Consistency({ data }) { const items = [{ label: "Current Streak", value: `${data.currentStreak}d` }, { label: "Longest Streak", value: `${data.longestStreak}d` }, { label: "This Week", value: data.attemptedThisWeek }, { label: "This Month", value: data.attemptedThisMonth }, { label: "Days Active", value: data.daysActive }]; return <Panel title="Consistency"><div className="grid grid-cols-2 gap-3">{items.map((item) => <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</p><p className="mt-1 text-xl font-black text-white">{item.value}</p></div>)}</div></Panel> }

function EmptyState({ onOpenToday }) { return <div className="rounded-3xl border border-dashed border-cyan-500/25 bg-cyan-500/[0.04] px-6 py-16 text-center"><Activity className="mx-auto text-cyan-300" size={34} /><h3 className="mt-5 text-2xl font-black text-white">Your reading analytics will appear here.</h3><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">Complete your first Daily RC to start tracking accuracy, speed and progress.</p><button type="button" onClick={onOpenToday} className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400">Start Today&apos;s RC</button></div> }
function AnalyticsLoading() { return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />)}</div> }
function ChartTooltip({ active, payload, label, valueFormatter }) { if (!active || !payload?.length) return null; return <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs shadow-xl"><p className="text-slate-400">{formatDate(label)}</p><p className="mt-1 font-semibold text-white">{valueFormatter(payload[0].value)}</p></div> }
function ScatterTooltip({ active, payload }) { if (!active || !payload?.length) return null; const point = payload[0].payload; return <div className="max-w-52 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs shadow-xl"><p className="truncate font-semibold text-white">{point.title}</p><p className="mt-1 text-slate-400">{point.accuracy}% · {formatDuration(point.time)}</p></div> }

function accuracyTrendText(trend) { if (trend.direction === "improving") return "Your accuracy is improving."; if (trend.direction === "declining") return "Your accuracy has declined recently."; if (trend.direction === "stable") return "Your accuracy has remained stable."; return "Complete more RCs to establish a meaningful trend." }
function speedTrendText(trend) { if (trend.direction === "faster") return "Your recent completion time is lower."; if (trend.direction === "slower") return "Your recent completion time is higher."; if (trend.direction === "stable") return "Your completion time has remained stable."; return "Complete more RCs to establish a meaningful trend." }
function shortDate(value) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00Z`)) }
function formatDate(value) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00Z`)) }
function formatDuration(seconds = 0) { const minutes = Math.floor(seconds / 60); return `${minutes}m ${String(Math.round(seconds % 60)).padStart(2, "0")}s` }
function formatScore(value) { const rounded = Number.isInteger(value) ? value : Number(value).toFixed(1); return value > 0 ? `+${rounded}` : String(rounded) }
