"use client";

export default function MentorVerdictTab({
    attempt,
}) {

  const verdict =
  attempt?.analysis?.mentorVerdict || {};
    return (
        <div>

            <h1 className="text-5xl font-black">
                Mentor Verdict
            </h1>

            <div className="mt-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-900/40 to-slate-900 p-8">

                <div className="text-slate-400 uppercase tracking-widest text-sm">
                    Overall Assessment
                </div>

               <h2 className="text-3xl font-black mt-2">
  {verdict.assessmentTitle}
</h2>

<p className="text-slate-400 mt-4 max-w-4xl">
  {verdict.assessmentSummary}
</p>

                <div className="mt-8 flex gap-10">

                    <div>
                        <div className="text-slate-500 text-sm">
                            Correct Out of Total
                        </div>

                        <div className="text-6xl font-black">
                            {attempt.correct}/{attempt.total}
                        </div>
                    </div>

                    <div>
                        <div className="text-slate-500 text-sm">
                            Accuracy
                        </div>

                        <div className="text-6xl font-black text-indigo-400">
  {attempt.accuracy || 0}%
</div>
                    </div>

                </div>
            </div>

            <div className="mt-6 rounded-3xl border border-amber-800 bg-gradient-to-r from-amber-950/40 to-slate-900 p-8">

  <div className="text-amber-400 uppercase tracking-widest text-sm">
    Marks Left On The Table
  </div>

  <div className="grid md:grid-cols-3 gap-6 mt-6">

    <div>
      <div className="text-slate-400 text-sm">
        Actual Score
      </div>

      <div className="text-5xl font-black">
  {verdict.actualScore}
</div>
    </div>

    <div>
      <div className="text-slate-400 text-sm">
        Birbal Score
      </div>

      <div className="text-5xl font-black text-emerald-400">
  {verdict.birbalScore}
</div>
    </div>

    <div>
      <div className="text-slate-400 text-sm">
        Opportunity
      </div>

      <div className="text-5xl font-black text-amber-400">
  +{(verdict.birbalScore || 0) -
    (verdict.actualScore || 0)}
</div>
    </div>

  </div>

</div>

            <div className="grid md:grid-cols-4 gap-4 mt-8">

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-sm">
                        Accuracy
                    </div>
                    <div className="text-3xl font-bold mt-2">
                        {attempt.accuracy}%
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-sm">
                        Avg Time
                    </div>
                    <div className="text-3xl font-bold mt-2">
                        {attempt.analysis?.timeStats?.average || 0}s
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-sm">
                        Strongest Skill
                    </div>
                    <div className="text-xl font-bold mt-2">
                       {attempt.analysis?.strongestArea?.type ||
  "N/A"}
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-sm">
                        Weakest Skill
                    </div>
                    <div className="text-xl font-bold mt-2 text-red-400">
                        {attempt.analysis?.weakestArea?.type ||
  "N/A"}
                    </div>
                </div>
                </div>

               {/* ========================================= */}
{/* BIRBAL OPENING */}
{/* ========================================= */}

<div className="mt-8 rounded-3xl border border-indigo-900 bg-gradient-to-br from-indigo-950/40 to-slate-900 p-10">

  <div className="text-indigo-400 uppercase tracking-widest text-sm">
    Birbal's Opening Statement
  </div>

  <h2 className="text-4xl font-black mt-3">
  {verdict.headline}
</h2>

  <p className="mt-6 text-xl leading-10 text-slate-300 max-w-5xl">
  {verdict.openingStatement}
</p>

</div>


{/* ========================================= */}
{/* WHAT HAPPENED VS WHAT SHOULD HAPPEN */}
{/* ========================================= */}

<div className="grid lg:grid-cols-2 gap-6 mt-8">

  <div className="rounded-3xl bg-red-950/20 border border-red-900 p-8">

    <div className="text-red-400 uppercase text-sm tracking-widest">
      Actual Attempt
    </div>

    <h3 className="text-3xl font-black mt-2">
      What Actually Happened
    </h3>

   <div className="mt-8 space-y-6">

 {(verdict.actualAttempt || []).map(
  (item, index) => (

    <div
      key={index}
      className="rounded-2xl bg-black/20 p-5"
    >
      <div className="font-bold text-lg">
        {item.title}
      </div>

      <div className="text-slate-400 mt-2">
        {item.reason}
      </div>
    </div>

  )
)}

</div>
</div>


  <div className="rounded-3xl bg-emerald-950/20 border border-emerald-900 p-8">

    <div className="text-emerald-400 uppercase text-sm tracking-widest">
      Ideal Attempt
    </div>

    <h3 className="text-3xl font-black mt-2">
      How Birbal Would Attempt It
    </h3>

   <div className="mt-8 space-y-6">

 {(verdict.idealAttempt || []).map(
  (item, index) => (

    <div
      key={index}
      className="rounded-2xl bg-black/20 p-5"
    >
      <div className="font-bold text-lg">
        {item.title}
      </div>

      <div className="text-slate-400 mt-2">
        {item.reason}
      </div>
    </div>

  )
)}

</div>
</div>
</div>


{/* ========================================= */}
{/* TURNING POINT */}
{/* ========================================= */}

<div className="mt-8 rounded-3xl border border-amber-900 bg-amber-950/20 p-8">

  <div className="text-amber-400 uppercase tracking-widest text-sm">
    Biggest Turning Point
  </div>

  <h3 className="text-3xl font-black mt-2">
  {verdict.turningPoint?.title}
  </h3>

 <p className="mt-6 text-lg leading-9 text-slate-300">
  {verdict.turningPoint?.explanation}
</p>
</div>


{/* ========================================= */}
{/* SCORE POTENTIAL */}
{/* ========================================= */}

<div className="grid md:grid-cols-3 gap-6 mt-8">

  <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
    <div className="text-slate-400">
      Actual Score
    </div>

    <div className="text-6xl font-black mt-3">
      {verdict.actualScore}
    </div>
  </div>

  <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
    <div className="text-emerald-400">
      Expected Score
    </div>

    <div className="text-6xl font-black mt-3 text-emerald-400">
    {verdict.expectedScore}
    </div>
  </div>

  <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
    <div className="text-cyan-400">
      Birbal Score
    </div>

    <div className="text-6xl font-black mt-3 text-cyan-400">
      {verdict.birbalScore}
    </div>
  </div>

</div>


{/* ========================================= */}
{/* FINAL ADVICE */}
{/* ========================================= */}

<div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">

  <div className="text-cyan-400 uppercase tracking-widest text-sm">
    Final Advice
  </div>

 <p className="mt-6 text-xl leading-10 text-slate-300">
  {verdict.finalAdvice}
</p>

</div>

                {/* NEXT FOCUS */}

                <div className="mt-6 rounded-3xl border border-emerald-900 bg-emerald-950/20 p-8">

                    <h3 className="text-2xl font-black text-emerald-400">
                        Next Focus
                    </h3>

                   <div className="flex flex-wrap gap-3 mt-5">

  {(verdict.focusAreas || []).map(
    (item, index) => (

      <div
        key={index}
        className="
        px-4 py-2
        rounded-full
        bg-cyan-500/20
        text-cyan-300
        "
      >
        {item}
      </div>

    )
  )}

</div>

                </div>
            </div>
            );
}