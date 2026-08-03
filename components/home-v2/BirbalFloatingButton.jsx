"use client";

import { useState } from "react";
import Image from "next/image";
import ChatMentor from "@/components/ChatMentor";

export default function BirbalFloatingButton({
    setView
}) {
  const [open, setOpen] = useState(false);

 return (
  <>
    {/* Speech Bubble */}

    {!open && (
      <div
className="
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
      onClick={() => setOpen(true)}
      className="
      fixed
      bottom-6
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

    {open && (
     <div
  className="
fixed
bottom-0
right-0
md:bottom-24
md:right-6
z-[1000]

w-full
md:w-[520px]
max-w-[95vw]

h-[760px]
max-h-[85vh]

rounded-none

md:rounded-[30px]

overflow-hidden

border
border-slate-700

bg-[#101623]

shadow-[0_30px_80px_rgba(0,0,0,.65)]

animate-in
fade-in
zoom-in-95
duration-300
"
>
     <button
onClick={() => setOpen(false)}
className="
absolute
top-4
right-4
z-[9999]

flex
items-center
justify-center

h-11
w-11

rounded-full

bg-black/50
backdrop-blur-md

border
border-white/10

text-white

transition-all

hover:bg-red-500
hover:rotate-90
"
>
✕
</button>

        <ChatMentor setView={setView} />
      </div>
    )}
  </>
);
}