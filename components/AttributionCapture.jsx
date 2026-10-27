'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { persistBrowserAttribution, postHogAttributionProperties } from '@/lib/attribution.mjs'
import posthog from 'posthog-js'

export default function AttributionCapture() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const attribution = persistBrowserAttribution(new URLSearchParams(searchParams.toString()), document.referrer)
    try { posthog.register(postHogAttributionProperties(attribution)) } catch { /* Analytics must not block navigation. */ }
  }, [pathname, searchParams])

  return null
}
