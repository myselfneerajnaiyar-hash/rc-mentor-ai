"use client";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PreviewNavbar from "@/components/PreviewNavbar";
import PreviewFooter from "@/components/PreviewFooter";

import "swiper/css";

import {
  ArrowRight,
  Brain,
  Eye,
  LineChart,
  Lock,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

export default function PreviewPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("workout");
  const activities = [
  "Aditi just enrolled",
  "Akash completed a Daily RC Workout",
  "Ritu improved Inference Accuracy",
  "Hemang joined 5 mins ago",
  "Sneha completed Tone Detection Drill",
  "Raghav unlocked Birbal AI",
  "Priya solved 2 RC passages",
  "Arjun increased RC IQ by 9 points",
];

const [activityIndex, setActivityIndex] = useState(0);


  const [mousePosition, setMousePosition] = useState({
  x: 0,
  y: 0,
});

useEffect(() => {
  const handleMouseMove = (e) => {
    setMousePosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  window.addEventListener("mousemove", handleMouseMove);

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
  };
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    setActivityIndex((prev) => (prev + 1) % activities.length);
  }, 3500);

  return () => clearInterval(interval);
}, []);


  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
     <PreviewNavbar/>
        

      {/* ================= BACKGROUND ================= */}
      {/* ================= BACKGROUND ================= */}
