"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"



export default function InstructionsPage() {
    const router = useRouter()


  return (
    <div className="min-h-screen bg-[#071120] text-white flex items-center justify-center">
       
      <div className="max-w-3xl w-full p-10 rounded-3xl border border-cyan-500/20 bg-slate-900/60">

<Link
  href="/daily-challenge"
  className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
>
  <ArrowLeft size={18} />
  Back to Arena
</Link>


        <div className="text-cyan-300 uppercase tracking-[0.25em] font-bold">
          Daily RC Arena
        </div>

        <h1 className="text-5xl font-black mt-4">
          Before You Enter
        </h1>

       <div className="mt-8 space-y-5 text-slate-300 text-lg">

  <p>📖 1 CAT-level Reading Comprehension passage</p>

  <p>❓ Total Questions: 4</p>

  <p>⏱️ Time Limit: 8 minutes</p>

  <p>✅ Correct Answer: +3 marks</p>

  <p>❌ Incorrect Answer: -1 mark</p>

  <p>⚪ Unattempted: 0 marks</p>

  <p>🚫 No pausing once the challenge begins</p>

  <p>🏆 Leaderboard ranking depends on Score + Speed</p>

  <p>🧠 Detailed Diagnosis unlocks after submission</p>

</div>

<div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">

  <div className="text-emerald-300 font-black uppercase tracking-wider">
    Scoring System
  </div>

  <div className="grid grid-cols-3 gap-4 mt-4">

    <div className="text-center">
      <div className="text-3xl font-black text-emerald-400">
        +3
      </div>
      <div className="text-slate-300">
        Correct
      </div>
    </div>

    <div className="text-center">
      <div className="text-3xl font-black text-red-400">
        -1
      </div>
      <div className="text-slate-300">
        Incorrect
      </div>
    </div>

    <div className="text-center">
      <div className="text-3xl font-black text-cyan-300">
        0
      </div>
      <div className="text-slate-300">
        Unattempted
      </div>
    </div>

  </div>

</div>

        <Link href="/daily-challenge/test">

         <button
className="
mt-10
h-16
w-full
rounded-2xl
bg-gradient-to-r
from-violet-500
via-blue-500
to-cyan-400
text-white
font-black
text-2xl
shadow-[0_0_50px_rgba(59,130,246,0.55)]
hover:scale-105
transition-all
duration-300
flex
items-center
justify-center
shrink-0
"
>
            Start Challenge →
          </button>

        </Link>

      </div>

    </div>
  );
}