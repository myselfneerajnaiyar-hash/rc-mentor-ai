"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react"

export default function PreviewNavbar() {

  const router = useRouter();

 const activities = [
  "Aditi just enrolled",
  "Akash completed Daily Workout",
  "Ritu attempted 2 Vocabulary Drills",
  "Hemang joined 5 mins ago",
  "Sneha completed Precision Drill",
  "Raghav unlocked Birbal AI",
  "Priya solved 2 RC passages",
  "Saksham enrolled 30 mins ago",
  "Kanishka attempted CAT Sectional Test",
  "Tejas has a Daily Workout streak of 6 days",
];

  const [activityIndex, setActivityIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {

    const interval = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % activities.length);
    }, 3500);

    return () => clearInterval(interval);

  }, []);

  return (
    <>

      {/* NAVBAR */}

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#081120]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">

          {/* LOGO */}

          <div
  onClick={() => router.push("/preview")}
  className="flex items-center gap-3 cursor-pointer"
>

  <img
  src="/logo.png"
  alt="Auctor RC Logo"
  className="h-11 w-11 object-contain rounded-xl bg-white/[0.03] p-1.5"
/>

  <div>

    <h1 className="text-2xl font-bold tracking-tight text-white">
      Auctor RC
    </h1>

    <p className="mt-1 text-xs text-white/40">
      Powered by Birbal AI
    </p>

  </div>

</div>
        {/* DESKTOP LINKS */}

<div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-300">

  <a href="/about" className="hover:text-orange-400 transition">
    About Us
  </a>

  <a href="/pricing" className="hover:text-orange-400 transition">
    Pricing
  </a>

  <a href="/contact" className="hover:text-orange-400 transition">
    Contact
  </a>

</div>

{/* MOBILE MENU ICON */}

<button
  onClick={() => setMenuOpen(!menuOpen)}
  className="md:hidden w-11 h-11 rounded-xl border border-slate-700 bg-slate-900/80 flex items-center justify-center"
>

  {menuOpen ? (
    <X size={20} className="text-white" />
  ) : (
    <Menu size={20} className="text-white" />
  )}

</button>

          {/* LOGIN */}

          <button
            onClick={() => router.push("/login")}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
          >
            Login
          </button>

        </div>

      </header>

      {/* MOBILE DROPDOWN */}

{menuOpen && (

  <div className="fixed top-20 left-0 right-0 z-40 md:hidden border-b border-white/10 bg-[#081120]/95 backdrop-blur-xl">

    <div className="flex flex-col px-6 py-6 text-white">

      <a
        href="/about"
        className="py-4 border-b border-white/5 text-lg"
      >
        About Us
      </a>

      <a
        href="/pricing"
        className="py-4 border-b border-white/5 text-lg"
      >
        Pricing
      </a>

      <a
        href="/contact"
        className="py-4 text-lg"
      >
        Contact
      </a>

    </div>

  </div>

)}

      {/* FLOATING ACTIVITY */}

      <div className="fixed top-24 right-6 z-40 hidden md:block">

        <motion.div
          key={activityIndex}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-full border border-cyan-500/20 bg-[#07101F]/80 px-5 py-2 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl"
        >

          <div className="flex items-center gap-3">

            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />

            <p className="text-xs font-medium tracking-wide text-cyan-100">
              {activities[activityIndex]}
            </p>

          </div>

        </motion.div>

      </div>

    </>
  );
}