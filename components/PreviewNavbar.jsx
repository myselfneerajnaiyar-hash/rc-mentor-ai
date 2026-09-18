"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react"

export default function PreviewNavbar() {

  const router = useRouter();
  const pathname = usePathname();
  const hideLogin = pathname === "/preview-ad";

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>

      {/* NAVBAR */}

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#081120]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:h-20 sm:px-6">

          {/* LOGO */}

          <div
  onClick={() => router.push("/preview")}
  className="flex min-w-0 items-center gap-2 cursor-pointer sm:gap-3"
>

  <img
  src="/logo.png"
  alt="Auctor RC Logo"
  className="h-9 w-9 shrink-0 object-contain rounded-xl bg-white/[0.03] p-1 sm:h-11 sm:w-11 sm:p-1.5"
/>

  <div>

    <h1 className="whitespace-nowrap text-lg font-bold tracking-tight text-white sm:text-2xl">
      Auctor RC
    </h1>

    <p className="mt-0.5 hidden text-xs text-white/40 min-[390px]:block sm:mt-1">
      Powered by Birbal AI
    </p>

  </div>

</div>
        {/* DESKTOP LINKS */}

<div className="hidden md:flex items-center gap-10 ml-12 text-sm font-medium text-slate-300">

  <a href="/about" className="hover:text-orange-400 transition">
    About Us
  </a>

  <a href="/preview/pricing" className="hover:text-orange-400 transition">
    Pricing
  </a>

  <a href="/contact" className="hover:text-orange-400 transition">
    Contact
  </a>

</div>

{/* MOBILE MENU ICON */}

<button
  type="button"
  onClick={() => setMenuOpen(!menuOpen)}
  aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
  aria-expanded={menuOpen}
  className="order-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 md:hidden"
>

  {menuOpen ? (
    <X size={20} className="text-white" />
  ) : (
    <Menu size={20} className="text-white" />
  )}

</button>

          {/* LOGIN */}

          {!hideLogin && (
            <button
              onClick={() => router.push("/login")}
              className="ml-auto rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 sm:rounded-2xl sm:px-5 sm:py-2.5"
            >
              Login
            </button>
          )}

        </div>

      </header>

      {/* MOBILE DROPDOWN */}

{menuOpen && (

  <div className="fixed left-0 right-0 top-16 z-40 border-b border-white/10 bg-[#081120]/95 backdrop-blur-xl sm:top-20 md:hidden">

    <div className="flex flex-col px-6 py-6 text-white">

      <a
        href="/about"
        className="py-4 border-b border-white/5 text-lg"
      >
        About Us
      </a>

      <a
        href="/preview/pricing"
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

    </>
  );
}
