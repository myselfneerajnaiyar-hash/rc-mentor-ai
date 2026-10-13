"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTenant } from "@/components/providers/TenantProvider"
import { supabase } from "@/lib/supabase"
import {
  ANNOUNCEMENT_RIBBON_SESSION_KEY,
  getAnnouncementRibbonAudience,
  getAnnouncementRibbonMessages,
  shouldShowAnnouncementRibbon,
} from "@/lib/announcementRibbon.mjs"
import styles from "./personalized-announcement-ribbon.module.css"

function isPublicBootcampPath(pathname) {
  return pathname === "/bootcamp-2026" || pathname?.startsWith("/bootcamp-2026/")
}

export default function PersonalizedAnnouncementRibbon() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tenant = useTenant()
  const publicBootcamp = isPublicBootcampPath(pathname)
  const [bootcampSession, setBootcampSession] = useState({ ready: false, context: null })
  const [bootcampAccess, setBootcampAccess] = useState({ ready: false, userId: null, access: null })
  const [dismissed, setDismissed] = useState(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [activeMessage, setActiveMessage] = useState(0)
  const [touchPaused, setTouchPaused] = useState(false)

  const loadPublicBootcampContext = useCallback(async (session, isActive) => {
    if (!session?.access_token) {
      if (isActive()) setBootcampSession({ ready: true, context: null })
      return
    }

    try {
      const response = await fetch("/api/session-context", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      })
      const context = response.ok ? await response.json() : null
      if (isActive()) {
        setBootcampSession({
          ready: true,
          context: context?.user?.id === session.user?.id ? context : null,
        })
      }
    } catch {
      if (isActive()) setBootcampSession({ ready: true, context: null })
    }
  }, [])

  useEffect(() => {
    if (!publicBootcamp) return undefined
    let active = true
    const isActive = () => active
    setBootcampSession({ ready: false, context: null })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setBootcampSession({ ready: false, context: null })
      void loadPublicBootcampContext(session, isActive)
    })
    supabase.auth.getSession()
      .then(({ data, error }) => loadPublicBootcampContext(error ? null : data?.session, isActive))
      .catch(() => {
        if (active) setBootcampSession({ ready: true, context: null })
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [publicBootcamp, loadPublicBootcampContext])

  const context = publicBootcamp ? bootcampSession.context : tenant
  const loading = publicBootcamp ? !bootcampSession.ready : tenant.loading
  const accessReady = bootcampAccess.ready && bootcampAccess.userId === context?.user?.id
  const audience = useMemo(() => getAnnouncementRibbonAudience({
    profile: context?.profile,
    exam: context?.exam,
    capabilities: context?.capabilities,
    bootcampAccess: accessReady ? bootcampAccess.access : null,
    bootcampAccessReady: accessReady,
  }), [accessReady, bootcampAccess.access, context?.capabilities, context?.exam, context?.profile])
  const messages = useMemo(() => getAnnouncementRibbonMessages(audience), [audience])

  useEffect(() => {
    const userId = context?.user?.id || null
    let active = true
    setBootcampAccess({ ready: false, userId, access: null })
    if (!userId || loading) return () => { active = false }

    supabase.auth.getSession().then(async ({ data, error }) => {
      const session = error ? null : data?.session
      if (!session?.access_token || session.user?.id !== userId) {
        if (active) setBootcampAccess({ ready: true, userId, access: null })
        return
      }
      try {
        const response = await fetch("/api/bootcamp/access", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        })
        const access = response.ok ? await response.json() : null
        if (active) setBootcampAccess({ ready: true, userId, access })
      } catch {
        if (active) setBootcampAccess({ ready: true, userId, access: null })
      }
    }).catch(() => {
      if (active) setBootcampAccess({ ready: true, userId, access: null })
    })

    return () => { active = false }
  }, [context?.user?.id, loading])

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(ANNOUNCEMENT_RIBBON_SESSION_KEY) === "1")
    } catch {
      setDismissed(false)
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(media.matches)
    update()
    if (media.addEventListener) media.addEventListener("change", update)
    else media.addListener?.(update)
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update)
      else media.removeListener?.(update)
    }
  }, [])

  const visible = shouldShowAnnouncementRibbon({
    pathname,
    searchParams,
    user: context?.user,
    loading,
    audience,
    dismissed,
  })

  useEffect(() => {
    const root = document.documentElement
    if (!visible) {
      root.style.setProperty("--auctor-ribbon-nav-offset", "0px")
      return undefined
    }

    const update = () => {
      root.style.setProperty("--auctor-ribbon-nav-offset", `${Math.max(0, 44 - window.scrollY)}px`)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      window.removeEventListener("scroll", update)
      root.style.setProperty("--auctor-ribbon-nav-offset", "0px")
    }
  }, [visible])

  useEffect(() => {
    setActiveMessage(0)
  }, [audience])

  useEffect(() => {
    if (!reducedMotion || messages.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActiveMessage(index => (index + 1) % messages.length)
    }, 4_000)
    return () => window.clearInterval(timer)
  }, [messages.length, reducedMotion])

  function dismiss() {
    try {
      window.sessionStorage.setItem(ANNOUNCEMENT_RIBBON_SESSION_KEY, "1")
    } catch {}
    setDismissed(true)
  }

  if (!visible || messages.length === 0) return null

  const selectedMessage = messages[activeMessage] || messages[0]
  const renderMessageGroup = (copyIndex, ariaHidden = false) => (
    <div className={styles.messageGroup} key={copyIndex} data-testid="ribbon-message-group" aria-hidden={ariaHidden || undefined}>
      {messages.map((message, index) => (
        <span className={styles.messageSlot} key={`${copyIndex}-${message.text}`}>
          <Link
            className={styles.messageLink}
            href={message.href}
            tabIndex={ariaHidden ? -1 : undefined}
            aria-label={message.text}
            data-testid="ribbon-message"
          >
            <span>{message.beforeLink}</span><strong>{message.linkText}</strong>
          </Link>
          <span className={styles.separator} aria-hidden="true">•</span>
        </span>
      ))}
    </div>
  )

  return (
    <aside
      className={`${styles.ribbon} ${touchPaused ? styles.touchPaused : ""}`}
      aria-label="Auctor announcements"
      data-ribbon-state={audience}
      data-testid="announcement-ribbon"
      onTouchStart={() => setTouchPaused(true)}
      onTouchEnd={() => setTouchPaused(false)}
      onTouchCancel={() => setTouchPaused(false)}
    >
      <div className={styles.viewport}>
        <div className={styles.marqueeTrack} data-testid="ribbon-marquee-track" aria-hidden={reducedMotion}>
          {renderMessageGroup(0)}
          {renderMessageGroup(1, true)}
        </div>
        <Link
          className={styles.reducedMessage}
          href={selectedMessage.href}
          aria-hidden={!reducedMotion || undefined}
          aria-label={selectedMessage.text}
          aria-live={reducedMotion ? "polite" : undefined}
          aria-atomic={reducedMotion ? "true" : undefined}
          data-testid="ribbon-reduced-message"
          data-message-index={activeMessage}
        >
          <span>{selectedMessage.beforeLink}</span><strong>{selectedMessage.linkText}</strong>
        </Link>
      </div>
      <button
        className={styles.closeButton}
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcements for this session"
        title="Dismiss for this session"
      >
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  )
}
