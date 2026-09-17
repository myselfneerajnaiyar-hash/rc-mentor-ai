"use client";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Image from "next/image";
import PreviewNavbar from "@/components/PreviewNavbar";
import PreviewFooter from "@/components/PreviewFooter";
import FaqSection from "./components/FaqSection";
import useEmblaCarousel from "embla-carousel-react";
import "./preview-mobile.css";

import "swiper/css";

import {
  ArrowRight,
  Brain,
  Eye,
  LineChart,
  Lock,
  Play,
  Sparkles,
  Star,
  Target,
  X,
  Zap,
} from "lucide-react";

export default function PreviewPage() {
  const router = useRouter();
  const WHATSAPP_URL =
  "https://wa.me/919953237212?text=Hi%2C%20I%20want%20to%20know%20more%20about%20Auctor%20RC.";

const startFreeTrial = () => {
  router.push("/login");
};
  const [activeTab, setActiveTab] = useState("workout");
  const videos = [
    {
      name: "Ishaan Chandrakar",
      thumbnail: "/testimonials/video1.jpeg",
      video: "/testimonials/video1.mp4",
      title: "From Avoiding RC to Enjoying Reading",
    },
    {
      name: "Bhoomi Saluja",
      thumbnail: "/testimonials/video2.jpeg",
      video: "/testimonials/video2.mp4",
      title: "Daily Workouts Changed My Reading Habit",
    },
    {
      name: "Rushill",
      thumbnail: "/testimonials/video3.jpeg",
      video: "/testimonials/video3.mp4",
      title: "Birbal Helped Me Understand My Mistakes",
    },
  ];
  const reviews = [
    {
      name: "Keshu Sharma",
      photo: "/testimonials/student1.jpeg",
      text: "I used to avoid reading because I never enjoyed it. After using Auctor consistently, reading has become a daily habit and I can clearly feel the improvement in my comprehension.",
    },
    {
      name: "Pushti Kapoor",
      photo: "/testimonials/student2.jpeg",
      text: "The Daily Workout feature kept me consistent. Instead of randomly practising RCs, I finally had a proper learning routine every day.",
    },
    {
      name: "Nabeel",
      photo: "/testimonials/student3.jpeg",
      text: "Birbal doesn't just tell you the right answer. It explains why you were wrong, which completely changed how I approached Reading Comprehension.",
    },
  ];
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [videoRef, videoApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [reviewRef, reviewApi] = useEmblaCarousel({ loop: true, align: "start" });
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

useEffect(() => {
  setMounted(true);
}, []);

useEffect(() => {
  if (!selectedVideo) return;

  const handleKeyDown = (event) => {
    if (event.key === "Escape") setSelectedVideo(null);
  };
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", handleKeyDown);

  return () => {
    document.body.style.overflow = previousOverflow;
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [selectedVideo]);


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

useEffect(() => {
  if (!videoApi) return;
  const updateVideoIndex = () => setVideoIndex(videoApi.selectedScrollSnap());
  updateVideoIndex();
  videoApi.on("select", updateVideoIndex);
  videoApi.on("reInit", updateVideoIndex);
  return () => {
    videoApi.off("select", updateVideoIndex);
    videoApi.off("reInit", updateVideoIndex);
  };
}, [videoApi]);

useEffect(() => {
  if (!reviewApi) return;
  const updateReviewIndex = () => setReviewIndex(reviewApi.selectedScrollSnap());
  updateReviewIndex();
  reviewApi.on("select", updateReviewIndex);
  reviewApi.on("reInit", updateReviewIndex);
  return () => {
    reviewApi.off("select", updateReviewIndex);
    reviewApi.off("reInit", updateReviewIndex);
  };
}, [reviewApi]);


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
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full"
      >
        <div className="hero-grid">
        {/* LEFT: POSITIONING */}
        <div className="hero-copy relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-2 text-sm font-medium text-cyan-100">
            <Sparkles size={15} aria-hidden="true" />
            AI-Powered Reading Intelligence
          </div>

          <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl xl:text-7xl">
            Stop solving more RCs.
            <span className="mt-2 block text-orange-400">Start solving RCs better.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
            Auctor identifies how your reasoning breaks and then trains the exact skills holding your VARC score back.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">

  {/* FREE TRIAL */}
  <button
    type="button"
    onClick={startFreeTrial}
    style={{
      backgroundColor: "#FF8A45",
      color: "#FFFFFF",
      boxShadow: "0 16px 45px rgba(255,138,69,0.22)",
    }}
    className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
  >
    Start Your Free Trial
    <ArrowRight
      size={18}
      aria-hidden="true"
      className="transition group-hover:translate-x-1"
    />
  </button>

  {/* WHATSAPP */}
  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      border: "1px solid rgba(37,211,102,0.35)",
      backgroundColor: "rgba(37,211,102,0.08)",
      color: "#7CFFA8",
    }}
    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold transition hover:-translate-y-0.5 hover:bg-[rgba(37,211,102,0.14)]"
  >
    <img
      src="/whatsapp.svg"
      alt=""
      style={{
        width: "20px",
        height: "20px",
      }}
    />
    Connect on WhatsApp
  </a>

</div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/[0.07] pt-6 text-sm text-white/45">
            <span className="flex items-center gap-2"><Brain size={16} className="text-cyan-300" aria-hidden="true" />Adaptive RC</span>
            <span className="flex items-center gap-2"><Sparkles size={16} className="text-violet-300" aria-hidden="true" />Birbal AI Diagnosis</span>
            <span className="flex items-center gap-2"><LineChart size={16} className="text-orange-300" aria-hidden="true" />Performance Analytics</span>
          </div>
        </div>

        {/* RIGHT: STUDENT RC VISUAL */}
        <figure className="hero-visual relative flex items-center" aria-labelledby="student-rc-visual-caption">
          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-blue-500/[0.06] to-orange-500/[0.06] blur-3xl" />
          <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#0A1020] p-2 shadow-[0_35px_90px_rgba(0,0,0,0.5)] sm:p-3">
            <Image src="/auctor-rc-student-hero.png" alt="Focused Indian student practising a reading comprehension passage on a laptop" width={1536} height={1024} priority sizes="(max-width: 767px) 100vw, 55vw" className="aspect-[3/2] max-h-[520px] h-auto w-full max-w-none rounded-[1.5rem] object-cover" />
            <div className="pointer-events-none absolute inset-2 rounded-[1.5rem] bg-gradient-to-tr from-[#050816]/20 via-transparent to-cyan-300/[0.04] sm:inset-3" />
          </div>

          <figcaption id="student-rc-visual-caption" className="sr-only">A focused student actively practising a reading comprehension passage for a competitive aptitude exam.</figcaption>
        </figure>
        </div>
        <style jsx>{`
          .hero-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            align-items: center;
            gap: 56px;
            width: 100%;
            max-width: 1280px;
            min-height: 700px;
            margin: 0 auto;
            padding: 128px 24px 80px;
          }

          .hero-copy {
            min-width: 0;
            max-width: 600px;
          }

          .hero-visual {
            min-width: 0;
            width: 100%;
            margin: 0;
          }

          .hero-visual :global(img) {
            display: block;
            width: 100%;
            max-width: none;
            height: auto;
            object-fit: cover;
          }

          @media (min-width: 900px) {
            .hero-grid {
              grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
              gap: 64px;
              padding-top: 96px;
              padding-bottom: 64px;
            }
          }
        `}</style>
      </motion.section>

    {/* ================= READING INTELLIGENCE ================= */}
<motion.section
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  viewport={{ once: true, amount: 0.15 }}
  className="preview-reading relative isolate z-10 py-28 md:py-36"
>
  <div className="mx-auto max-w-7xl px-6">

    {/* TOP INTRO */}
    <div className="grid items-end gap-10 lg:grid-cols-[0.8fr_1.2fr]">

      {/* LEFT LABEL */}
      <div>
        <div className="inline-flex items-center rounded-full border border-orange-400/20 bg-orange-400/[0.06] px-4 py-2 text-sm font-medium text-orange-300">
          Reading Intelligence
        </div>
      </div>

      {/* RIGHT HEADLINE */}
      <div>
        <h2 className="text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-white md:text-5xl lg:text-6xl">
          A score tells you{" "}
          <span className="text-white/35">what happened.</span>
          <br />
          Auctor helps you understand{" "}
          <span className="text-orange-400">why.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">
          Every RC answer reveals something about how you read, infer,
          eliminate and interpret the author's intent.
        </p>
      </div>

    </div>


  {/* MAIN PRODUCT STORY */}
<div className="relative mt-20 overflow-hidden rounded-[36px] border border-white/[0.08] bg-[#0B1730]">

  {/* subtle background architecture */}
  <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.08] blur-[140px]" />
  <div className="pointer-events-none absolute -bottom-32 -left-32 h-[450px] w-[450px] rounded-full bg-blue-600/[0.08] blur-[140px]" />

  {/* TWO COLUMN LAYOUT */}
  <div className="relative grid items-center lg:grid-cols-2">

    {/* ================= LEFT STORY ================= */}
    <div className="relative z-10 px-8 py-12 md:px-12 md:py-16 lg:px-14 lg:py-20">

      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
        Beyond the score
      </div>

      <h3 className="mt-5 max-w-md text-3xl font-semibold leading-tight text-white md:text-4xl">
        Your mistakes leave a pattern.
      </h3>

      <p className="mt-6 max-w-md text-base leading-8 text-white/45">
        Auctor looks beyond the final answer to identify the reasoning
        patterns behind your performance.
      </p>

      {/* THREE SIGNALS */}
      <div className="mt-10 space-y-7">

        {/* INFERENCE */}
        <div className="flex gap-4">

          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
            <Brain size={17} className="text-cyan-300" />
          </div>

          <div>
            <h4 className="font-semibold text-white">
              Inference
            </h4>

            <p className="mt-1 text-sm leading-6 text-white/35">
              How you connect what the passage says with what it implies.
            </p>
          </div>

        </div>

        {/* ELIMINATION */}
        <div className="flex gap-4">

          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400/10">
            <Target size={17} className="text-orange-300" />
          </div>

          <div>
            <h4 className="font-semibold text-white">
              Elimination
            </h4>

            <p className="mt-1 text-sm leading-6 text-white/35">
              How you reject options and where traps catch you.
            </p>
          </div>

        </div>

        {/* TONE */}
        <div className="flex gap-4">

          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-400/10">
            <Eye size={17} className="text-violet-300" />
          </div>

          <div>
            <h4 className="font-semibold text-white">
              Tone & intent
            </h4>

            <p className="mt-1 text-sm leading-6 text-white/35">
              How accurately you read the author's position and purpose.
            </p>
          </div>

        </div>

      </div>

    </div>


    {/* ================= RIGHT VISUAL ================= */}
    <div className="relative flex min-h-[460px] items-center justify-center px-6 py-10 lg:min-h-[600px] lg:px-8">

      {/* soft ambient glow */}
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.08] blur-[110px]" />

      {/* MAIN IMAGE */}
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.94 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative z-10 flex w-full items-center justify-center"
      >

        <Image
          src="/reading-intelligence-visual.jpeg"
          alt="Reading Intelligence"
          width={1200}
          height={900}
          className="w-full max-w-[680px] object-contain drop-shadow-[0_35px_80px_rgba(0,0,0,0.55)]"
        />

      </motion.div>

    </div>

  </div>

