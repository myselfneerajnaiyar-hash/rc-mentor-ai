"use client"

import Link from "next/link"
import { useTenant } from "@/components/providers/TenantProvider"

export default function CapabilityGuard({ capability, children }) {
  const { capabilities } = useTenant()
  if (capabilities?.[capability]) return children

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Not available for your exam</p>
        <h1 className="mt-3 text-2xl font-semibold">This CAT feature is not part of your learning plan.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Return to your dashboard to continue with the tools selected for your exam.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold">Back to dashboard</Link>
      </div>
    </main>
  )
}
