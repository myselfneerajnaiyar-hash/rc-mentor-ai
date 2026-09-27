"use client";
import { useDailyActivity } from '@/components/mobile/DailyActivityProvider';
import Recovery from '@/components/mobile/Recovery';
import { useRouter } from "next/navigation";

import {
  BookOpen,
  Dumbbell,
  Puzzle,
  ArrowRight,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getExamCapabilities } from "@/lib/tenant/capabilities";
import { useEffect, useRef } from "react";
import { captureLearningEvent } from "@/lib/learningAnalytics";

export default function TodayActivity({
    exam,
  setView,

}) {

    const daily=useDailyActivity();
    const activity=id=>daily.activities.find(a=>a.id===id);
    const dailyRCCompleted=activity('daily_rc')?.completed;
    const workoutCompleted=activity('workout')?.completed;
    const wordhuntCompleted=activity('hangman')?.completed;
    const router = useRouter();
    const capabilities = getExamCapabilities(exam);
    const primaryType = capabilities.showDailyRC ? "daily_rc" : "daily_workout";
    const viewedRef = useRef(false);
    const primaryRef = useRef(null);
    useEffect(() => {
      const element = primaryRef.current;
      if (!element || viewedRef.current || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting || viewedRef.current) return;
        viewedRef.current = true;
        captureLearningEvent("primary_cta_viewed", { activity_type: primaryType, exam });
        observer.disconnect();
      }, { threshold: 0.5 });
      observer.observe(element);
      return () => observer.disconnect();
    }, [primaryType, exam]);
  return (
    <section className="space-y-8" data-daily-ready={!daily.loading&&!daily.error} aria-busy={daily.loading}>

      {/* Section Header */}

      <div>

        <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
          🆓 Free Daily Practice
        </div>

        <h2 className="mt-4 text-3xl font-bold text-white">
          Today's Activities
        </h2>

        <p className="mt-2 max-w-2xl text-slate-400">
          Stay consistent with three free activities designed to sharpen your
          reading every single day.
        </p>

      </div>

      {daily.error&&<Recovery message={daily.error} onRetry={daily.refresh} area="daily_progress"/>}
      {/* Cards */}

      <div className="grid gap-6 lg:grid-cols-3">
       
        {capabilities.showDailyRC && (
            <>

        {/* Daily RC */}

        <div 
        id="daily-rc"
        className="group relative overflow-hidden rounded-3xl border border-white/10 border-t-4 border-t-indigo-500 bg-gradient-to-br from-slate-900 to-slate-800 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15">

            <BookOpen className="h-8 w-8 text-indigo-400" />

          </div>

          <h3 className="text-xl font-semibold text-white">
            Daily RC Challenge
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Solve a fresh CAT-level Reading Comprehension passage every day.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">

            <Clock className="h-4 w-4" />

            10-15 mins

          </div>
<Button disabled={daily.loading||!!daily.error||!activity(primaryType==="daily_rc"?"daily_rc":"workout")?.available} ref={primaryType === "daily_rc" ? primaryRef : undefined}
  onClick={() => {
    captureLearningEvent("primary_cta_clicked", { activity_type: "daily_rc", exam });
    router.push("/daily-challenge");
  }}
            className="mt-6 w-full justify-between rounded-xl bg-indigo-600 hover:bg-indigo-500"
          >
            {daily.loading ? "Loading daily status..." : daily.error ? "Status unavailable" : !activity("daily_rc")?.available ? "No challenge today" : dailyRCCompleted ? "View Analysis" : "Start Challenge"}

            <ArrowRight className="h-4 w-4" />
          </Button>



        </div>
        </>
        
        )}
        {/* Daily Workout */}

        <div 
        id="daily-workout"
        className="group relative overflow-hidden rounded-3xl border border-white/10 border-t-4 border-t-orange-500 bg-gradient-to-br from-slate-900 to-slate-800 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15">
            <Dumbbell className="h-7 w-7 text-orange-400" />
          </div>

          <h3 className="text-xl font-semibold text-white">
            Daily Workout
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Complete today's guided workout with Reading Comprehension,
            Vocabulary and Speed Drills.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>25–30 mins</span>
          </div>

          <Button disabled={daily.loading||!!daily.error||!activity("workout")?.available} ref={primaryType === "daily_workout" ? primaryRef : undefined}
            onClick={() => {
              if (primaryType === "daily_workout") captureLearningEvent("primary_cta_clicked", { activity_type: "daily_workout", exam });
              setView("workout");
            }}
           className="mt-6 w-full justify-between rounded-xl bg-orange-600 hover:bg-orange-500"
          >
            {daily.loading ? "Loading daily status..." : daily.error ? "Status unavailable" : workoutCompleted ? "Continue Workout" : "Start Workout"}

            <ArrowRight className="h-4 w-4" />
          </Button>

        </div>

        {/* Word Hunt */}

        <div 
        id="word-hunt"
        className="group relative overflow-hidden rounded-3xl border border-white/10 border-t-4 border-t-emerald-500 bg-gradient-to-br from-slate-900 to-slate-800 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
            <Puzzle className="h-7 w-7 text-emerald-400" />
          </div>

          <h3 className="text-xl font-semibold text-white">
            Word Hunt
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Strengthen your vocabulary through quick interactive word puzzles
            and daily practice.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>5 mins</span>
          </div>

          <Button disabled={daily.loading||!!daily.error||!activity("hangman")?.available}
            onClick={() => setView("hangman")}
        className="mt-6 w-full justify-between rounded-xl bg-emerald-600 hover:bg-emerald-500"
          >
            {daily.loading ? "Loading daily status..." : daily.error ? "Status unavailable" : !activity("hangman")?.available ? "No puzzle today" : wordhuntCompleted ? "Play Again" : "Play Now"}

            <ArrowRight className="h-4 w-4" />
          </Button>

        </div>

      </div>

    </section>
  );
}
