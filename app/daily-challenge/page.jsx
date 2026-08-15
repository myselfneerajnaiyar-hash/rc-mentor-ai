"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import DailyRcAnalytics from "@/components/DailyRcAnalytics";


import { Clock3, FileText, Target } from "lucide-react";

export default function DailyChallengePage() {
  const [activeTab, setActiveTab] = useState("today");
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyAttempted,
  setAlreadyAttempted] =
  useState(false);

  useEffect(() => {

  async function loadChallenge() {

    try {

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/get-daily-rc", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      const data =
        await response.json();

      setChallenge(
        data.challenge
      );

      const user =
        await supabase.auth.getUser();

      if (
        user.data.user &&
        data.challenge
      ) {

        const { data: attempt } =
          await supabase
            .from(
              "daily_rc_attempts"
            )
            .select("id")
            .eq(
              "user_id",
              user.data.user.id
            )
            .eq(
              "daily_rc_set_id",
              data.challenge.id
            )
            .maybeSingle();

        if (attempt) {
          setAlreadyAttempted(
            true
          );
        }
      }

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  }

  loadChallenge();

}, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071120] flex items-center justify-center text-white">
        <div className="text-3xl font-black animate-pulse">
          Loading Daily RC...
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#071120] flex items-center justify-center text-red-400 text-2xl font-bold">
        Failed to load challenge
      </div>
    );
  }

  const title = challenge.title || "CAT 2023 Slot 3 RC";

  const timer = challenge.timer_minutes || 8;

  const source = challenge.source_year || "CAT 2023";

  const questionCount = challenge.questions?.length || 4;

  return (
    <div className="min-h-screen bg-[#071120] text-white px-4 md:px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* TOP BAR */}

        <div className="flex items-center justify-between">

          <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 backdrop-blur-xl">
            <div className="text-sm font-semibold text-cyan-100 tracking-wide">
              DAILY RC ARENA
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 px-5 py-2 rounded-2xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

            <span className="text-sm text-white font-semibold">
              Built for 99%ilers
            </span>
          </div>

        </div>

        <div className="flex items-center justify-between mb-8">
  <Link href="/">
    <div className="flex items-center gap-3 cursor-pointer">
      <img
        src="/logo.png"
        className="w-8 h-8"
      />

      <div>
        <div className="font-bold text-white">
          Auctor RC
        </div>

        <div className="text-xs text-slate-400">
          Daily Arena
        </div>
      </div>
    </div>
  </Link>

  <Link href="/">
    <button
      className="
      px-4 py-2
      rounded-xl
      bg-slate-800
      text-white
      hover:bg-slate-700
      "
    >
      Dashboard
    </button>
  </Link>
</div>

        <div className="inline-flex w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-1 sm:w-auto" role="tablist" aria-label="Daily RC views">
          <button type="button" role="tab" aria-selected={activeTab === "today"} onClick={() => setActiveTab("today")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:flex-none ${activeTab === "today" ? "bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.08)] ring-1 ring-cyan-400/25" : "text-slate-400 hover:text-white"}`}>
            Today&apos;s RC
          </button>
          <button type="button" role="tab" aria-selected={activeTab === "previous"} onClick={() => setActiveTab("previous")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:flex-none ${activeTab === "previous" ? "bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.08)] ring-1 ring-cyan-400/25" : "text-slate-400 hover:text-white"}`}>
            Previous RCs
          </button>
          <button type="button" role="tab" aria-selected={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:flex-none ${activeTab === "analytics" ? "bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.08)] ring-1 ring-cyan-400/25" : "text-slate-400 hover:text-white"}`}>
            Analytics
          </button>
        </div>

        {activeTab === "previous" ? <PreviousRCs /> : activeTab === "analytics" ? <DailyRcAnalytics onOpenToday={() => setActiveTab("today")} /> : <TodaysRc challenge={challenge} title={title} timer={timer} questionCount={questionCount} alreadyAttempted={alreadyAttempted} />}



      </div>
    </div>
  );
}

function TodaysRc({ challenge, title, timer, questionCount, alreadyAttempted }) {
  const metadata = [challenge.difficulty, challenge.source_year].filter(Boolean);
  const unlocks = [
    { icon: "🏆", title: "Leaderboard Ranking", description: "See where you stand." },
    { icon: "🧠", title: "Cognitive Diagnosis", description: "Understand your reading behaviour." },
    { icon: "🎯", title: "Trap Analysis", description: "Identify the distractors that caught you." },
    { icon: "📖", title: "Detailed Review", description: "Review the passage and every question." },
    { icon: "📈", title: "Reading Profile", description: "Understand your reading strengths." },
    { icon: "⚡", title: "Performance Insights", description: "Track accuracy and speed." },
  ];

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 p-5 shadow-[0_18px_60px_rgba(8,145,178,0.10)] sm:p-7 lg:p-8">
      <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Today&apos;s Challenge</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
          {metadata.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">{metadata.map((item) => <span key={item} className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">{item}</span>)}</div>}
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">A CAT-level reading challenge designed to test inference, scope and comprehension under time pressure.</p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            <HeroStat icon={FileText} label="Questions" value={questionCount} />
            <HeroStat icon={Clock3} label="Target Time" value={`${timer} min`} />
            <HeroStat icon={Target} label="Scoring" value="+3 / −1 / 0" className="col-span-2 sm:col-span-1" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {alreadyAttempted
            ? <Link href="/daily-challenge/result" className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 text-base font-black text-emerald-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">View Today&apos;s Report →</Link>
            : <Link href="/daily-challenge/instructions" className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 text-lg font-black text-white shadow-[0_12px_36px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(34,211,238,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Start Today&apos;s RC →</Link>}
          <p className="text-center text-xs leading-5 text-slate-500">One focused passage. No distractions. Full diagnosis after completion.</p>
        </div>
      </div>
    </section>

    <section className="flex gap-4 rounded-2xl border border-cyan-500/15 bg-slate-900/65 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-xl" aria-hidden="true">🧠</div>
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Today&apos;s Focus</p><h2 className="mt-1 font-bold text-white">Avoid scope distortion traps</h2><p className="mt-1 text-sm leading-6 text-slate-400">Don&apos;t choose an option simply because it sounds reasonable. Every answer must be supported by the passage.</p></div>
    </section>

    <section>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Complete the RC</p>
      <h2 className="mt-2 text-2xl font-black text-white">Unlock your full reading diagnosis</h2>
      <p className="mt-1 text-sm text-slate-400">Your full reading diagnosis appears after you finish the challenge.</p>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {unlocks.map((item) => <article key={item.title} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 transition-colors duration-200 hover:border-cyan-500/20 hover:bg-slate-900/65"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-lg" aria-hidden="true">{item.icon}</span><div className="min-w-0"><h3 className="text-sm font-bold text-white">{item.title}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p></div></article>)}
      </div>
    </section>
  </div>;
}

function HeroStat({ icon: Icon, label, value, className = "" }) {
  return <div className={`min-w-0 rounded-xl border border-white/10 bg-white/[0.045] p-3 sm:p-4 ${className}`}><Icon className="h-4 w-4 text-cyan-300" aria-hidden="true" /><p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:text-[10px]">{label}</p><p className="mt-1 text-sm font-black text-white sm:text-lg">{value}</p></div>;
}

function PreviousRCs() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("unattempted");

  useEffect(() => {
    let cancelled = false;

    async function loadPrevious() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/get-daily-rc?view=previous&status=${status}&page=${page}&limit=20`, {
        cache: "no-store",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const result = await response.json();
      if (!cancelled) {
        setChallenges(response.ok ? result.challenges || [] : []);
        setTotalPages(result.pagination?.totalPages || 1);
        setLoading(false);
      }
    }

    loadPrevious();
    return () => { cancelled = true; };
  }, [page, status]);

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">Loading previous RCs…</div>;
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Previous RCs</p>
        <h2 className="mt-2 text-2xl font-black text-white">Practice previous Daily RC challenges at your own pace.</h2>
      </div>

      <div className="mb-6 inline-flex w-full rounded-xl border border-slate-800 bg-slate-950/45 p-1 sm:w-auto" role="tablist" aria-label="Previous RC status">
        {[{ id: "unattempted", label: "Unattempted" }, { id: "attempted", label: "Attempted" }].map((item) => <button key={item.id} type="button" role="tab" aria-selected={status === item.id} onClick={() => { setStatus(item.id); setPage(1); }} className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors sm:flex-none ${status === item.id ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/20" : "text-slate-500 hover:text-slate-200"}`}>{item.label}</button>)}
      </div>

      {challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">{status === "attempted" ? "You have not attempted any previous RCs yet." : "No unattempted previous RCs available."}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => {
            const attempted = Boolean(challenge.attempt);
            const href = attempted
              ? `/rc-session/${challenge.attempt.id}`
              : `/daily-challenge/instructions?challengeId=${encodeURIComponent(challenge.id)}`;
            return (
              <article key={challenge.id} className="group flex min-w-0 flex-col rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/25 hover:bg-slate-950/55 hover:shadow-lg hover:shadow-cyan-950/10 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{formatChallengeDate(challenge.challenge_date)}</p>
                  <h3 className="mt-2 line-clamp-2 text-base font-bold leading-6 text-white">{challenge.title || "Daily RC"}</h3>
                  <div className="mt-3 flex min-h-7 flex-wrap gap-1.5 text-[11px] text-slate-400">
                    {challenge.difficulty && <span className="rounded-full border border-slate-700 px-2.5 py-1">{challenge.difficulty}</span>}
                    {challenge.source_year && <span className="rounded-full border border-slate-700 px-2.5 py-1">{challenge.source_year}</span>}
                  </div>
                  {attempted && <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-xs"><AttemptMetric label="Accuracy" value={`${challenge.attempt.accuracy}%`} /><AttemptMetric label="Time" value={formatAttemptTime(challenge.attempt.time_taken)} /><AttemptMetric label="Score" value={formatAttemptScore(challenge.attempt.score)} /></div>}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${attempted ? "text-emerald-300" : "text-amber-300"}`}>
                    <span aria-hidden="true">{attempted ? "✓" : "●"}</span>{attempted ? "Attempted" : "Not Attempted"}
                  </span>
                  <Link href={href} className={`inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg px-4 py-2 text-xs font-bold transition-colors ${attempted ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15" : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"}`}>
                    {attempted ? "View Report →" : "Practice →"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && <div className="mt-6 flex items-center justify-center gap-3"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40">Previous</button><span className="text-sm text-slate-500">Page {page} of {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40">Next</button></div>}
    </section>
  );
}

function formatChallengeDate(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T00:00:00+05:30`));
}

function AttemptMetric({ label, value }) {
  return <div><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 font-bold text-slate-200">{value}</p></div>;
}

function formatAttemptTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function formatAttemptScore(score) {
  const value = Number(score) || 0;
  return value > 0 ? `+${value}` : String(value);
}
