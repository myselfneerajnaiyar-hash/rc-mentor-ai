import Link from "next/link"

export default function CompletionPlansOffer({ className = "" }) {
  return (
    <aside className={`flex flex-col gap-3 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-950/35 via-slate-900/90 to-slate-900/90 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${className}`.trim()} aria-label="Auctor plans offer">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">30% OFF TODAY</p>
        <p className="mt-1 text-sm text-slate-300">Use code <span className="font-bold text-white">AUCTOR30</span></p>
      </div>
      <Link href="/pricing?coupon=AUCTOR30" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:self-auto">
        See Plans <span aria-hidden="true">→</span>
      </Link>
    </aside>
  )
}
