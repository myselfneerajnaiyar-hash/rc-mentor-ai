"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/**
 * The base pixel sends the initial PageVisit from the global head bootstrap.
 * Next.js client navigations do not reload that bootstrap, so send one event
 * only when the pathname or query string subsequently changes.
 */
export default function RedditPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastLocation = useRef(null)
  const location = `${pathname || "/"}?${searchParams?.toString() || ""}`

  useEffect(() => {
    if (lastLocation.current === null) {
      lastLocation.current = location
      return
    }
    if (lastLocation.current === location) return
    lastLocation.current = location
    window.rdt?.("track", "PageVisit")
  }, [location])

  return null
}
