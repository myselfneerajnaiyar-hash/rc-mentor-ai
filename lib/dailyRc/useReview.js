"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useDailyRcReview(attemptId) {
  const [state, setState] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        if (!attemptId) throw new Error("Choose an attempt from RC History")
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error("Sign in to review your attempt")
        const response = await fetch(`/api/daily-rc-review?attemptId=${encodeURIComponent(attemptId)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store", signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Unable to load this review")
        if (data.attempt?.id !== attemptId || data.attempt?.user_id !== session.user.id) throw new Error("Review does not match this attempt")
        if (!controller.signal.aborted) setState({ attemptId, data })
      } catch (error) {
        if (!controller.signal.aborted) setState({ attemptId, error: error.message })
      }
    }
    load()
    return () => controller.abort()
  }, [attemptId])
  // A route change must never render data from the preceding request.
  return state?.attemptId === attemptId ? state : { data: null, error: null }
}
