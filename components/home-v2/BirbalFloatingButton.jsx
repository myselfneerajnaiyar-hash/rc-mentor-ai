"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ChatMentor from "@/components/ChatMentor";

export default function BirbalFloatingButton({
    setView,
    chatOpen,
    setChatOpen,
}) {
  
  useEffect(() => {
  document.body.style.overflow = chatOpen ? "hidden" : "";

  return () => {
    document.body.style.overflow = "";
  };
}, [chatOpen]);

 return (
  <>
    {/* Speech Bubble */}

   {!chatOpen && (
  <div
    className="
    hidden md:block

    fixed
    bottom-24
    right-24
    z-[998]

    rounded-2xl
    bg-slate-900/95
    backdrop-blur-xl
    border
    border-slate-700

    px-4
    py-3

    text-sm
    text-white

    shadow-xl
    animate-bounce
    "
  >

<div className="font-semibold">
👋 Need help?
</div>

<div className="text-xs text-slate-400 mt-1">
Ask Birbal anything about RC.
</div>

</div>
    )}

    {/* Floating Button */}

    <button
    onClick={() => setChatOpen(true)}
      className="
      fixed
      bottom-24
      md:bottom-6
      right-6
      z-[999]
      h-16
      w-16
      rounded-full
      overflow-hidden
      ring-2
      ring-indigo-400/60
      shadow-[0_0_35px_rgba(99,102,241,0.55)]
      animate-birbal
      transition-all
      hover:scale-110
      "
    >
      <Image
        src="/Birbal avatar.jpeg"
        alt="Birbal"
        fill
        className="object-cover"
      />
    </button>

    {/* Chat */}

  {chatOpen && (
  <div
    className="
      fixed
      inset-0
      z-[1000]

      md:top-auto
      md:left-auto
      md:right-6
      md:bottom-6
      md:w-[420px]
      md:h-[650px]

      flex
      flex-col

      bg-[#101623]
      rounded-[24px]

      md:rounded-[30px]
      overflow-hidden
      border
      border-slate-700

      shadow-[0_30px_80px_rgba(0,0,0,.65)]

      animate-in
      fade-in
      zoom-in-95
      duration-300
    "
  >
  

   <div className="flex-1 min-h-0 flex overflow-hidden">
  <ChatMentor
  setView={setView}
  onClose={() => setChatOpen(false)}
/>
</div>
  </div>
)}
  </>
);
}