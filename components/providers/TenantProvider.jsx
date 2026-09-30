"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { AUCTOR_BRANDING } from "@/lib/tenant/branding"
import { getExamCapabilities } from "@/lib/tenant/capabilities"

import { fetchWithTimeout, withTimeout } from "@/lib/mobile/request"
import Recovery from "@/components/mobile/Recovery"

const TenantContext = createContext(null)

export default function TenantProvider({ children }) {
  const pathname = usePathname()
  // Public auth pages need to be usable before tenant/session lookups complete.
  // The resolved branding still replaces the default as soon as it is available.
  const isPublicAuthRoute = pathname === "/signup" || pathname === "/login"
  const [state, setState] = useState({ loading: true, user: null, profile: null, institute: null, tenant: null, branding: AUCTOR_BRANDING, exam: "Unassigned", capabilities: getExamCapabilities(null), entitlement: { kind: "none", hasAccess: false, isPremium: false, isInstituteStudent: false }, access: "pending" })

  const generation=useRef(0),flight=useRef(null);
  const refreshContext = useCallback(async (providedSession, force = false) => {
      const revision=++generation.current;
      try {
      const session = providedSession === undefined
        ? (await withTimeout(supabase.auth.getSession())).data.session
        : providedSession
      const token=session?.access_token||'guest';
      if(force||flight.current?.token!==token){
        const promise=Promise.all([
          fetchWithTimeout('/api/tenant-context',{cache:'no-store'}),
          session?.access_token?fetchWithTimeout('/api/session-context',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'}):null
        ]).then(async([publicResult,privateResult])=>({publicResponse:{status:publicResult.status,ok:publicResult.ok},publicContext:publicResult.ok?await publicResult.json().catch(()=>null):null,response:privateResult?{status:privateResult.status,ok:privateResult.ok}:null,context:privateResult?await privateResult.json().catch(()=>null):null}));
        flight.current={token,promise};
        promise.finally(()=>{if(flight.current?.promise===promise)flight.current=null;}).catch(()=>{});
      }
      const {publicResponse,publicContext,response,context}=await flight.current.promise;
      if(revision!==generation.current)return;
      if(publicResponse.status >= 500) throw new Error("Your learning portal could not connect. Please retry.")
      if (!publicContext) {
        setState((current) => ({ ...current, loading: false, access: "unknown_hostname" }))
        return
      }
      if (!session?.access_token) {
        setState((current) => ({ ...current, loading: false, user: null, profile: null, tenant: publicContext.tenant, branding: publicContext.branding, access: "guest" }))
        return
      }
      if(response.status >= 500) throw new Error("Your access could not be checked. Please retry.")
      if (!response.ok) {
        setState((current) => ({ ...current, loading: false, tenant: publicContext.tenant, branding: publicContext.branding, access: context?.error || "denied" }))
        return
      }
      setState({ ...context, loading: false, access: "allowed" })
      return context
      } catch(error) { if(revision!==generation.current)return;setState(current=>({...current,loading:false,access:"network_error",error:error.message})); }
  }, [])

  useEffect(() => {
    if (pathname === "/preview-ad") return
    refreshContext()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {setState(current=>current.user?.id&&current.user.id!==session?.user?.id?{...current,loading:true,user:null,profile:null}:current);refreshContext(session);})
    return () => subscription.unsubscribe()
  }, [refreshContext, pathname])

  useEffect(() => {
    const branding = state.branding || AUCTOR_BRANDING
    document.documentElement.style.setProperty("--brand-primary", branding.primaryColor)
    document.documentElement.style.setProperty("--brand-secondary", branding.secondaryColor)
    const favicon = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }))
    favicon.href = branding.faviconUrl
  }, [state.branding])

  const value = useMemo(() => ({ ...state, refreshContext: () => refreshContext(undefined, true) }), [state, refreshContext])
  if (pathname === "/preview-ad") return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  if (!isPublicAuthRoute && state.access === "network_error") return <main className="p-6"><Recovery area="entitlement" message={state.error} onRetry={()=>{setState(current=>({...current,loading:true,access:"pending"}));refreshContext();}}/></main>
  if (!isPublicAuthRoute && state.loading) return <TenantLoading />
  if (!isPublicAuthRoute && !state.loading && state.access === "unknown_hostname") return <TenantError title="Unknown institute hostname" message="This learning portal is not configured." />
  if (!isPublicAuthRoute && !state.loading && !["pending", "guest", "allowed"].includes(state.access)) return <TenantError title="Access denied" message="Your account does not belong to this institute." />
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
  const [loginHref, setLoginHref] = useState("https://rc.auctorlabs.in/login")
  useEffect(() => {
    if (["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
      setLoginHref("/login")
    }
  }, [])
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white"><div className="max-w-md text-center"><h1 className="text-3xl font-bold">{title}</h1><p className="mt-3 text-slate-400">{message}</p><a href={loginHref} className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold">Go to Auctor RC</a></div></main>
}
