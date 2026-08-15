"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { AUCTOR_BRANDING } from "@/lib/tenant/branding"
import { getExamCapabilities } from "@/lib/tenant/capabilities"

const TenantContext = createContext(null)

export default function TenantProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, profile: null, institute: null, tenant: null, branding: AUCTOR_BRANDING, exam: "Unassigned", capabilities: getExamCapabilities(null), access: "pending" })

  useEffect(() => {
    let active = true
    async function load(session) {
      const publicResponse = await fetch("/api/tenant-context", { cache: "no-store" })
      const publicContext = publicResponse.ok ? await publicResponse.json() : null
      if (!active) return
      if (!publicContext) {
        setState((current) => ({ ...current, loading: false, access: "unknown_hostname" }))
        return
      }
      if (!session?.access_token) {
        setState((current) => ({ ...current, loading: false, tenant: publicContext.tenant, branding: publicContext.branding, access: "guest" }))
        return
      }
      const response = await fetch("/api/session-context", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" })
      const context = await response.json().catch(() => null)
      if (!active) return
      if (!response.ok) {
        setState((current) => ({ ...current, loading: false, tenant: publicContext.tenant, branding: publicContext.branding, access: context?.error || "denied" }))
        return
      }
      setState({ ...context, loading: false, access: "allowed" })
    }

    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => load(session))
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const branding = state.branding || AUCTOR_BRANDING
    document.documentElement.style.setProperty("--brand-primary", branding.primaryColor)
    document.documentElement.style.setProperty("--brand-secondary", branding.secondaryColor)
    const favicon = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }))
    favicon.href = branding.faviconUrl
  }, [state.branding])

  const value = useMemo(() => state, [state])
  if (state.loading) return <TenantLoading />
  if (!state.loading && state.access === "unknown_hostname") return <TenantError title="Unknown institute hostname" message="This learning portal is not configured." />
  if (!state.loading && !["pending", "guest", "allowed"].includes(state.access)) return <TenantError title="Access denied" message="Your account does not belong to this institute." />
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

function TenantLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Loading your learning portal…</main>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) throw new Error("useTenant must be used within TenantProvider")
  return context
}

function TenantError({ title, message }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white"><div className="max-w-md text-center"><h1 className="text-3xl font-bold">{title}</h1><p className="mt-3 text-slate-400">{message}</p><a href="https://rc.auctorlabs.in/login" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold">Go to Auctor RC</a></div></main>
}