</div>


   {/* BOTTOM STATEMENT */}
<div className="mt-20 border-t border-white/[0.08] pt-14">

  <h3 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-white md:text-6xl lg:text-[64px]">
    The goal isn't to become better at{" "}
    <span className="text-orange-400">
      answering more questions.
    </span>
  </h3>

  <p className="mt-7 max-w-3xl text-lg font-medium leading-relaxed text-white/65 md:text-xl">
    It's to become better at the thinking that makes the
    <span className="text-white"> right answer possible.</span>
  </p>

</div>
</div>
</motion.section>




{/* ================= CREATED BY EDUCATORS ================= */}
<motion.section
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: "easeOut" }}
  viewport={{ once: true, amount: 0.2 }}
  className="preview-educators relative z-10 py-24 md:py-32"
>
  <div className="mx-auto mt-20 max-w-7xl px-6">

    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

      {/* ================= LEFT ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â TEXT ================= */}
      <div>

        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
          Created by Educators
        </div>

        <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white md:text-5xl lg:text-6xl">
          Built from the classroom.
          <br />
          <span className="text-white/35">
            Not from a software brief.
          </span>
        </h2>

        <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
          Auctor RC was created by{" "}
          <span className="font-semibold text-white">
            Neraj Kumar Naiyar
          </span>
          , an educator and product builder with deep experience in
          competitive-exam preparation.
        </p>

        <div className="mt-9 border-l-2 border-orange-400/60 pl-5">
          <div className="text-lg font-semibold text-white">
            Neraj Kumar Naiyar
          </div>

          <div className="mt-2 text-sm leading-7 text-white/45">
            IIT Roorkee
            <br />
            Educator, Product Builder, Founder, Auctor Labs
          </div>
        </div>

        <p className="mt-9 max-w-xl text-base leading-8 text-white/45">
          After years of working with students and coaching institutes,
          the idea was simple: RC practice should not stop at telling a
          student whether an answer was right or wrong. It should help
          them understand how they think and what they need to improve.
        </p>

        <div className="mt-9 flex items-center gap-3 text-sm font-medium text-cyan-300">
          <div className="h-px w-10 bg-cyan-400/50" />
          Training the thinking behind the score.
        </div>

      </div>


      {/* ================= RIGHT ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â IMAGE ================= */}
      <div className="flex w-full items-center justify-center lg:justify-end">

        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="w-full max-w-[520px]"
        >

          <div className="overflow-hidden rounded-[32px] border border-white/[0.12] bg-white/[0.04] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">

            <Image
              src="/founder.jpeg"
              alt="Neraj Kumar Naiyar, founder of Auctor Labs"
              width={900}
              height={1100}
              className="block h-[480px] w-full rounded-[26px] object-cover object-top"
            />

          </div>

        </motion.div>

      </div>

    </div>

  </div>
