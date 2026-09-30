'use client'

import { useEffect, useState } from 'react'
import { buildAttributedPath, mergeAttribution } from '@/lib/attribution.mjs'

const STORAGE_KEY = 'auctor.signup-attribution.v1'

function cookieValue(name) {
  const pair = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))
  if (!pair) return ''
  try { return decodeURIComponent(pair.slice(name.length + 1)) } catch { return '' }
}

export default function PreviewAdInteractions({ signupHref }) {
  const [showSticky, setShowSticky] = useState(false)
  const [currentHref, setCurrentHref] = useState(signupHref)

  useEffect(() => {
    let stored = null
    try { stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') } catch { /* Ignore unavailable or malformed local storage. */ }
    const attribution = mergeAttribution(new URLSearchParams(window.location.search), stored, {
      fbc: cookieValue('_fbc'),
      fbp: cookieValue('_fbp'),
    })
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution)) } catch { /* Navigation still carries this visit's query values. */ }
    const href = buildAttributedPath('/signup', attribution)
    setCurrentHref(href)
    document.querySelectorAll('a[data-signup-cta]').forEach(link => link.setAttribute('href', href))

    const primary = document.getElementById('primary-signup-cta')
    if (!primary) return
    if (!('IntersectionObserver' in window)) {
      const update = () => setShowSticky(window.scrollY > primary.getBoundingClientRect().bottom + window.scrollY)
      update()
      window.addEventListener('scroll', update, { passive: true })
      return () => window.removeEventListener('scroll', update)
    }
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), { threshold: 0.15 })
    observer.observe(primary)
    return () => observer.disconnect()
  }, [signupHref])

  if (!showSticky) return null
  return <div className="ad-sticky-cta" role="region" aria-label="Start your free trial">
    <a href={currentHref} data-signup-cta>Start your free trial <span aria-hidden="true">→</span></a>
  </div>
}
