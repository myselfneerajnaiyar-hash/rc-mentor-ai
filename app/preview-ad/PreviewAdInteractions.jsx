'use client'

import { useEffect, useState } from 'react'
import { buildAttributedPath, persistBrowserAttribution } from '@/lib/attribution.mjs'

export default function PreviewAdInteractions({ signupHref }) {
  const [showSticky, setShowSticky] = useState(false)
  const [currentHref, setCurrentHref] = useState(signupHref)

  useEffect(() => {
    const attribution = persistBrowserAttribution(new URLSearchParams(window.location.search))
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
