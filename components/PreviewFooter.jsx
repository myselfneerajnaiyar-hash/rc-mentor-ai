"use client";
import { useRouter } from "next/navigation"

import {
  Instagram,
  Send,
  MessageCircle,
} from "lucide-react";

export default function PreviewFooter() {
    const router = useRouter()
  return (
    <footer className="relative isolate z-10 border-t border-white/10 bg-[#050816] mt-32">

      <div className="mx-auto max-w-7xl px-6 py-20">

        {/* TOP */}
        <div className="grid gap-16 md:grid-cols-2 items-start">

          {/* LEFT */}
          <div>

            <div className="inline-flex rounded-full border border-cyan-500/10 bg-cyan-500/[0.04] px-4 py-2 text-sm text-cyan-200">
              Auctor RC
            </div>

            <h2 className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">

              Train reading intelligence.
              <br />

              Not just RC familiarity.

            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/45">

              Adaptive RC drills, Birbal AI diagnosis,
              reading cognition analytics and CAT-level
              improvement systems.

            </p>

            {/* CTA */}
            <button 
             onClick={() => router.push("/login")}
            className="mt-10 rounded-2xl bg-orange-500 px-8 py-4 font-semibold text-white transition hover:scale-[1.02] hover:bg-orange-400">

              Start Free 3 Days Trial

            </button>

          </div>

          {/* RIGHT */}
          <div className="grid grid-cols-2 gap-10">

            {/* PRODUCT */}
            <div>

              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
                Product
              </h3>

             
             <div className="mt-6 space-y-4 text-white/70">

                <div className="hover:text-white transition cursor-pointer">
                  Adaptive RC
                </div>

                <div className="hover:text-white transition cursor-pointer">
                  Birbal AI
                </div>

                <div className="hover:text-white transition cursor-pointer">
                  Analytics
                </div>

                <div className="hover:text-white transition cursor-pointer">
                  RC Workouts
                </div>

              </div>

            </div>

            {/* SOCIAL */}
            <div>

              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
                Community
              </h3>

             <div className="mt-6 space-y-5">

  {/* INSTAGRAM */}
  <a
    href="https://instagram.com/auctorlabs.in"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 text-white/70 hover:text-pink-400 transition"
  >
    <Instagram size={18} />
    Instagram
  </a>

  {/* TELEGRAM */}
  <a
    href="https://t.me/auctorlab"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 text-white/70 hover:text-cyan-400 transition"
  >
    <Send size={18} />
    Telegram
  </a>

  {/* WHATSAPP */}
  <a
    href="https://whatsapp.com/channel/0029VbBakAt8PgsO5RdHQ12L"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 text-white/70 hover:text-emerald-400 transition"
  >
    <MessageCircle size={18} />
    WhatsApp
  </a>

</div>
            </div>

          </div>

        </div>

        {/* BOTTOM */}
        <div className="mt-20 flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/35 md:flex-row md:items-center md:justify-between">

          <div>
            © 2026 Auctor RC. Powered by Birbal AI.
          </div>

          <div className="flex gap-6">

            <div className="hover:text-white transition cursor-pointer">
              Privacy
            </div>

            <div className="hover:text-white transition cursor-pointer">
              Terms
            </div>

            <div className="hover:text-white transition cursor-pointer">
              Contact
            </div>

          </div>

        </div>

      </div>

    </footer>
  );
}