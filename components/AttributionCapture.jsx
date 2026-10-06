'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { persistBrowserAttribution } from '@/lib/attribution.mjs'

export default function AttributionCapture() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    persistBrowserAttribution(new URLSearchParams(searchParams.toString()))
  }, [pathname, searchParams])

  return null
}
