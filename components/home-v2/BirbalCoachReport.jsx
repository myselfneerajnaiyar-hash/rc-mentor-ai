"use client";

import {
  Brain,
  ClipboardList,
 
  
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";


export default function BirbalCoachReport({ data }) {

  if (!data) return null;

 const {
  coachReport = "",
  coachPlan = [],
  iq = 0,
  readerType = ""
} = data;

const report = coachReport;

const prescription = coachPlan;

 
  return (

    <section className="space-y-4">

      <div>

        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">

          <Brain className="h-4 w-4" />

          Birbal Coach

        </div>

        <h2 className="mt-3 text-2xl font-bold text-white">

          Your Personal Reading Mentor

        </h2>

        <p className="mt-2 text-slate-400 max-w-3xl">

          A personalized diagnosis of your reading habits along with a prescription
          to improve your Reading IQ.

        </p>

      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* ================= LEFT : COACH REPORT ================= */}

        <Card className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-slate-900 to-slate-950">

          <CardContent className="p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">

                <Brain className="h-6 w-6 text-violet-300" />

              </div>

              <div>

                <div className="text-lg font-bold text-white">
                  Birbal Coach Report
                </div>

                <div className="text-sm text-slate-400">
                  Generated from your recent practice
                </div>

              </div>

            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

              <div className="max-h-[420px] overflow-y-auto whitespace-pre-line pr-2 text-[15px] leading-8 text-slate-300">

                {report}

              </div>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

             <InsightCard
  title="Reader Type"
  value={readerType}
  color="text-cyan-400"
/>

<InsightCard
  title="Reading IQ"
  value={iq}
  color="text-violet-400"
/>

            </div>

          </CardContent>

        </Card>

        {/* ================= RIGHT : PRESCRIPTION ================= */}

        <Card className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-slate-950">

          <CardContent className="p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">

                <ClipboardList className="h-6 w-6 text-cyan-300" />

              </div>

              <div>

                <div className="text-lg font-bold text-white">

                  Prescription

                </div>

                <div className="text-sm text-slate-400">

                  Your improvement roadmap

                </div>

              </div>

            </div>

            <div className="mt-6 space-y-4">

              {prescription.map((item, index) => (

                <PrescriptionCard
                  key={index}
                  item={item}
                />

              ))}

            </div>

           

              
              </CardContent>
              </Card>
          

          


      </div>
      </section>
  );
}

/* ================= INSIGHT CARD ================= */

function InsightCard({ title, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

      <div className="text-xs uppercase tracking-wider text-slate-500">
        {title}
      </div>

      <div className={`mt-2 text-xl font-bold ${color}`}>
        {value}
      </div>

    </div>
  );
}

/* ================= PRESCRIPTION CARD ================= */

function PrescriptionCard({ item }) {

  const colors = {
    High: "border-red-500/20 bg-red-500/5 text-red-400",
    Medium: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
    Low: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",
  };

  return (

    <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">

      <div className="flex items-center justify-between">

        <div className="font-semibold text-white">

          {item.title}

        </div>

        <span
          className={`rounded-full border px-2 py-1 text-[10px] uppercase font-semibold ${colors[item.priority]}`}
        >
          {item.priority}
        </span>

      </div>

      <p className="mt-3 text-sm leading-6 text-slate-400">

        {item.reason}

      </p>

    </div>

  );

}
 