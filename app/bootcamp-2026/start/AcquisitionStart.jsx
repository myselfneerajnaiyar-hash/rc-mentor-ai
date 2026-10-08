'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { attributionFromParams, buildAttributedPath } from '@/lib/attribution.mjs'
import s from '../page.module.css'

export default function AcquisitionStart() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState('checking')

  useEffect(() => {
    let active = true
    async function start() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          router.replace(buildAttributedPath('/bootcamp-2026/signup', attributionFromParams(searchParams), { next: 'bootcamp' }))
          return
        }
        const headers = { Authorization: `Bearer ${session.access_token}` }
        const current = await fetch('/api/bootcamp/access', { cache: 'no-store', headers })
        if (current.status === 401) {
          router.replace(buildAttributedPath('/bootcamp-2026/signup', attributionFromParams(searchParams), { next: 'bootcamp' }))
          return
        }
        if (!current.ok) throw new Error('Unable to verify Bootcamp access.')
        const access = await current.json()
        if (access.allowed) {
          router.replace('/boot-camp')
          return
        }
        if (access.canClaimFirstFree) {
          const claim = await fetch('/api/bootcamp/access/claim', { method: 'POST', headers })
          const result = await claim.json().catch(() => ({}))
          if (result.access?.allowed) {
            router.replace('/boot-camp')
            return
          }
        }
        if (active) setState('locked')
      } catch {
        if (active) setState('error')
      }
    }
    start()
    return () => { active = false }
  }, [router, searchParams])

  if (state === 'checking') return <main className={s.placeholder}><p className={s.sectionLabel}>CAT 2026 · VARC BOOT CAMP</p><h1>Checking your Bootcamp access.</h1></main>
  if (state === 'error') return <main className={s.placeholder}><p className={s.sectionLabel}>CAT 2026 · VARC BOOT CAMP</p><h1>We couldn’t verify your access.</h1><p>Please return to the Bootcamp overview and try again.</p><a className={s.cta} href="/bootcamp-2026">Back to the Bootcamp overview</a></main>

  return <main className={s.placeholder}>
    <a className={s.brand} href="/bootcamp-2026"><span className={s.placeholderMark}>A</span><span>Auctor <small>CAT VARC · 2026</small></span></a>
    <p className={s.sectionLabel}>CAT 2026 · VARC BOOT CAMP</p>
    <h1>Your first free Bootcamp has already been claimed.</h1>
    <p>Bootcamp access is locked until you have another active entitlement.</p>
    <div className={s.placeholderOffer}><span>Bootcamp offer</span><strong>₹499</strong><small>Practice access through 4 February 2027</small></div>
    <a className={s.cta} href="/bootcamp-2026">Get Bootcamp — ₹499 <span aria-hidden="true">→</span></a>
  </main>
}
