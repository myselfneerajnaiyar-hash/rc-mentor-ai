"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function PaymentSuccess() {

  const router = useRouter()
  const [returnTo, setReturnTo] = useState("")

  useEffect(() => {
    const destination = new URLSearchParams(window.location.search).get("returnTo") === "/boot-camp" ? "/boot-camp" : "/"
    setReturnTo(destination === "/boot-camp" ? destination : "")

    const timer = setTimeout(() => {

      window.location.href = destination

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

        {returnTo === "/boot-camp" && <a className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white" href="/boot-camp">Start your full Boot Camp →</a>}

      </div>

    </main>

  )
}
