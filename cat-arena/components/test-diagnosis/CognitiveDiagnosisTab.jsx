"use client";

export default function CognitiveDiagnosisTab(props) {

  const diagnosis =
    props?.attempt?.analysis?.cognitiveDiagnosis;

  if (!diagnosis) {
    return (
      <div className="p-8">
        No cognitive diagnosis found
      </div>
    );
  }

  const {
    cognitiveSignature,
    signatureExplanation,
    leaks = [],
    trapMap = [],
    mentalProcess = [],
    studentProcess = [],
    idealProcess = [],
    rewiringPlan = [],
  } = diagnosis;
  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div>
        <h1 className="text-5xl font-black">
          Cognitive Diagnosis
        </h1>

        <p className="text-slate-400 mt-3 text-lg">
          Understand how this test was mentally processed.
        </p>
        <div className="grid md:grid-cols-4 gap-4 mt-8">

  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
    <div className="text-slate-400 text-sm">
      Cognitive Leaks
    </div>

    <div className="text-3xl font-black mt-2">
      {leaks.length}
    </div>
  </div>

  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
    <div className="text-slate-400 text-sm">
      Trap Types
    </div>

    <div className="text-3xl font-black mt-2">
      {trapMap.length}
    </div>
  </div>

  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
    <div className="text-slate-400 text-sm">
      Mental Steps
    </div>

    <div className="text-3xl font-black mt-2">
      {mentalProcess.length}
    </div>
  </div>

  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
    <div className="text-slate-400 text-sm">
      Rewiring Tasks
    </div>

    <div className="text-3xl font-black mt-2">
      {rewiringPlan.length}
    </div>
  </div>

</div>
      </div>

      {/* COGNITIVE SIGNATURE */}

      <div className="rounded-3xl border border-indigo-900 bg-gradient-to-br from-indigo-950/40 to-slate-900 p-8">

        <div className="text-indigo-400 uppercase tracking-widest text-sm">
          Cognitive Signature Of This Attempt
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30">

  <div className="h-2 w-2 rounded-full bg-indigo-400" />
  <div className="flex flex-wrap gap-3 mt-4">

  {leaks.slice(0,4).map((leak,index)=>{

    const color =
      leak.severity === "High"
        ? "bg-red-500/20 text-red-300 border-red-500/30"
        : leak.severity === "Medium"
        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";

    return (
      <div
        key={index}
        className={`px-4 py-2 rounded-full border font-semibold ${color}`}
      >
        {leak.title}
      </div>
    );
  })}

</div>

  <span className="text-indigo-300 font-semibold">
    Reader DNA
  </span>

</div>

<h2 className="text-xl font-bold mt-5 text-cyan-400 leading-relaxed">
  {cognitiveSignature}
</h2>

        <p className="mt-5 text-slate-300 leading-8 text-lg">
          {signatureExplanation}
        </p>

      </div>

      {/* BIGGEST LEAKS */}

      <div>

        <h3 className="text-3xl font-black mb-6">
          Biggest Cognitive Leaks
        </h3>

       <div className="grid lg:grid-cols-3 gap-5">

  {leaks.map((leak, index) => {

    const color =
      leak.severity === "High"
        ? "text-red-400"
        : leak.severity === "Medium"
        ? "text-amber-400"
        : "text-cyan-400";

    return (
  <div
    key={index}
    className={`
      rounded-3xl p-6 border

      ${
        leak.severity === "High"
          ? "bg-red-950/20 border-red-900"
          : leak.severity === "Medium"
          ? "bg-amber-950/20 border-amber-900"
          : "bg-cyan-950/20 border-cyan-900"
      }
    `}
  >
        <div className={`${color} font-bold`}>
          {leak.severity} Severity
        </div>

        <h4 className="text-xl font-bold mt-3">
          {leak.title}
        </h4>

        <p className="text-slate-400 mt-4 leading-7">
          {leak.reason}
        </p>
      </div>
    );
  })}

</div>
</div>

<div className="mb-8">

  <div className="text-slate-400 text-sm uppercase">
    Biggest Score Killers
  </div>

  <div className="mt-4 space-y-3">

    {trapMap.slice(0,3).map((trap,index)=>(
      <div
        key={index}
        className="flex justify-between bg-slate-800 rounded-xl p-4"
      >
        <span>
          #{index + 1} {trap.trap}
        </span>

        <span className="text-red-400">
          ~{Math.round(trap.percentage/5)} Marks
        </span>
      </div>
    ))}

  </div>

</div>

      {/* TRAP MAP */}

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">

        <div className="text-cyan-400 uppercase tracking-widest text-sm">
          Trap Attraction Map
        </div>

        <h3 className="text-3xl font-black mt-3">
          What Traps Worked In This Test
        </h3>

       <div className="space-y-6 mt-8">

  {trapMap.map((trap, index) => {

    const colors = [
      "bg-red-500",
      "bg-amber-500",
      "bg-cyan-500",
      "bg-emerald-500",
      "bg-indigo-500",
    ];

    return (
      <div key={index}>

        <div className="flex justify-between mb-2">
          <span>{trap.trap}</span>
          <span>{trap.percentage}%</span>
        </div>

        <div className="h-3 rounded-full bg-slate-800">

          <div
            className={`h-3 rounded-full ${colors[index % colors.length]}`}
            style={{
              width: `${trap.percentage}%`,
            }}
          />

        </div>

      </div>
    );
  })}

</div>
</div>

      {/* THINKING BREAKDOWN */}

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">

        <div className="text-indigo-400 uppercase tracking-widest text-sm">
          Thinking Breakdown
        </div>

        <h3 className="text-3xl font-black mt-3">
          What Happened Mentally
        </h3>

       <div className="mt-8 space-y-5">

  {mentalProcess.map((step, index) => (
    <div
      key={index}
      className="rounded-2xl bg-slate-800 p-5"
    >
      <div className="flex gap-4 items-start">

  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">

    {index + 1}

  </div>

  <div className="flex-1">
    {step}
  </div>

</div>
    </div>
  ))}

</div>
</div>

<div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">

  <div className="text-cyan-400 uppercase text-sm">
    Cognitive Stability
  </div>

  <h3 className="text-3xl font-black mt-3">
    Brain Heatmap
  </h3>

  <div className="space-y-4 mt-8">

    {trapMap.slice(0,5).map((item,index)=>(

      <div key={index}>

        <div className="flex justify-between mb-2">
          <span>{item.trap}</span>
          <span>{100-item.percentage}</span>
        </div>

        <div className="h-2 bg-slate-800 rounded-full">

          <div
            className="h-2 bg-emerald-500 rounded-full"
            style={{
              width:`${100-item.percentage}%`
            }}
          />

        </div>

      </div>

    ))}

  </div>

</div>

      {/* TOPPER COMPARISON */}

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="rounded-3xl border border-red-900 bg-red-950/20 p-8">

          <div className="text-red-400 uppercase tracking-widest text-sm">
            Your Process
          </div>

         <ul className="space-y-4 mt-6 text-slate-300">

  {studentProcess.map(
    (item, index) => (
      <li key={index}>
        • {item}
      </li>
    )
  )}

</ul>

        </div>

        <div className="rounded-3xl border border-emerald-900 bg-emerald-950/20 p-8">

          <div className="text-emerald-400 uppercase tracking-widest text-sm">
            Ideal Solver Process
          </div>

         <ul className="space-y-4 mt-6 text-slate-300">

  {idealProcess.map(
    (item, index) => (
      <li key={index}>
        • {item}
      </li>
    )
  )}

</ul>

        </div>

      </div>

      {/* REWIRING PLAN */}

      <div className="rounded-3xl border border-emerald-900 bg-emerald-950/20 p-8">

        <div className="text-emerald-400 uppercase tracking-widest text-sm">
          What To Change Next Time
        </div>

        <h3 className="text-3xl font-black mt-3">
          Birbal's Rewiring Plan
        </h3>

      <div className="mt-6 space-y-4 text-slate-300">

  {rewiringPlan.map(
    (item, index) => (
      <div key={index}>
        <div className="flex gap-3 items-start">

  <div className="text-emerald-400 text-xl">
    ✓
  </div>

  <div className="flex-1">
    {item}
  </div>

</div>
      </div>
    )
  )}

</div>

      </div>

    </div>
  );
}