</motion.section>

{/* ================= WHY NORMAL RC FAILS ================= */}
<motion.section
  initial={{ opacity: 0, y: 36 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.75, ease: "easeOut" }}
  viewport={{ once: true, amount: 0.15 }}
  className="relative overflow-hidden py-24 text-white md:py-32"
  style={{ backgroundColor: "#020817" }}
>
  <div className="mx-auto max-w-7xl px-6">

    {/* ================= HEADER ================= */}
    <div className="max-w-4xl">

      <div
        className="text-xs font-black uppercase tracking-[0.24em]"
        style={{ color: "#ff8a45" }}
      >
        Why Most RC Practice Fails
      </div>

      <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.055em] md:text-6xl lg:text-7xl">
        Most RC practice improves familiarity.
        <br />
        <span style={{ color: "#ff8a45" }}>
          Not reading intelligence.
        </span>
      </h2>

      <p className="mt-7 max-w-3xl text-lg leading-8 text-white/55 md:text-xl">
        Solving hundreds of passages is useless if you never understand why
        your reasoning breaks.
      </p>

    </div>


    {/* ================= COMPARISON ================= */}
    <div className="mt-16 grid gap-6 lg:grid-cols-2">


      {/* =====================================================
          LEFT â€” TRADITIONAL RC
      ===================================================== */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, amount: 0.2 }}
        className="relative flex min-h-[620px] flex-col overflow-hidden rounded-[32px] p-8 sm:p-10 md:p-12"
        style={{
          backgroundColor: "#B44729",
          boxShadow: "0 30px 80px rgba(180,71,41,0.22)",
        }}
      >

        {/* TOP */}
        <div className="flex items-start justify-between gap-6">

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-100">
              Traditional
            </p>

            <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              RC Practice
            </h3>
          </div>

          <span
            className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
            style={{
              backgroundColor: "#8E351F",
              color: "#FFE7D8",
            }}
          >
            The old way
          </span>

        </div>


        {/* BIG NUMBER */}
        <div className="mt-14 flex items-end gap-4">

          <div
            className="text-7xl font-black leading-none tracking-[-0.08em] sm:text-8xl md:text-9xl"
            style={{ color: "#FFD0AE" }}
          >
            100s
          </div>

          <div className="pb-2 text-sm font-black uppercase leading-4 tracking-[0.08em] text-orange-50">
            passages
            <br />
            solved
          </div>

        </div>


        {/* DIVIDER */}
        <div className="my-10 h-px bg-orange-100/30" />


        {/* WHAT USUALLY HAPPENS */}
        <div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-100">
            What usually happens
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            {[
              "Random passages",
              "No reasoning diagnosis",
              "Same difficulty for everyone",
              "Wrong answer â†’ move on",
              "Mock score, but no explanation",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full px-5 py-3 text-sm font-bold"
                style={{
                  backgroundColor: "#8E351F",
                  color: "#FFF1E8",
                }}
              >
                {item}
              </span>
            ))}

          </div>

        </div>


        {/* BOTTOM */}
        <div className="mt-auto pt-12">

          <div className="h-px bg-orange-100/30" />

          <div className="pt-8">

            <p className="text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl">
              More practice.
            </p>

            <p
              className="mt-1 text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl md:text-6xl"
              style={{ color: "#FFD0AE" }}
            >
              Same mistakes.
            </p>

          </div>

        </div>

      </motion.div>



      {/* =====================================================
          RIGHT â€” AUCTOR
      ===================================================== */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.08 }}
        viewport={{ once: true, amount: 0.2 }}
        className="relative flex min-h-[620px] flex-col overflow-hidden rounded-[32px] p-8 sm:p-10 md:p-12"
        style={{
          backgroundColor: "#185EAE",
          boxShadow: "0 30px 80px rgba(24,94,174,0.24)",
        }}
      >

        {/* TOP */}
        <div className="flex items-start justify-between gap-6">

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
              Auctor
            </p>

            <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Reading Intelligence
            </h3>
          </div>

          <span
            className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
            style={{
              backgroundColor: "#104783",
              color: "#DDFBFF",
            }}
          >
            The new way
          </span>

        </div>


        {/* IMPROVEMENT LOOP */}
        <div className="mt-12">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            Your improvement loop
          </p>


          <div className="mt-6 grid gap-4 sm:grid-cols-2">


            {/* PRACTICE */}
            <div
              className="rounded-[22px] p-6"
              style={{ backgroundColor: "#104783" }}
            >
              <div className="flex items-center justify-between">

                <span
                  className="text-xs font-black"
                  style={{ color: "#FF9B55" }}
                >
                  01
                </span>

                <span
                  className="text-2xl"
                  style={{ color: "#8DEBFF" }}
                >
                  â†’
                </span>

              </div>

              <h4 className="mt-8 text-3xl font-black tracking-[-0.04em]">
                Practice
              </h4>

              <p className="mt-2 text-sm text-blue-100">
                Adaptive practice
              </p>

            </div>


            {/* DIAGNOSE */}
            <div
              className="rounded-[22px] p-6"
              style={{ backgroundColor: "#104783" }}
            >
              <div className="flex items-center justify-between">

                <span
                  className="text-xs font-black"
                  style={{ color: "#FF9B55" }}
                >
                  02
                </span>

                <span
                  className="text-2xl"
                  style={{ color: "#8DEBFF" }}
                >
                  â†’
                </span>

              </div>

              <h4 className="mt-8 text-3xl font-black tracking-[-0.04em]">
                Diagnose
              </h4>

              <p className="mt-2 text-sm text-blue-100">
                Reasoning analysis
              </p>

            </div>


            {/* UNDERSTAND */}
            <div
              className="rounded-[22px] p-6"
              style={{ backgroundColor: "#104783" }}
            >
              <div className="flex items-center justify-between">

                <span
                  className="text-xs font-black"
                  style={{ color: "#FF9B55" }}
                >
                  03
                </span>

                <span
                  className="text-2xl"
                  style={{ color: "#8DEBFF" }}
                >
                  â†’
                </span>

              </div>

              <h4 className="mt-8 text-3xl font-black tracking-[-0.04em]">
                Understand
              </h4>

              <p className="mt-2 text-sm text-blue-100">
                See why you got it wrong
              </p>

            </div>


            {/* IMPROVE */}
            <div
              className="rounded-[22px] border p-6"
              style={{
                backgroundColor: "#0B3978",
                borderColor: "rgba(141,235,255,0.55)",
              }}
            >
              <div className="flex items-center justify-between">

                <span
                  className="text-xs font-black"
                  style={{ color: "#FF9B55" }}
                >
                  04
                </span>

                <span
                  className="text-2xl"
                  style={{ color: "#8DEBFF" }}
                >
                  âœ“
                </span>

              </div>

              <h4
                className="mt-8 text-3xl font-black tracking-[-0.04em]"
                style={{ color: "#8DEBFF" }}
              >
                Improve
              </h4>

              <p className="mt-2 text-sm text-cyan-50">
                Train the exact gap
              </p>

            </div>

          </div>

        </div>


        {/* WHAT CHANGES */}
        <div className="mt-8 border-t border-cyan-100/20 pt-7">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            What changes
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            {[
              "Reasoning diagnosis",
              "Trap & elimination analysis",
              "Reading intelligence profile",
              "Targeted improvement",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full px-4 py-2.5 text-sm font-bold"
                style={{
                  backgroundColor: "#104783",
                  color: "#E6FBFF",
                }}
              >
                {item}
              </span>
            ))}

          </div>

        </div>


        {/* BOTTOM */}
        <div className="mt-auto pt-10">

          <div className="h-px bg-cyan-100/20" />

          <div className="pt-8">

            <p className="text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl">
              Don&apos;t just know
            </p>

            <p
              className="mt-1 text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl md:text-6xl"
              style={{ color: "#8DEBFF" }}
            >
              what you got wrong.
            </p>

          </div>

        </div>

      </motion.div>

    </div>


    {/* ================= CLOSING STATEMENT ================= */}
    <div className="mt-20 border-t border-white/10 pt-12 md:mt-24 md:pt-16">

      <p className="max-w-6xl text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl md:text-6xl lg:text-7xl">
        The goal isn&apos;t to become better at{" "}
        <span style={{ color: "#FF8A45" }}>
          answering more questions.
        </span>
      </p>

      <p className="mt-6 max-w-4xl text-lg font-medium leading-8 text-white/55 sm:text-xl md:text-2xl">
        It&apos;s to become better at the thinking that makes the right answer
        possible.
      </p>

    </div>

  </div>
