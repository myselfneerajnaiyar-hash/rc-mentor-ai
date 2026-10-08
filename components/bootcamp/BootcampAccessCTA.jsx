'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function attributedPath(path) {
  const query = new URLSearchParams(window.location.search)
  query.set('next', 'bootcamp')
  return `${path}?${query.toString()}`
}

export default function BootcampAccessCTA({ href, location, className = '', children = 'Start Day 1 for free', tabIndex }) {
  const [destination, setDestination] = useState(href)

  useEffect(() => {
    let active = true
    async function resolve() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!active) return
        setDestination(attributedPath(session?.access_token ? '/welcome' : '/bootcamp-2026/signup'))
      } catch { /* The server will resolve access when the CTA is followed. */ }
    }
    resolve()
    return () => { active = false }
  }, [])

  return <a href={destination} className={className} tabIndex={tabIndex} data-cta={location}
    onClick={() => { if (typeof window !== 'undefined' && window.posthog?.capture) window.posthog.capture('bootcamp_cta_click', { location, days_left: Math.max(1, Math.ceil((new Date('2026-11-29T00:00:00+05:30').getTime() - Date.now()) / 86400000)) }) }}>
    <span>{children}</span><span aria-hidden="true">→</span>
  </a>
}
