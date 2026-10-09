'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import SubscribeButton from '@/components/SubscribeButton'
import s from './arena.module.css'

const CAT_EXAM = new Date('2026-11-29T00:00:00+05:30').getTime()

export default function BootcampOffer() {
  const [access, setAccess] = useState(null)
  const [user, setUser] = useState(null)
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [{ data: { user: currentUser } }, { data: { session } }] = await Promise.all([
          supabase.auth.getUser(), supabase.auth.getSession(),
        ])
        if (!session?.access_token) return
        const response = await fetch('/api/bootcamp/access', { cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}` } })
        if (!response.ok) return
        const result = await response.json()
        if (active) { setAccess(result); setUser(currentUser) }
      } catch { /* The server remains authoritative for access. */ }
    }
    load()
    return () => { active = false }
  }, [])

  if (access?.source !== 'first_free') return null
  const daysLeft = Math.max(1, Math.ceil((CAT_EXAM - Date.now()) / 86400000))
  return <aside className={s.bootcampOffer} aria-label="Unlock the full Bootcamp">
    <div><p className={s.offerEyebrow}>PERSONAL DAY 1 FREE · DAYS 2–45 LOCKED</p>
      <h2>Unlock the full 45-Day Bootcamp</h2>
      <p>Continue your guided VARC training for CAT 2026. CAT is {daysLeft} days away.</p>
    </div>
    <div className={s.offerPrice}><del>₹999</del><strong>₹799</strong><small>Current Bootcamp offer</small>
      {user ? <SubscribeButton amount={799} plan="bootcamp_full_access" label="Unlock all 45 days" user={user} returnTo="/boot-camp" /> : <a href="/login?next=bootcamp">Log in to unlock</a>}
    </div>
  </aside>
}