</motion.section>


      {/* ================= TESTIMONIALS ================= */}
<section className="preview-testimonials relative isolate z-10 py-24 md:py-32">
  <div className="mx-auto max-w-7xl px-6">
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.2 }}
      className="max-w-4xl"
    >
      <div className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Student Reviews</div>
      <h2 className="mt-5 text-4xl font-black leading-[1.04] tracking-[-0.045em] text-white md:text-6xl">
        Trusted by Students.<br />Built for Institutes.
      </h2>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-white/55">
        Real students. Real experiences. See how Auctor RC is helping learners become stronger readers every single day.
      </p>
    </motion.div>

    <div className="testimonial-carousel-viewport mt-14 overflow-hidden" ref={videoRef}>
      <div className="testimonial-carousel-track -ml-6 flex">
        {videos.map((video) => (
          <div key={video.name} className="testimonial-carousel-slide min-w-0 flex-[0_0_100%] pl-6 md:flex-[0_0_50%] lg:flex-[0_0_33.333%]">
            <article className="h-full overflow-hidden rounded-3xl border border-white/10 bg-[#101828] shadow-xl">
              <div
                className="relative aspect-video cursor-pointer overflow-hidden bg-black"
                onClick={() => setSelectedVideo(video.video)}
              >
                <img src={video.thumbnail} alt={`${video.name} video testimonial`} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 z-10 bg-black/20" />
                <button
                  type="button"
                  aria-label={`Play ${video.name}'s testimonial`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedVideo(video.video);
                  }}
                  className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-orange-500 shadow-lg transition hover:scale-110 hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-20 sm:w-20">
                    <Play className="ml-1 text-white" size={32} fill="white" aria-hidden="true" />
                  </span>
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold leading-7 text-white">{video.title}</h3>
                <p className="mt-3 text-sm font-semibold text-orange-300">{video.name}</p>
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-7 flex justify-center gap-2" aria-label="Video testimonial slides">
      {videos.map((video, index) => (
        <button key={video.name} type="button" onClick={() => videoApi?.scrollTo(index)} aria-label={`Go to video testimonial ${index + 1}`} className={`h-2.5 rounded-full transition-all ${videoIndex === index ? "w-8 bg-orange-500" : "w-2.5 bg-white/20 hover:bg-white/35"}`} />
      ))}
    </div>

    <div className="mt-20 flex items-end justify-between gap-6 border-t border-white/10 pt-12">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Written experiences</div>
        <h3 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">What Students Say</h3>
      </div>
    </div>

    <div className="testimonial-carousel-viewport mt-9 overflow-hidden" ref={reviewRef}>
      <div className="testimonial-carousel-track flex -ml-5">
        {reviews.map((review) => (
          <div key={review.name} className="testimonial-carousel-slide min-w-0 flex-[0_0_100%] pl-5 md:flex-[0_0_50%] lg:flex-[0_0_33.333%]">
            <article className="flex h-full min-h-[330px] flex-col rounded-[24px] border border-white/10 bg-[#0B1428] p-7 shadow-xl">
              <div className="flex gap-1 text-amber-400" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, index) => <Star key={index} size={18} fill="currentColor" aria-hidden="true" />)}
              </div>
              <blockquote className="mt-7 flex-1 text-base leading-8 text-white/70">“{review.text}”</blockquote>
              <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
                <img src={review.photo} alt={review.name} className="h-14 w-14 rounded-full object-cover object-top" />
                <p className="font-bold text-white">{review.name}</p>
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-7 flex justify-center gap-2" aria-label="Written testimonial slides">
      {reviews.map((review, index) => (
        <button key={review.name} type="button" onClick={() => reviewApi?.scrollTo(index)} aria-label={`Go to written testimonial ${index + 1}`} className={`h-2.5 rounded-full transition-all ${reviewIndex === index ? "w-8 bg-orange-500" : "w-2.5 bg-white/20 hover:bg-white/35"}`} />
      ))}
    </div>
  </div>
</section>

{mounted && selectedVideo &&
  createPortal(
    <div
      onClick={() => setSelectedVideo(null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(720px, 88vw)",
          maxHeight: "78vh",
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={() => setSelectedVideo(null)}
          aria-label="Close video"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            width: "42px",
            height: "42px",
            borderRadius: "9999px",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.65)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={22} />
        </button>

        {/* VIDEO */}
        <video
          key={selectedVideo}
          src={selectedVideo}
          controls
          autoPlay
          playsInline
          preload="metadata"
          style={{
            display: "block",
            width: "100%",
            maxHeight: "78vh",
            borderRadius: "20px",
            objectFit: "contain",
            background: "#000",
            boxShadow: "0 30px 100px rgba(0,0,0,0.65)",
          }}
        />
      </div>
    </div>,
    document.body
  )
}
{/* ================= HOW IT WORKS ================= */}
<motion.section
  initial={{ opacity: 0, y: 60 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.7,
    ease: "easeOut",
  }}
  viewport={{ once: true, amount: 0.15 }}
  className="preview-how relative z-10 py-24 md:py-32"
>
  <div
    style={{
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "0 24px",
    }}
  >

    {/* ================= HEADER ================= */}
    <div
      style={{
        maxWidth: "850px",
        marginBottom: "64px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "9px 16px",
          borderRadius: "999px",
          border: "1px solid rgba(255,138,69,0.25)",
          background: "rgba(255,138,69,0.07)",
          color: "#FF9B55",
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        How Auctor Works
      </div>

      <h2
        style={{
          marginTop: "22px",
          fontSize: "clamp(42px, 5.5vw, 72px)",
          lineHeight: "0.98",
          letterSpacing: "-0.055em",
          fontWeight: 900,
          color: "#FFFFFF",
        }}
      >
        Don't just practice RC.
        <br />
        <span style={{ color: "#FF8A45" }}>
          Train how you read.
        </span>
      </h2>

      <p
        style={{
          marginTop: "24px",
          maxWidth: "700px",
          fontSize: "18px",
          lineHeight: "1.8",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        Every practice session becomes part of a learning loop —
        practice, understand your mistakes, identify the gap, and
        train it deliberately.
      </p>
    </div>

    {/* ================= MAIN BLUE PANEL ================= */}
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "36px",
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(135deg, #185EAE 0%, #124B91 55%, #0B3978 100%)",
        boxShadow: "0 35px 100px rgba(0,0,0,0.35)",
      }}
    >

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "rgba(95,220,255,0.10)",
          filter: "blur(100px)",
          top: "-250px",
          right: "-150px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255,138,69,0.08)",
          filter: "blur(100px)",
          bottom: "-250px",
          left: "-100px",
          pointerEvents: "none",
        }}
      />

      {/* PANEL CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(32px, 5vw, 64px)",
        }}
      >

        {/* TOP PANEL LABEL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "52px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#9DEFFF",
              }}
            >
              The Auctor Learning Loop
            </div>

            <h3
              style={{
                marginTop: "10px",
                fontSize: "clamp(28px, 3vw, 42px)",
                lineHeight: "1.05",
                letterSpacing: "-0.04em",
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              Every mistake becomes a training signal.
            </h3>
          </div>

          <div
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              background: "rgba(8,44,91,0.55)",
              border: "1px solid rgba(157,239,255,0.18)",
              color: "#DDFBFF",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Practice → Diagnose → Improve
          </div>
        </div>

        {/* ================= STEPS ================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "16px",
          }}
          className="how-it-works-grid"
        >

          {/* STEP 1 */}
          <div
            style={{
              position: "relative",
              padding: "28px",
              minHeight: "270px",
              borderRadius: "26px",
              background: "rgba(8,55,112,0.72)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  color: "#FF9B55",
                  letterSpacing: "0.1em",
                }}
              >
                01
              </span>

              <Brain
                size={22}
                style={{ color: "#9DEFFF" }}
              />
            </div>

            <h4
              style={{
                marginTop: "52px",
                fontSize: "30px",
                lineHeight: "1",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
              }}
            >
              Practice
            </h4>

            <p
              style={{
                marginTop: "14px",
                fontSize: "14px",
                lineHeight: "1.7",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              Solve RCs through focused, adaptive practice.
            </p>
          </div>

          {/* STEP 2 */}
          <div
            style={{
              position: "relative",
              padding: "28px",
              minHeight: "270px",
              borderRadius: "26px",
              background: "rgba(8,55,112,0.72)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  color: "#FF9B55",
                  letterSpacing: "0.1em",
                }}
              >
                02
              </span>

              <Sparkles
                size={22}
                style={{ color: "#9DEFFF" }}
              />
            </div>

            <h4
              style={{
                marginTop: "52px",
                fontSize: "30px",
                lineHeight: "1",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
              }}
            >
              Diagnose
            </h4>

            <p
              style={{
                marginTop: "14px",
                fontSize: "14px",
                lineHeight: "1.7",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              Understand the reasoning behind your answers.
            </p>
          </div>

          {/* STEP 3 */}
          <div
            style={{
              position: "relative",
              padding: "28px",
              minHeight: "270px",
              borderRadius: "26px",
              background: "rgba(8,55,112,0.72)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  color: "#FF9B55",
                  letterSpacing: "0.1em",
                }}
              >
                03
              </span>

              <Eye
                size={22}
                style={{ color: "#9DEFFF" }}
              />
            </div>

            <h4
              style={{
                marginTop: "52px",
                fontSize: "30px",
                lineHeight: "1",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
              }}
            >
              Understand
            </h4>

            <p
              style={{
                marginTop: "14px",
                fontSize: "14px",
                lineHeight: "1.7",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              See where inference, elimination or interpretation breaks.
            </p>
          </div>

          {/* STEP 4 — HIGHLIGHT */}
          <div
            style={{
              position: "relative",
              padding: "28px",
              minHeight: "270px",
              borderRadius: "26px",
              background:
                "linear-gradient(145deg, #0B3978, #082D61)",
              border: "1px solid rgba(141,235,255,0.45)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  color: "#FF9B55",
                  letterSpacing: "0.1em",
                }}
              >
                04
              </span>

              <Target
                size={22}
                style={{ color: "#FF9B55" }}
              />
            </div>

            <h4
              style={{
                marginTop: "52px",
                fontSize: "30px",
                lineHeight: "1",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#9DEFFF",
              }}
            >
              Improve
            </h4>

            <p
              style={{
                marginTop: "14px",
                fontSize: "14px",
                lineHeight: "1.7",
                color: "rgba(255,255,255,0.68)",
              }}
            >
              Train the exact gap instead of simply doing more questions.
            </p>
          </div>

        </div>

        {/* ================= BOTTOM STATEMENT ================= */}
        <div
          style={{
            marginTop: "52px",
            paddingTop: "30px",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "30px",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              maxWidth: "760px",
              fontSize: "clamp(20px, 2.4vw, 30px)",
              lineHeight: "1.3",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "#FFFFFF",
            }}
          >
            The objective is not more practice.
            <span style={{ color: "#FF9B55" }}>
              {" "}It is better practice.
            </span>
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#9DEFFF",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#FF9B55",
                boxShadow: "0 0 14px rgba(255,138,69,0.7)",
              }}
            />
            Train the thinking
          </div>
        </div>

      </div>
    </div>

  </div>

  {/* ================= RESPONSIVE ================= */}
  <style jsx>{`
    @media (max-width: 900px) {
      .how-it-works-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 600px) {
      .how-it-works-grid {
        grid-template-columns: 1fr !important;
      }

      .how-it-works-grid > div {
        min-height: 0 !important;
        padding: 20px !important;
      }

      .how-it-works-grid > div h4 {
        margin-top: 22px !important;
        font-size: 24px !important;
      }
    }
  `}</style>

  <div
  style={{
    width: "100%",
    maxWidth: "1200px",
    margin: "48px auto 0",
    padding: "28px 30px",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.035)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap",
    boxSizing: "border-box",
  }}
>
  <div>
    <p
      style={{
        margin: 0,
        fontSize: "20px",
        fontWeight: 800,
        color: "#FFFFFF",
      }}
    >
      Ready to see how you read?
    </p>

    <p
      style={{
        margin: "6px 0 0",
        fontSize: "14px",
        color: "rgba(255,255,255,0.50)",
      }}
    >
      Start your free trial or talk to us first.
    </p>
  </div>

  <div
    style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    }}
  >
    <button
      type="button"
      onClick={startFreeTrial}
      style={{
        backgroundColor: "#FF8A45",
        color: "#FFFFFF",
      }}
      className="rounded-xl px-6 py-3 font-bold transition hover:-translate-y-0.5"
    >
      Start Free Trial
    </button>

    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        border: "1px solid rgba(37,211,102,0.30)",
        color: "#7CFFA8",
        backgroundColor: "rgba(37,211,102,0.06)",
      }}
      className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition"
    >
      <img
        src="/whatsapp.svg"
        alt=""
        style={{ width: "18px", height: "18px" }}
      />
      WhatsApp
    </a>
  </div>
</div>
</motion.section>

{/* ================= PRICING ================= */}
<section
  id="pricing"
  className="preview-pricing"
  style={{
    position: "relative",
    padding: "100px 24px",
    overflow: "hidden",
  }}
>
  {/* Ambient glow */}
  <div
    style={{
      position: "absolute",
      width: "500px",
      height: "500px",
      borderRadius: "50%",
      background: "rgba(24,94,174,0.14)",
      filter: "blur(140px)",
      top: "-220px",
      left: "50%",
      transform: "translateX(-50%)",
      pointerEvents: "none",
    }}
  />

  <div
    style={{
      position: "relative",
      zIndex: 2,
      width: "100%",
      maxWidth: "1280px",
      margin: "0 auto",
      boxSizing: "border-box",
    }}
  >

    {/* HEADER */}
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "9px 16px",
          borderRadius: "999px",
          border: "1px solid rgba(255,138,69,0.25)",
          background: "rgba(255,138,69,0.07)",
          color: "#FF9B55",
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Simple Pricing
      </div>

      <h2
        style={{
          marginTop: "20px",
          fontSize: "clamp(42px, 5.5vw, 68px)",
          lineHeight: "0.98",
          letterSpacing: "-0.055em",
          fontWeight: 900,
          color: "#FFFFFF",
        }}
      >
        Train smarter.
        <br />
        <span style={{ color: "#FF8A45" }}>
          Choose your plan.
        </span>
      </h2>

      <p
        style={{
          maxWidth: "680px",
          margin: "24px auto 0",
          fontSize: "18px",
          lineHeight: "1.75",
          color: "rgba(255,255,255,0.58)",
        }}
      >
        Start with the plan that fits your preparation and get complete
        access to Auctor RC's AI-powered reading intelligence tools.
      </p>
    </div>


    {/* PRICING CARDS */}
    <div
      className="preview-pricing-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "16px",
        marginTop: "60px",
      }}
    >

      {/* MONTHLY */}
      <div
        style={{
          position: "relative",
          minHeight: "360px",
          padding: "30px",
          borderRadius: "28px",
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "linear-gradient(145deg, rgba(17,27,48,0.96), rgba(9,17,32,0.96))",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Monthly
        </p>

        <h3
          style={{
            margin: "20px 0 0",
            fontSize: "42px",
            lineHeight: "1",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
          }}
        >
          ₹399
        </h3>

        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.48)",
          }}
        >
          Perfect to get started
        </p>

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            margin: "28px 0",
          }}
        />

        <div
          style={{
            fontSize: "14px",
            lineHeight: "2",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          Full Auctor RC access
          <br />
          AI-powered practice
          <br />
          Performance insights
        </div>

        <button
          type="button"
          onClick={startFreeTrial}
          style={{
            marginTop: "auto",
            width: "100%",
            padding: "14px 18px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Start Free Trial
        </button>
      </div>


      {/* QUARTERLY — FEATURED */}
      <div
        style={{
          position: "relative",
          minHeight: "360px",
          padding: "30px",
          borderRadius: "28px",
          border: "1px solid rgba(141,235,255,0.45)",
          background:
            "linear-gradient(145deg, #185EAE 0%, #124B91 55%, #0B3978 100%)",
          boxShadow: "0 25px 70px rgba(24,94,174,0.22)",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          transform: "translateY(-8px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            padding: "7px 11px",
            borderRadius: "999px",
            background: "#FF8A45",
            color: "#FFFFFF",
            fontSize: "10px",
            fontWeight: 900,
            letterSpacing: "0.12em",
          }}
        >
          POPULAR
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9DEFFF",
          }}
        >
          Quarterly
        </p>

        <h3
          style={{
            margin: "20px 0 0",
            fontSize: "42px",
            lineHeight: "1",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
          }}
        >
          ₹999
        </h3>

        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          Most Popular
        </p>

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.16)",
            margin: "28px 0",
          }}
        />

        <div
          style={{
            fontSize: "14px",
            lineHeight: "2",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Full Auctor RC access
          <br />
          AI-powered practice
          <br />
          Performance insights
        </div>

        <button
          type="button"
          onClick={startFreeTrial}
          style={{
            marginTop: "auto",
            width: "100%",
            padding: "14px 18px",
            borderRadius: "14px",
            border: "none",
            background: "#FF8A45",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 12px 30px rgba(255,138,69,0.22)",
          }}
        >
          Start Free Trial
        </button>
      </div>


      {/* HALF YEARLY */}
      <div
        style={{
          position: "relative",
          minHeight: "360px",
          padding: "30px",
          borderRadius: "28px",
          border: "1px solid rgba(141,235,255,0.16)",
          background:
            "linear-gradient(145deg, rgba(17,27,48,0.96), rgba(9,17,32,0.96))",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9DEFFF",
          }}
        >
          Half-Yearly
        </p>

        <h3
          style={{
            margin: "20px 0 0",
            fontSize: "42px",
            lineHeight: "1",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
          }}
        >
          ₹1299
        </h3>

        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.48)",
          }}
        >
          Best Value
        </p>

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            margin: "28px 0",
          }}
        />

        <div
          style={{
            fontSize: "14px",
            lineHeight: "2",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          Full Auctor RC access
          <br />
          AI-powered practice
          <br />
          Performance insights
        </div>

        <button
          type="button"
          onClick={startFreeTrial}
          style={{
            marginTop: "auto",
            width: "100%",
            padding: "14px 18px",
            borderRadius: "14px",
            border: "1px solid rgba(141,235,255,0.18)",
            background: "rgba(141,235,255,0.06)",
            color: "#DDFBFF",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Start Free Trial
        </button>
      </div>


      {/* YEARLY */}
      <div
        style={{
          position: "relative",
          minHeight: "360px",
          padding: "30px",
          borderRadius: "28px",
          border: "1px solid rgba(255,138,69,0.28)",
          background:
            "linear-gradient(145deg, rgba(25,28,42,0.98), rgba(10,17,31,0.98))",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            padding: "7px 11px",
            borderRadius: "999px",
            background: "rgba(255,138,69,0.12)",
            border: "1px solid rgba(255,138,69,0.25)",
            color: "#FF9B55",
            fontSize: "10px",
            fontWeight: 900,
            letterSpacing: "0.12em",
          }}
        >
          MAXIMUM SAVINGS
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#FF9B55",
          }}
        >
          Yearly
        </p>

        <h3
          style={{
            margin: "20px 0 0",
            fontSize: "42px",
            lineHeight: "1",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
          }}
        >
          ₹1999
        </h3>

        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.48)",
          }}
        >
          Maximum Savings
        </p>

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            margin: "28px 0",
          }}
        />

        <div
          style={{
            fontSize: "14px",
            lineHeight: "2",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          Full Auctor RC access
          <br />
          AI-powered practice
          <br />
          Performance insights
        </div>

        <button
          type="button"
          onClick={startFreeTrial}
          style={{
            marginTop: "auto",
            width: "100%",
            padding: "14px 18px",
            borderRadius: "14px",
            border: "none",
            background: "#FF8A45",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 12px 30px rgba(255,138,69,0.18)",
          }}
        >
          Start Free Trial
        </button>
      </div>

    </div>


    {/* BOTTOM MICRO CTA */}
    <div
      style={{
        marginTop: "34px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "rgba(255,255,255,0.42)",
        }}
      >
        Not sure which plan is right for you?
      </p>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "12px",
          color: "#9DEFFF",
          fontSize: "14px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <img
          src="/whatsapp.svg"
          alt=""
          style={{
            width: "18px",
            height: "18px",
          }}
        />
        Talk to us on WhatsApp
        <ArrowRight size={16} />
      </a>
    </div>

  </div>


  {/* RESPONSIVE */}
  <style jsx>{`
    @media (max-width: 1100px) {
      .preview-pricing-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 640px) {
      .preview-pricing-grid {
        display: flex !important;
        grid-template-columns: none !important;
        gap: 14px !important;
        margin-left: -4px;
        margin-right: -4px;
        padding: 8px 4px 14px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scroll-padding-inline: 4px;
        scrollbar-width: none;
        overscroll-behavior-inline: contain;
        -webkit-overflow-scrolling: touch;
      }

      .preview-pricing-grid::-webkit-scrollbar {
        display: none;
      }

      .preview-pricing-grid > div {
        flex: 0 0 calc(100% - 64px);
        scroll-snap-align: start;
        transform: none !important;
        min-height: 340px !important;
      }
    }
  `}</style>
</section>

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
   className="preview-community relative isolate z-10 px-6 py-20"
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
<div className="preview-community-cards mt-16 grid gap-8 md:grid-cols-3">

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
  className="preview-product relative isolate z-10 pt-44 pb-28"
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
      Daily workouts, speed training, Birbal AI mentoring and deep analytics ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â
      everything designed to improve VARC performance.
    </p>

  </div>

  {/* TOP TABS */}
  <div className="preview-product-tabs mb-10 flex flex-wrap gap-4" role="tablist" aria-label="Auctor product views">

  <button
    onClick={() => setActiveTab("workout")}
    role="tab"
    aria-selected={activeTab === "workout"}
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
    role="tab"
    aria-selected={activeTab === "speed"}
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
    role="tab"
    aria-selected={activeTab === "birbal"}
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
    role="tab"
    aria-selected={activeTab === "analytics"}
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
    <div className="preview-product-panel grid items-center gap-16 md:grid-cols-2">

      {/* LEFT */}
     <div>

  

  {/* TITLE */}
  <h2 className="mb-8 text-5xl font-bold leading-tight text-white">

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

<div
  className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center"
>

  <button
    type="button"
    onClick={startFreeTrial}
    style={{
      backgroundColor: "#FF8A45",
      color: "#FFFFFF",
      boxShadow: "0 14px 35px rgba(255,138,69,0.20)",
    }}
    className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 font-bold transition hover:-translate-y-0.5"
  >
    Start Your Free Trial
    <ArrowRight size={18} />
  </button>

  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      border: "1px solid rgba(37,211,102,0.30)",
      backgroundColor: "rgba(37,211,102,0.06)",
      color: "#7CFFA8",
    }}
    className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-semibold transition hover:bg-[rgba(37,211,102,0.12)]"
  >
    <img
      src="/whatsapp.svg"
      alt=""
      style={{ width: "19px", height: "19px" }}
    />
    Talk to us
  </a>

