"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PaymentSuccess() {

  const router = useRouter()

  useEffect(() => {

    const timer = setTimeout(() => {

      window.location.href = "/"

    }, 2500)

    return () => clearTimeout(timer)

  }, [])

  return (

    <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white px-6">

      <div className="max-w-md w-full rounded-3xl border border-emerald-500/20 bg-slate-900 p-10 text-center">

        <div className="text-6xl mb-6">
          🎉
        </div>

        <h1 className="text-3xl font-bold mb-4">
          Premium Unlocked
        </h1>

        <p className="text-slate-400 leading-8">

          Your payment was successful.
          Redirecting you to the dashboard...

        </p>

      </div>

    </main>

  )
}