"use client"
import { useEffect, useState } from "react"
import { fetchWithTimeout, withTimeout } from "@/lib/mobile/request"
import { supabase } from "@/lib/supabase"

export function useDailyRcReview(attemptId, retryKey = 0) {
  const [state, setState] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    setState(null)
    async function load() {
      try {
        if (!attemptId) throw new Error("Choose an attempt from RC History")
        const { data: { session } } = await withTimeout(supabase.auth.getSession())
        if (controller.signal.aborted) return
        if (!session) throw new Error("Sign in to review your attempt")
        const response = await fetchWithTimeout(`/api/daily-rc-review?attemptId=${encodeURIComponent(attemptId)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store", signal: controller.signal,
        })
        const data = await withTimeout(response.json())
        if (!response.ok) throw new Error(data.error || "Unable to load this review")
        if (data.attempt?.id !== attemptId || data.attempt?.user_id !== session.user.id) throw new Error("Review does not match this attempt")
        if (!controller.signal.aborted) setState({ attemptId, data })
      } catch (error) {
        if (!controller.signal.aborted) setState({ attemptId, error: error.message })
      }
    }
    load()
    return () => controller.abort()
  }, [attemptId, retryKey])
  // A route change must never render data from the preceding request.
  return state?.attemptId === attemptId ? state : { data: null, error: null }
}