</div>
    </div>

  </div>
   

</motion.section>

<section
  className="preview-final-cta"
  style={{
    padding: "80px 24px",
  }}
>
  <div
    style={{
      width: "100%",
      maxWidth: "1280px",
      margin: "0 auto",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "36px",
        padding: "90px 40px",
        textAlign: "center",
        background:
          "linear-gradient(135deg, #0B3978 0%, #124B91 50%, #185EAE 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.30)",
        boxSizing: "border-box",
      }}
    >

      {/* subtle glow */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "rgba(95,220,255,0.10)",
          filter: "blur(120px)",
          top: "-300px",
          right: "-150px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255,138,69,0.08)",
          filter: "blur(110px)",
          bottom: "-250px",
          left: "-150px",
          pointerEvents: "none",
        }}
      />

      {/* CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >

        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#9DEFFF",
          }}
        >
          START TRAINING DIFFERENTLY
        </p>

        <h2
          style={{
            marginTop: "18px",
            marginBottom: 0,
            fontSize: "clamp(42px, 6vw, 72px)",
            lineHeight: "0.98",
            letterSpacing: "-0.05em",
            fontWeight: 900,
            color: "#FFFFFF",
          }}
        >
          Stop doing more RCs.
          <br />
          <span style={{ color: "#FF9B55" }}>
            Start understanding them.
          </span>
        </h2>

        <p
          style={{
            maxWidth: "650px",
            margin: "24px auto 0",
            fontSize: "18px",
            lineHeight: "1.7",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          Experience Auctor RC and see how a more intelligent approach to
          Reading Comprehension can change the way you practise.
        </p>

        <div
          style={{
            marginTop: "36px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >

          <button
            type="button"
            onClick={startFreeTrial}
            style={{
              backgroundColor: "#FF8A45",
              color: "#FFFFFF",
              boxShadow: "0 18px 45px rgba(255,138,69,0.25)",
              border: "none",
              cursor: "pointer",
            }}
            className="rounded-2xl px-8 py-4 font-bold transition hover:-translate-y-0.5"
          >
            Start Your Free Trial
          </button>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "#FFFFFF",
              textDecoration: "none",
            }}
            className="inline-flex items-center gap-2 rounded-2xl px-7 py-4 font-semibold transition hover:bg-white/15"
          >
            <img
              src="/whatsapp.svg"
              alt=""
              style={{
                width: "20px",
                height: "20px",
              }}
            />
            Connect on WhatsApp
          </a>

        </div>

      </div>
    </div>
  </div>
</section>




<FaqSection />
<PreviewFooter/>
    </main>
  );
}