<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_top,#0f172a,#050816_60%)]">
  {/* PARTICLES */}
  {[...Array(40)].map((_, i) => (
    <div
      key={i}
      className="absolute rounded-full bg-cyan-400"
      style={{
        width: `${Math.random() * 5 + 2}px`,
        height: `${Math.random() * 5 + 2}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        opacity: 0.4,
        filter: "blur(1px)",
        animation: `floatParticle ${8 + Math.random() * 8}s linear infinite`,
        animationDelay: `${Math.random() * 5}s`,
      }}
    />
  ))}

  <motion.div
  className="pointer-events-none fixed z-0 h-[420px] w-[420px] rounded-full bg-cyan-400/25 blur-[90px]"
  animate={{
    x: mousePosition.x - 175,
    y: mousePosition.y - 175,
  }}
  transition={{
    type: "tween",
    ease: "linear",
    duration: 0.05,
  }}
/>

  {/* BLUE GLOW */}
  <div className="absolute left-[10%] top-[-10%] h-[700px] w-[700px] rounded-full bg-blue-500/10 blur-[180px]" />

  {/* CYAN GLOW */}
  <div className="absolute bottom-[-20%] right-[5%] h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[200px]" />

  {/* PURPLE GLOW */}
  <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-[180px]" />

</div>

     

      {/* ================= HERO ================= */}
      <motion.section
 initial={{ opacity: 0, y: 60 }}
whileInView={{
  opacity: 1,
  y: 0,
}}
transition={{
  duration: 0.7,
  ease: "easeOut",
}}
  viewport={{ once: true, amount: 0.2 }}
  className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 px-6 pb-24 pt-36 md:grid-cols-2 xl:gap-28"
>

        {/* LEFT */}
        <div>

          {/* BADGE */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/10 bg-blue-500/5 px-4 py-2 text-sm text-blue-200">

            <Sparkles size={15} />

            AI Powered Reading Intelligence

          </div>

          {/* HEADING */}
          <h1 className="max-w-2xl text-5xl font-black leading-[1] tracking-[-0.04em] text-white md:text-6xl">

            Train your
            <br />

            reading intelligence.

          </h1>

          {/* SUBTEXT */}
          <p className="mt-8 max-w-xl text-lg leading-8 text-white/50">

            Adaptive RC drills, inference training, tone analysis and
            AI-guided diagnosis built for serious aspirants.

          </p>

          {/* BUTTONS */}
          <div className="mt-12 flex flex-wrap items-center gap-4">

            <button 
             onClick={() => router.push("/login")}
            className="group flex items-center gap-2 rounded-2xl bg-orange-500 px-8 py-4 font-semibold text-white transition hover:bg-orange-600 hover:scale-[1.02]">

  <span>Start Free 3 Day Trial</span>

  <ArrowRight
    size={18}
    className="text-white transition group-hover:translate-x-1"
  />

</button>

            <button 
             onClick={() => router.push("/login")}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-4 font-medium text-white/80 transition hover:bg-white/[0.06]">
              Login
            </button>

          </div>

          {/* FREE PREVIEW TEXT */}
          

          {/* FEATURES */}
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/45">

            <div className="flex items-center gap-2">
              <Brain size={16} />
              Adaptive RC
            </div>

            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              AI Mentor
            </div>

            <div className="flex items-center gap-2">
              <LineChart size={16} />
              Performance Analytics
            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="relative overflow-hidden">

          {/* GLOW */}
          <div className="absolute -inset-10 rounded-full bg-blue-500/10 blur-3xl" />

          {/* MAIN CARD */}
         <div className="relative overflow-hidden rounded-[32px] bg-[#0B1120] shadow-[0_0_80px_rgba(59,130,246,0.12)] backdrop-blur-xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-blue-500/10 px-6 py-5">

              <div>

                <p className="text-sm text-white/40">
                  Performance Trend
                </p>

                <h3 className="mt-1 text-lg font-semibold text-white">
                  Reading Intelligence
                </h3>

              </div>

              <div className="rounded-full border border-emerald-500/10 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Live Analytics
              </div>

            </div>

            {/* IMAGE */}
            <div className="p-5">

              <img
                src="/analytics-preview.png"
                alt="Analytics"
                className="h-auto w-full rounded-2xl object-contain"
              />

            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-4 bg-[#0F172A] px-6 py-5">

              <div>

                <p className="text-xs text-white/35">
                  Inference Stability
                </p>

                <div className="mt-2 text-2xl font-bold text-white">
                  82%
                </div>

              </div>

              <div>

                <p className="text-xs text-white/35">
                  Growth Projection
                </p>

                <div className="mt-2 text-2xl font-bold text-amber-300">
  +27%
</div>
              </div>

              <div>

                <p className="text-xs text-white/35">
                  RC IQ
                </p>

                <div className="mt-2 text-2xl font-bold text-cyan-300">
                  128
                </div>

              </div>

            </div>

          </div>

        </div>

      </motion.section>

     {/* ================= READING INTELLIGENCE ================= */}
<motion.section
 initial={{ opacity: 0, y: 60 }}
whileInView={{
  opacity: 1,
  y: 0,
}}
transition={{
  duration: 0.7,
  ease: "easeOut",
}}
  viewport={{ once: true, amount: 0.2 }}
  className="relative isolate z-10 py-28"
>
  <div className="mx-auto max-w-7xl px-6">

    {/* HEADER */}
    <div className="max-w-3xl">

      <div className="mb-5 inline-flex rounded-full border border-cyan-500/10 bg-cyan-500/[0.04] px-4 py-2 text-sm text-cyan-200">
        Reading Intelligence Profile
      </div>

      <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">

        Your RC performance
        <br />

        is cognitive behaviour.

      </h2>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">

        Auctor tracks how you infer, eliminate traps, process tone and maintain comprehension under pressure.

      </p>

    </div>

    {/* METRIC CARDS */}
    <div className="mt-16 grid gap-8 lg:grid-cols-3">

      {/* CARD 1 */}
      <div className="rounded-[30px] border border-cyan-400/20 bg-slate-900/80 p-8 backdrop-blur-xl">

        <div className="flex items-center justify-between">

          <div>

            <div className="text-sm text-cyan-300">
              Inference Accuracy
            </div>

            <div className="mt-3 text-5xl font-black text-white">
              76%
            </div>

          </div>

          <Eye className="text-cyan-300" size={32} />

        </div>

        <div className="mt-8 h-2 rounded-full bg-white/10">

          <div className="h-full w-[76%] rounded-full bg-cyan-400" />

        </div>

        <p className="mt-6 text-sm leading-7 text-slate-400">

          Tracks logical inference consistency across RC sets.

        </p>

      </div>

      {/* CARD 2 */}
      <div className="rounded-[30px] border border-violet-400/20 bg-slate-900/80 p-8 backdrop-blur-xl">

        <div className="flex items-center justify-between">

          <div>

            <div className="text-sm text-violet-300">
              Tone Detection
            </div>

            <div className="mt-3 text-5xl font-black text-white">
              91%
            </div>

          </div>

          <Target className="text-violet-300" size={32} />

        </div>

        <div className="mt-8 h-2 rounded-full bg-white/10">

          <div className="h-full w-[91%] rounded-full bg-violet-400" />

        </div>

        <p className="mt-6 text-sm leading-7 text-slate-400">

          Measures your ability to identify author intent and tonal nuance.

        </p>

      </div>

      {/* CARD 3 */}
      <div className="rounded-[30px] border border-amber-400/20 bg-slate-900/80 p-8 backdrop-blur-xl">

        <div className="flex items-center justify-between">

          <div>

            <div className="text-sm text-amber-300">
              Trap Resistance
            </div>

            <div className="mt-3 text-5xl font-black text-white">
              63%
            </div>

          </div>

          <Zap className="text-amber-300" size={32} />

        </div>

        <div className="mt-8 h-2 rounded-full bg-white/10">

          <div className="h-full w-[63%] rounded-full bg-amber-400" />

        </div>

        <p className="mt-6 text-sm leading-7 text-slate-400">

          Detects vulnerability to extreme options and abstraction traps.

        </p>

      </div>

    </div>

 {/* AI INSIGHT PANEL */}

{/* AI INSIGHT PANEL */}

<div className="mt-24 grid md:grid-cols-2 gap-16 items-center">

  {/* LEFT CONTENT */}
  <div>

    <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 mb-6">
      Birbal AI Insight
    </div>

    <h3 className="text-4xl font-bold leading-tight text-white mb-6">

      Your cognition profile shows strong comprehension ability,
      but moderate elimination instability.

    </h3>

    <p className="text-lg leading-9 text-slate-400 mb-10">

      Auctor predicts significant percentile improvement after focused inference correction and trap resistance training.

    </p>

    {/* STATS */}
    <div className="flex flex-wrap gap-4">

      <div className="rounded-2xl bg-cyan-500/10 px-5 py-3 text-cyan-200 border border-cyan-400/10">
        RC IQ: 128
      </div>

      <div className="rounded-2xl bg-emerald-500/10 px-5 py-3 text-emerald-200 border border-emerald-400/10">
        +14 this week
      </div>

      <div className="rounded-2xl bg-orange-500/10 px-5 py-3 text-orange-200 border border-orange-400/10">
        Predicted Growth: +18 percentile
      </div>

    </div>

  </div>

  {/* RIGHT IMAGE */}
  <div className="relative overflow-hidden">

    <div className="absolute -inset-10 bg-cyan-500/20 blur-3xl opacity-30"></div>

    <img
      src="/birbal.png"
      alt="Birbal AI"
      className="relative w-[280px] md:w-[340px] mx-auto"
    />

  </div>
</div>
</div>
</motion.section>


{/* ================= WHY NORMAL RC FAILS ================= */}
<motion.section
  initial={{ opacity: 0, y: 140, scale: 0.92 }}
  whileInView={{
    opacity: 1,
    y: 0,
    scale: 1,
  }}
  transition={{
    duration: 1.1,
    ease: "easeOut",
  }}
  viewport={{ once: true, amount: 0.2 }}
  className="pb-32"
>
  <div className="mx-auto max-w-7xl px-6">

    {/* HEADER */}
    <div className="max-w-3xl mt-10">

      <div className="mt-10 inline-flex rounded-full border border-red-500/10 bg-red-500/[0.04] px-4 py-2 text-sm text-red-200">
        Why Most RC Practice Fails
      </div>

      <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">

        Most RC practice improves familiarity.
        <br />

        Not reading intelligence.

      </h2>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">

        Solving hundreds of passages is useless if you never understand
        why your reasoning breaks.

      </p>

    </div>

    {/* COMPARISON */}
   <div className="mt-20 grid gap-8 md:grid-cols-2">

      {/* LEFT */}
      <div className="h-full rounded-[32px] border border-red-500/10 bg-slate-900/80 p-10 backdrop-blur-xl">

        <div className="mb-8 flex items-center gap-3">

          <div className="h-3 w-3 rounded-full bg-red-400"></div>

          <h3 className="text-2xl font-bold text-white">
            Traditional RC Practice
          </h3>

        </div>

        <div className="space-y-6">

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-white/60">
            Random passages without diagnosis
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-white/60">
            No inference analysis
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-white/60">
            No trap detection
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-white/60">
            Same difficulty for everyone
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-white/60">
            Mock scores without cognitive feedback
          </div>

        </div>

      </div>

      {/* RIGHT */}
      <div className="relative h-full overflow-hidden rounded-[32px] border border-cyan-400/20 bg-slate-900/90 p-10 backdrop-blur-xl">

        {/* GLOW */}
        <div className="absolute inset-0 bg-cyan-500/5"></div>

        <div className="relative z-10">

          <div className="mb-8 flex items-center gap-3">

            <div className="h-3 w-3 rounded-full bg-cyan-400"></div>

            <h3 className="text-2xl font-bold text-white">
              Auctor Reading Intelligence
            </h3>

          </div>

          <div className="space-y-6">

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-500/10 p-5 text-cyan-100">
              Adaptive passage difficulty
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-500/10 p-5 text-cyan-100">
              Birbal AI reasoning analysis
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-500/10 p-5 text-cyan-100">
              Trap & elimination diagnosis
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-500/10 p-5 text-cyan-100">
              Reading cognition profiling
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-500/10 p-5 text-cyan-100">
              Personalized RC improvement
            </div>

          </div>

        </div>

      </div>

    </div>

    {/* BOTTOM LINE */}
    <div className="mt-16 rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-8 py-6 text-center">

      <p className="text-lg leading-8 text-white/70">

        Auctor trains the cognitive skills behind RC performance —
        not just passage familiarity.

      </p>

    </div>

  </div>
</motion.section>

   {/* ================= WHO IS AUCTOR FOR ================= */}
<motion.section
 initial={{ opacity: 0, y: 60 }}
whileInView={{
  opacity: 1,
  y: 0,
}}
transition={{
  duration: 0.7,
  ease: "easeOut",
}}
  viewport={{ once: true, amount: 0.2 }}
   className="relative isolate z-10 py-28"
>
  <div className="mx-auto max-w-7xl px-6">

    {/* HEADER */}
    <div className="max-w-3xl">

      <div className="mt-10 inline-flex rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/50">
        Who Is Auctor RC For?
      </div>

      <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">

        Every aspirant
        <br />

        struggles differently.

      </h2>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">

        Auctor identifies your exact RC weakness and trains the cognitive skills required to improve it.

      </p>

    </div>

    {/* CARDS */}
    <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-3">

      {/* CARD 1 */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[32px] bg-slate-800 border border-slate-700 p-8 min-h-[620px] flex flex-col shadow-2xl transition-all duration-300 hover:border-cyan-400/40 hover:-translate-y-2"
      >

        <div className="absolute inset-0 bg-cyan-500/10" />

        {/* IMAGE */}
       <div className="relative isolate z-10 h-64 overflow-hidden rounded-2xl">
  <img
    src="/student4.jpeg"
    className="h-full w-full object-cover"
  />
</div>

        {/* CONTENT */}
        <div className="relative isolate z-10 mt-8">

          <h3 className="text-3xl font-bold tracking-tight text-white">
            The Accuracy Plateau
          </h3>

          <p className="mt-5 text-[15px] leading-8 text-slate-400">

            Stuck between 70–85 percentile despite solving hundreds of RC passages.

          </p>

        </div>

        {/* INSIGHT */}
        <div className="relative z-10 mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5">

          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Birbal Insight
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-200">

            Birbal identifies hidden elimination mistakes and weak inference chains.

          </p>

        </div>

        {/* BUTTON */}
        <div className="relative z-10 mt-8">

      <button className="w-full rounded-2xl bg-emerald-500 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-400">

  Break The Plateau

</button>

        </div>

      </motion.div>

      {/* CARD 2 */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[32px] bg-slate-800 border border-slate-700 p-8 min-h-[620px] flex flex-col shadow-2xl transition-all duration-300 hover:border-violet-400/40 hover:-translate-y-2"
      >

        <div className="absolute inset-0 bg-violet-500/10" />

        {/* IMAGE */}
       <div className="relative z-10 h-64 overflow-hidden rounded-2xl">
  <img
    src="/student5.jpeg"
    className="h-full w-full object-cover"
  />
</div>

        {/* CONTENT */}
        <div className="relative z-10 mt-8">

          <h3 className="text-3xl font-bold tracking-tight text-white">
            The Speed Struggler
          </h3>

          <p className="mt-5 text-[15px] leading-8 text-slate-400">

            Reads slowly and loses comprehension under time pressure.

          </p>

        </div>

        {/* INSIGHT */}
        <div className="relative z-10 mt-8 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5">

          <div className="text-xs uppercase tracking-[0.2em] text-violet-300">
            Birbal Insight
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-200">

            Improve reading speed while maintaining comprehension quality.

          </p>

        </div>

        {/* BUTTON */}
        <div className="relative z-10 mt-8">

      <button className="w-full rounded-2xl bg-red-500 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-red-400">

  Increase Reading Speed

</button>
        </div>

      </motion.div>

      {/* CARD 3 */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[32px] bg-slate-800 border border-slate-700 p-8 min-h-[620px] flex flex-col shadow-2xl transition-all duration-300 hover:border-amber-400/40 hover:-translate-y-2"
      >

        <div className="absolute inset-0 bg-amber-500/10" />

       <div className="relative z-10 h-64 overflow-hidden rounded-2xl">
  <img
    src="/student6.jpeg"
    className="h-full w-full object-cover"
  />
</div>

        {/* CONTENT */}
        <div className="relative z-10 mt-8">

          <h3 className="text-3xl font-bold leading-tight text-white">

            The Overthinker

          </h3>

          <p className="mt-5 text-[15px] leading-8 text-slate-400">

            Gets trapped in philosophical passages and extreme answer options.

          </p>

        </div>

        {/* INSIGHT */}
        <div className="relative z-10 mt-8 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">

          <div className="text-xs uppercase tracking-[0.2em] text-amber-300">
            Birbal Insight
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-200">

            Learn tone interpretation, abstraction handling and trap resistance.

          </p>

        </div>

        {/* BUTTON */}
        <div className="relative z-10 mt-8">

        <button className="w-full rounded-2xl bg-orange-500 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-orange-400">

  Improve Decision Accuracy

</button>

        </div>

      </motion.div>

    </div>

  </div>
</motion.section>

      {/* ================= TESTIMONIALS ================= */}
<motion.section
 initial={{ opacity: 0, y: 60 }}
whileInView={{
  opacity: 1,
  y: 0,
}}
transition={{
  duration: 0.7,
  ease: "easeOut",
}}
  viewport={{ once: true, amount: 0.2 }}
   className="relative isolate z-10 py-28"
>

  <div className="mx-auto max-w-7xl px-6">

    {/* HEADER */}
    <div className="max-w-3xl">

      <div className="mt-10 inline-flex rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/50">
        Student Results
      </div>

      <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">

       aspirants are already
        <br />

        improving with Auctor RC

      </h2>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">

        Students use Auctor RC to improve inference accuracy,
        eliminate traps and build reading intelligence for VARC.

      </p>

    </div>

    {/* CARDS */}
    <div className="mt-20 grid gap-8 lg:grid-cols-3 mb-24">

      {/* TESTIMONIAL 1 */}
      <div className="rounded-[30px] border border-white/[0.06] bg-slate-900 p-8 shadow-2xl">
       
      <img
  src="/student1.jpeg"
  className="mb-6 h-[320px] w-full rounded-2xl object-cover object-top"
/>
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20 text-xl font-bold text-cyan-300">
            A
          </div>

          <div>

            <div className="text-lg font-semibold text-white">
              Ananya
            </div>

            <div className="text-sm text-white/40">
             IPMAT 2027 Aspirant
            </div>

          </div>

        </div>

        <p className="mt-8 text-[15px] leading-8 text-slate-300">

          “The Birbal insights are insanely accurate. I discovered that my real weakness wasn’t vocabulary — it was elimination traps.”

        </p>

        <div className="mt-8 rounded-2xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200 border border-cyan-400/10">

          Accuracy improved from 58% → 79%

        </div>

      </div>

      {/* TESTIMONIAL 2 */}
      <div className="rounded-[30px] border border-white/[0.06] bg-slate-900 p-8 shadow-2xl">

       <img
  src="/student2.jpeg"
  className="mb-6 h-[320px] w-full rounded-2xl object-cover object-top"
/>
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20 text-xl font-bold text-violet-300">
            R
          </div>

          <div>

            <div className="text-lg font-semibold text-white">
              Raghav
            </div>

            <div className="text-sm text-white/40">
              Working Professional
            </div>

          </div>

        </div>

        <p className="mt-8 text-[15px] leading-8 text-slate-300">

          “This feels different from random RC practice websites. The analytics actually explain how I read and where cognition breaks.”

        </p>

        <div className="mt-8 rounded-2xl bg-violet-500/10 px-4 py-3 text-sm text-violet-200 border border-violet-400/10">

          VARC mock percentile improved by 18 points

        </div>

      </div>

      {/* TESTIMONIAL 3 */}
      <div className="rounded-[30px] border border-white/[0.06] bg-slate-900 p-8 shadow-2xl">

<img
  src="/student3.jpeg"
  className="mb-6 h-[320px] w-full rounded-2xl object-cover object-top"
/>
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-xl font-bold text-emerald-300">
            S
          </div>

          <div>

            <div className="text-lg font-semibold text-white">
              Sneha
            </div>

            <div className="text-sm text-white/40">
              CAT Aspirant
            </div>

          </div>

        </div>

        <p className="mt-8 text-[15px] leading-8 text-slate-300">

          “The tone analysis drills completely changed how I attempt philosophical passages. Earlier I used to panic.”

        </p>

        <div className="mt-8 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 border border-emerald-400/10">

          Reading speed improved by 42 WPM

        </div>

      </div>

    </div>

  </div>

</motion.section>


{/* ================= HOW IT WORKS ================= */}
<motion.section
 initial={{ opacity: 0, y: 60 }}
whileInView={{
  opacity: 1,
  y: 0,
}}
transition={{
  duration: 0.7,
  ease: "easeOut",
}}
  viewport={{ once: true, amount: 0.2 }}
   className="relative isolate z-10 py-28"
>

  <div className="mx-auto max-w-7xl px-6">

    {/* HEADER */}
    <div className="max-w-3xl">

      <div className="mt-10 inline-flex rounded-full border border-cyan-500/10 bg-cyan-500/[0.04] px-4 py-2 text-sm text-cyan-200">
        How Auctor Works
      </div>

      <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">

        RC training designed
        <br />

       like a <span className="text-amber-300">cognitive gym.</span>

      </h2>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">

        Auctor continuously analyzes how you read, where your reasoning breaks,
        and what type of RC traps affect your accuracy.

      </p>

    </div>

    {/* STEPS */}
    <div className="mt-16 grid gap-8 lg:grid-cols-3 mb-24">

      {/* STEP 1 */}
      <div className="rounded-[30px] border border-cyan-500/10 bg-slate-800 p-8">

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
          <Brain className="text-cyan-300" />
        </div>

        <h3 className="text-2xl font-semibold text-white">
          Adaptive RC
        </h3>

        <p className="mt-5 text-[15px] leading-8 text-white/45">

          Difficulty dynamically adjusts based on your reading behaviour,
          inference accuracy and timing patterns.

        </p>

      </div>

      {/* STEP 2 */}
      <div className="rounded-[30px] border border-violet-500/10 bg-slate-800 p-8">

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
          <Sparkles className="text-violet-300" />
        </div>

        <h3 className="text-2xl font-semibold text-white">
          <span className="text-violet-200">
  Birbal AI Diagnosis
</span>
        </h3>

        <p className="mt-5 text-[15px] leading-8 text-white/45">

          Identify whether your weakness is tone interpretation,
          elimination traps, abstraction or argument structure.

        </p>

      </div>

      {/* STEP 3 */}
      <div className="rounded-[30px] border border-emerald-500/10 bg-slate-800 p-8">

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
          <LineChart className="text-emerald-300" />
        </div>

        <h3 className="text-2xl font-semibold text-white">
          <span className="text-amber-300">
  Reading Intelligence.
</span>
        </h3>

        <p className="mt-5 text-[15px] leading-8 text-white/45">

          Track percentile growth, RC IQ, speed, inference stability
          and cognitive reading patterns over time.

        </p>

      </div>

    </div>

  </div>

</motion.section>

{/* ================= SOCIAL COMMUNITY ================= */}

<motion.section
 initial={{ opacity: 0, y: 60 }}
whileInView={{
  opacity: 1,
  y: 0,
}}
transition={{
  duration: 0.7,
  ease: "easeOut",
}}
  viewport={{ once: true, amount: 0.2 }}
   className="relative isolate z-10 px-6 py-20"
>

  <div className="max-w-7xl mx-auto px-6">

    {/* HEADER */}
    <div className="max-w-3xl">

      <div className="mt-10 inline-flex rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/50">
        Join The Auctor Community
      </div>

      <h2 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-white">

        Learn RC daily.
        <br />

        Stay connected with Auctor.

      </h2>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">

        Get RC insights, reading tips, inference training,
        mock analysis and daily learning content across our platforms.

      </p>

    </div>

   {/* SOCIAL CARDS */}
<div className="mt-16 grid gap-8 md:grid-cols-3">

  {/* INSTAGRAM */}
  <div className="group relative h-full overflow-hidden rounded-[30px] border border-pink-500/20 bg-slate-900 p-8 transition-all duration-300 hover:border-pink-400/40">

    <div className="absolute inset-0 bg-pink-500/5 opacity-0 transition group-hover:opacity-100" />

   <div className="relative z-10 flex flex-col">
      {/* LOGO */}
      <img
        src="/instagram.svg"
        alt="Instagram"
        className="h-14 w-14 object-contain mb-6"
      />

      <h3 className="text-3xl font-bold text-white">
        Instagram
      </h3>

      <p className="mt-5 text-[15px] leading-8 text-slate-400">

        Daily RC reels, Test strategies, reading psychology 
        and student improvement insights.

      </p>

     <a
  href="https://instagram.com/auctorlabs.in"
  target="_blank"
  rel="noopener noreferrer"
  className="mt-8 inline-flex w-fit items-center rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-400"
>
  Follow Instagram
</a>

    </div>

  </div>

  {/* TELEGRAM */}
  <div className="group relative h-full overflow-hidden rounded-[30px] border border-cyan-500/20 bg-slate-900 p-8 transition-all duration-300 hover:border-cyan-400/40">

    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 transition group-hover:opacity-100" />

   <div className="relative z-10 flex flex-col">

      {/* LOGO */}
      <img
        src="/telegram.svg"
        alt="Telegram"
        className="h-14 w-14 object-contain mb-6"
      />

      <h3 className="text-3xl font-bold text-white">
        Telegram
      </h3>

      <p className="mt-5 text-[15px] leading-8 text-slate-400">

        Receive free RC passages, Exam resources,
        daily practice sets and important announcements.

      </p>

      <a
        href="https://t.me/auctorlab"
        target="_blank"
        className="mt-8 inline-flex w-fit items-center rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400"
      >
        Join Telegram
      </a>

    </div>

  </div>

  {/* WHATSAPP */}
  <div className="group relative h-full overflow-hidden rounded-[30px] border border-emerald-500/20 bg-slate-900 p-8 transition-all duration-300 hover:border-emerald-400/40">

    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 transition group-hover:opacity-100" />

   <div className="relative z-10 flex flex-col">

      {/* LOGO */}
      <img
        src="/whatsapp.svg"
        alt="WhatsApp"
        className="h-14 w-14 object-contain mb-6"
      />

      <h3 className="text-3xl font-bold text-white">
        WhatsApp
      </h3>

      <p className="mt-5 text-[15px] leading-8 text-slate-400">

        Join our WhatsApp channel for quick updates,
        RC discussions and Exam preparation insights.

      </p>

      <a
        href="https://whatsapp.com/channel/0029VbBakAt8PgsO5RdHQ12L"
        target="_blank"
        className="mt-8 inline-flex w-fit items-center rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400"
      >
        Join WhatsApp
      </a>

    </div>

  </div>



    </div>

  </div>

</motion.section>

{/* ================= AFTER LOGIN ================= */}
<motion.section
 initial={{ opacity: 0, y: 60 }}
whileInView={{
  opacity: 1,
  y: 0,
}}
transition={{
  duration: 0.7,
  ease: "easeOut",
}}
  viewport={{ once: true, amount: 0.2 }}
  className="relative isolate z-10 pt-44 pb-28"
>

 <div className="max-w-6xl mx-auto px-6">
  {/* SECTION HEADER */}
  <div className="mb-16">

   <div className="mt-10 inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-300 mb-6">
      Inside Auctor RC
    </div>

    <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
      Your complete
      <br />
      RC training dashboard.
    </h2>

    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">
      Daily workouts, speed training, Birbal AI mentoring and deep analytics —
      everything designed to improve VARC performance.
    </p>

  </div>

  {/* TOP TABS */}
  <div className="flex flex-wrap gap-4 mb-10">

  <button
    onClick={() => setActiveTab("workout")}
    className={`px-6 py-3 rounded-xl font-semibold transition ${
      activeTab === "workout"
        ? "bg-orange-500 text-white"
        : "bg-[#11183d] border border-white/10 text-white"
    }`}
  >
    Daily Workout
  </button>

  <button
    onClick={() => setActiveTab("speed")}
    className={`px-6 py-3 rounded-xl font-semibold transition ${
      activeTab === "speed"
        ? "bg-orange-500 text-white"
        : "bg-[#11183d] border border-white/10 text-white"
    }`}
  >
    Speed Gym
  </button>

  <button
    onClick={() => setActiveTab("birbal")}
    className={`px-6 py-3 rounded-xl font-semibold transition ${
      activeTab === "birbal"
        ? "bg-orange-500 text-white"
        : "bg-[#11183d] border border-white/10 text-white"
    }`}
  >
    Birbal AI
  </button>

  <button
    onClick={() => setActiveTab("analytics")}
    className={`px-6 py-3 rounded-xl font-semibold transition ${
      activeTab === "analytics"
        ? "bg-orange-500 text-white"
        : "bg-[#11183d] border border-white/10 text-white"
    }`}
  >
    Analytics
  </button>

</div>

    {/* MAIN SECTION */}
    <div className="grid md:grid-cols-2 gap-16 items-center">

      {/* LEFT */}
     <div>

  

  {/* TITLE */}
  <h2 className="text-5xl font-bold leading-tight mb-8 text-white">

    {
      activeTab === "workout"
        ? "Daily RC Workout"
        : activeTab === "speed"
        ? "Speed Reading Gym"
        : activeTab === "birbal"
        ? "Birbal AI Mentor"
        : "Performance Analytics"
    }

  </h2>

  {/* DESCRIPTION */}
  <p className="text-gray-400 text-lg leading-9 mb-10">

    {
      activeTab === "workout"
        ? "A structured 30 minute RC training routine combining speed drills, vocabulary building, inference correction and exam-level passages."

        : activeTab === "speed"
        ? "Train your reading speed without losing comprehension. Improve focus, eye-span and reading efficiency."

        : activeTab === "birbal"
        ? "Ask Birbal why answers are wrong, understand inference traps and improve your RC reasoning ability."

        : "Track RC accuracy, reading speed, sectional trends and cognitive reading behaviour over time."
    }

  </p>

  {/* FEATURES */}
  <div className="space-y-5 mb-10">

    {/* FEATURE 1 */}
    <div className="flex gap-4">

      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-2"></div>

      <div>

        <p className="font-semibold text-white">

          {
            activeTab === "workout"
              ? "Adaptive RC passages"
              : activeTab === "speed"
              ? "Speed drills"
              : activeTab === "birbal"
              ? "AI reasoning explanations"
              : "Performance tracking"
          }

        </p>

        <p className="text-gray-400 text-sm mt-1">

          {
            activeTab === "workout"
              ? "Difficulty changes dynamically with your performance."

              : activeTab === "speed"
              ? "Train reading speed while maintaining accuracy."

              : activeTab === "birbal"
              ? "Understand why your RC answers are incorrect."

              : "Track sectional growth and RC accuracy trends."
          }

        </p>

      </div>

    </div>

    {/* FEATURE 2 */}
    <div className="flex gap-4">

      <div className="w-2.5 h-2.5 rounded-full bg-violet-400 mt-2"></div>

      <div>

        <p className="font-semibold text-white">

          {
            activeTab === "workout"
              ? "Skill focused improvement"
              : activeTab === "speed"
              ? "Focus enhancement"
              : activeTab === "birbal"
              ? "Inference correction"
              : "Reading intelligence metrics"
          }

        </p>

        <p className="text-gray-400 text-sm mt-1">

          {
            activeTab === "workout"
              ? "Improve tone detection, inference and elimination logic."

              : activeTab === "speed"
              ? "Improve concentration and eye-span."

              : activeTab === "birbal"
              ? "Learn to avoid elimination and abstraction traps."

              : "Monitor RC IQ, speed and cognitive consistency."
          }

        </p>

      </div>

    </div>

    {/* FEATURE 3 */}
    <div className="flex gap-4">

      <div className="w-2.5 h-2.5 rounded-full bg-orange-400 mt-2"></div>

      <div>

        <p className="font-semibold text-white">

          {
            activeTab === "workout"
              ? "AI driven feedback"
              : activeTab === "speed"
              ? "Daily consistency"
              : activeTab === "birbal"
              ? "Tone & argument analysis"
              : "Sectional analytics"
          }

        </p>

        <p className="text-gray-400 text-sm mt-1">

          {
            activeTab === "workout"
              ? "Birbal continuously analyzes your reading behaviour."

              : activeTab === "speed"
              ? "Build long-term reading stamina."

              : activeTab === "birbal"
              ? "Understand tone, assumptions and argument structures."

              : "Detailed analysis of your RC sectionals."
          }

        </p>

      </div>

    </div>

  </div>

 

</div>

      {/* RIGHT */}
      <div className="relative overflow-hidden">

        {/* GLOW */}
        <div className="absolute -inset-10 bg-orange-500/20 blur-3xl opacity-30"></div>

        {/* IMAGE */}
     <motion.img
  key={activeTab}
  initial={{ opacity: 0, x: 40, scale: 0.96 }}
  animate={{ opacity: 1, x: 0, scale: 1 }}
  transition={{
    duration: 0.55,
    ease: "easeOut",
  }}
  src={
    activeTab === "workout"
      ? "/slide2.png"
      : activeTab === "speed"
      ? "/slide4.png"
      : activeTab === "birbal"
      ? "/slide3.png"
      : "/slide1.png"
  }
  alt="Dashboard"
  className="relative rounded-2xl shadow-2xl border border-white/10"
/>

      </div>
      {/* CTA */}

<div className="mt-12 flex justify-center md:justify-start">

<button 
   onClick={() => router.push("/login")}
  className="rounded-2xl bg-orange-500 px-8 py-4 font-semibold text-white transition hover:bg-orange-600 hover:scale-[1.02]">
    Create Free Account
  </button>
    </div>
    </div>

  </div>
   

</motion.section>

<PreviewFooter/>
    </main>
  );
}