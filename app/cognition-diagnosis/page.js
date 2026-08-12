"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  Target,
  Skull,
  TrendingUp,
  ShieldAlert,
  Sparkles
} from "lucide-react";

export default function CognitionDiagnosisPage() {

  const [rcSet, setRcSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function loadData() {

    const user =
  await supabase.auth.getUser();

const { data: latestAttempt } =
  await supabase
    .from("daily_rc_attempts")
    .select("*")
    .eq(
      "user_id",
      user.data.user.id
    )
    .order("completed_at", {
      ascending: false,
    })
    .limit(1)
    .single();

if (!latestAttempt) {
  setLoading(false);
  return;
}

const { data } =
  await supabase
    .from("daily_rc_sets")
    .select("*")
    .eq(
      "id",
      latestAttempt.daily_rc_set_id
    )
    .single();

setRcSet(data);

      const { data: questionData } =
        await supabase
          .from("daily_rc_questions")
          .select("*")
          .eq(
            "daily_rc_set_id",
            data.id
          )
          .order("order_no");

      setQuestions(questionData || []);

     

     

      if (latestAttempt) {

        const { data: attemptRows } =
          await supabase
            .from(
              "daily_rc_question_attempts"
            )
            .select("*")
            .eq(
              "attempt_id",
              latestAttempt.id
            );

        setAttempts(
          attemptRows || []
        );
      }

      setLoading(false);
    }

    loadData();

  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071120] text-white flex items-center justify-center">
        Loading Diagnosis...
      </div>
    );
  }

  const wrongQuestions =
    questions.filter((question) => {

      const attempt =
        attempts.find(
          a =>
            a.question_id === question.id
        );

      return (
        attempt &&
        !attempt.is_correct
      );

    });

    console.log("QUESTIONS", questions);
console.log("ATTEMPTS", attempts);
console.log("WRONG QUESTIONS", wrongQuestions);
console.log(
  "WRONG COUNT",
  wrongQuestions.length
);

wrongQuestions.forEach((q, index) => {
  console.log(
    "QUESTION",
    index + 1,
    q.question_enrichment
  );
});

  const firstWrong =
    wrongQuestions[0];

  const diagnosis =
    firstWrong?.question_enrichment
      ?.cognitiveErrorTested ||
    "No major cognitive error detected";

  const trap =
    firstWrong?.question_enrichment
      ?.trapType ||
    "No major trap";

  const whyFail =
    firstWrong?.question_enrichment
      ?.whyStudentsFail ||
    "No major issue detected.";

  const topperThinking =
    firstWrong?.question_enrichment
      ?.idealThinkingProcess ||
    "Think about the author's purpose before selecting an option.";

  const mission =
    firstWrong?.question_enrichment
      ?.primarySkill ||
    "RC Accuracy";

  return (
    <main className="min-h-screen bg-[#071120] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><Link href="/daily-challenge/result" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} />Results</Link><h1 className="mt-3 text-3xl font-black sm:text-4xl">Cognitive Diagnosis</h1><p className="mt-2 text-sm text-slate-400">Understand the pattern behind your decisions and what to do next.</p></div>
          <div className="flex items-center gap-3"><Link href="/detailed-review" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Detailed Review →</Link><Link href="/" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Dashboard</Link></div>
        </header>

        <section className="mt-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-slate-900/50 p-5 sm:p-6">
          <div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10"><Brain size={20} className="text-purple-300" /></div><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">Birbal&apos;s Verdict</p><h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{diagnosis}</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{whyFail}</p></div></div>
        </section>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <DiagnosisBlock label="Your Pattern" title="Today&apos;s Villain" value={trap} tone="red" icon={Skull} />
          <DiagnosisBlock label="Why It Happened" title="How It Attacks" value={firstWrong?.question_enrichment?.whyThisTrapWorks || whyFail} tone="amber" icon={ShieldAlert} />
          <DiagnosisBlock label="Under Time Pressure" title="Where judgment slips" value={firstWrong?.question_enrichment?.timePressureDanger || whyFail} tone="amber" icon={TrendingUp} />
          <DiagnosisBlock label="What a Topper Would Do" title="Better thinking process" value={topperThinking} tone="purple" icon={Sparkles} />
          <DiagnosisBlock label="Birbal&apos;s Lesson" title="What to remember" value={firstWrong?.question_enrichment?.skillExplanation || topperThinking} tone="cyan" icon={Brain} />
          <DiagnosisBlock label="Your Next Mission" title={mission} value="Apply this skill deliberately in your next RC attempt." tone="green" icon={Target} />
        </div>

        {wrongQuestions.length > 0 && <section className="mt-6">
          <div className="flex items-center gap-2"><ShieldAlert size={18} className="text-amber-300" /><h2 className="text-lg font-bold">Wrong Question Replay</h2><span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-300">{wrongQuestions.length}</span></div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {wrongQuestions.map((question) => { const enrich = question.question_enrichment || {}; return <article key={question.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-wide text-cyan-300">Question {enrich.questionNumber}</p><span className="truncate text-xs text-red-300">{enrich.trapType}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{enrich.whyStudentsFail}</p>{enrich.topperShortcut && <div className="mt-3 border-l-2 border-emerald-400/50 pl-3"><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-300">Topper Shortcut</p><p className="mt-1 text-xs leading-5 text-slate-300">{enrich.topperShortcut}</p></div>}</article>; })}
          </div>
        </section>}
      </div>
    </main>
  );
}

function DiagnosisBlock({ label, title, value, tone, icon: Icon }) {
  const tones = { red: "text-red-300 border-red-500/15", amber: "text-amber-300 border-amber-500/15", purple: "text-purple-300 border-purple-500/15", cyan: "text-cyan-300 border-cyan-500/15", green: "text-emerald-300 border-emerald-500/15" };
  return <section className={`rounded-xl border bg-slate-900/50 p-4 ${tones[tone]}`}><div className="flex items-center gap-2"><Icon size={15} aria-hidden="true" /><p className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</p></div><h3 className="mt-2 text-base font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{value}</p></section>;
}
