'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { attributionParams, buildAttributedPath, persistBrowserAttribution, readBrowserAttribution } from '@/lib/attribution.mjs'
import { captureSignupConversion, captureGoogleLoginFailure } from '@/lib/analytics/conversionEvents.mjs'
import { classifySignupResult, runSingleFlight } from '@/lib/onboarding/profileValidation.mjs'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function inAppBrowser() {
  return /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|MessengerForiOS|FBMessenger/i.test(navigator.userAgent || '')
}

function eventProperties(placement) {
  return { placement, viewport_width: window.innerWidth, in_app_browser: inAppBrowser() }
}

function capturePreviewEvent(name, placement, properties = {}) {
  try { posthog.capture(name, { ...eventProperties(placement), ...properties }) } catch { /* Analytics must never block signup. */ }
}

function focusPrimarySignup(placement) {
  const emailInput = document.querySelector('.ad-primary-signup-anchor input[type="email"]')
  const signupCard = emailInput?.closest('.ad-primary-signup-anchor')
  if (!signupCard || !emailInput) return
  const bounds = signupCard.getBoundingClientRect()
  if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    signupCard.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  }
  emailInput.focus({ preventScroll: true })
  capturePreviewEvent('preview_ad_signup_cta_clicked', placement)
}

function SignupCard({ placement, email, setEmail, password, setPassword, showPassword, setShowPassword, loading, error, confirmationMessage, fieldErrors, loginHref, onSubmit, onGoogle, onStart, clearFieldError }) {
  const prefix = `preview-${placement}`
  return <section className={`ad-signup-card ad-signup-card-${placement}`} data-signup-card={placement} aria-labelledby={`${prefix}-title`}>
    <h2 id={`${prefix}-title`}>Start your free trial</h2>
    <form className="ad-signup-form" noValidate onSubmit={onSubmit} onFocusCapture={onStart}>
      <label htmlFor={`${prefix}-email`}>Email</label>
      <input
        id={`${prefix}-email`}
        type="email"
        name="email"
        placeholder="you@example.com"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={event => { setEmail(event.target.value); clearFieldError('email') }}
        aria-invalid={Boolean(fieldErrors.email)}
        aria-describedby={fieldErrors.email ? `${prefix}-email-error` : undefined}
        disabled={loading}
        required
      />
      {fieldErrors.email && <p className="ad-signup-field-error" id={`${prefix}-email-error`} aria-live="polite">{fieldErrors.email}</p>}

      <label htmlFor={`${prefix}-password`}>Password</label>
      <div className="ad-signup-password">
        <input
          id={`${prefix}-password`}
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={event => { setPassword(event.target.value); clearFieldError('password') }}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? `${prefix}-password-error` : undefined}
          disabled={loading}
          required
        />
        <button type="button" className="ad-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={loading}>
          {showPassword ? <EyeOff size={21} aria-hidden="true" /> : <Eye size={21} aria-hidden="true" />}
        </button>
      </div>
      {fieldErrors.password && <p className="ad-signup-field-error" id={`${prefix}-password-error`} aria-live="polite">{fieldErrors.password}</p>}

      {error === 'existing_user'
        ? <p className="ad-signup-error" role="alert" aria-live="polite">This email already has an account. <a href={loginHref}>Log in instead</a></p>
        : error && <p className="ad-signup-error" role="alert" aria-live="polite">{error}</p>}
      {confirmationMessage && <p className="ad-signup-success" role="status" aria-live="polite">{confirmationMessage}</p>}

      <button className="ad-signup-submit" type="submit" disabled={loading}>
        {loading ? 'Creating your account…' : 'Create free account'}
      </button>
    </form>

    <div className="ad-signup-divider"><span>or</span></div>
    <button type="button" className="ad-signup-google" onClick={onGoogle} disabled={loading}>
      <img src="/google-g.svg" width="22" height="22" alt="" />
      <span>{loading ? 'Creating your account…' : 'Continue with Google'}</span>
    </button>
    <p className="ad-signup-note">Free trial, no card needed. Next you add your name, exam and mobile number (about 30 seconds).</p>
  </section>
}

export default function PreviewAdSignupExperience({ initialAttribution, ctaOnly = false }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [showSticky, setShowSticky] = useState(false)
  const singleFlight = useRef(null)
  const oauthPending = useRef(false)
  const primaryCard = useRef(null)
  const observedCards = useRef(new Set())
  const viewedPlacements = useRef(new Set())
  const startedPlacements = useRef(new Set())
  const scrollDepths = useRef(new Set())

  useEffect(() => {
    persistBrowserAttribution(new URLSearchParams(window.location.search))
    if (ctaOnly) return undefined
    const oauthError = new URLSearchParams(window.location.search).get('signup_error')
    if (oauthError === 'google') {
      setError('Something went wrong. Please try again.')
      capturePreviewEvent('signup_failed', 'google_oauth_callback', { method: 'google', failure_type: 'oauth_error' })
    }

    const depths = [25, 50, 75, 100]
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const depth = max <= 0 ? 100 : Math.floor((window.scrollY / max) * 100)
      for (const threshold of depths) {
        if (depth >= threshold && !scrollDepths.current.has(threshold)) {
          scrollDepths.current.add(threshold)
          capturePreviewEvent('preview_ad_scroll_depth', 'page', { depth: threshold })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    const onLoginClick = event => {
      if (!event.target.closest?.('a[href^="/login"]')) return
      capturePreviewEvent('login_link_clicked', 'page')
    }
    document.addEventListener('click', onLoginClick)

    const cards = [primaryCard.current].filter(Boolean)
    if ('IntersectionObserver' in window && cards.length) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          const placement = entry.target.dataset.signupCard
          if (entry.isIntersecting) {
            observedCards.current.add(placement)
            if (!viewedPlacements.current.has(placement)) {
              viewedPlacements.current.add(placement)
              capturePreviewEvent('signup_card_viewed', placement)
            }
          } else observedCards.current.delete(placement)
        }
        setShowSticky(window.innerWidth < 1024 && !observedCards.current.size)
      }, { threshold: 0.15 })
      cards.forEach(card => observer.observe(card))
      const updateSticky = () => setShowSticky(window.innerWidth < 1024 && !observedCards.current.size)
      window.addEventListener('resize', updateSticky)
      return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', updateSticky); document.removeEventListener('click', onLoginClick); observer.disconnect() }
    }
    const updateSticky = () => setShowSticky(window.innerWidth < 1024 && window.scrollY > 500)
    window.addEventListener('scroll', updateSticky, { passive: true })
    window.addEventListener('resize', updateSticky)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', updateSticky)
      window.removeEventListener('resize', updateSticky)
      document.removeEventListener('click', onLoginClick)
    }
  }, [ctaOnly])

  const currentAttribution = useCallback(() => {
    if (typeof window === 'undefined') return initialAttribution || { firstTouch: {}, lastTouch: {} }
    const attribution = readBrowserAttribution(new URLSearchParams(window.location.search))
    return Object.keys(attribution.firstTouch).length || Object.keys(attribution.lastTouch).length ? attribution : initialAttribution
  }, [initialAttribution])
  const loginHref = useCallback(() => {
    const params = new URLSearchParams(attributionParams(currentAttribution()))
    if (email.trim()) params.set('email', email.trim().toLowerCase())
    return `/login?${params.toString()}`
  }, [currentAttribution, email])

  const startPlacement = useCallback(placement => {
    if (startedPlacements.current.has(placement)) return
    startedPlacements.current.add(placement)
    capturePreviewEvent('signup_form_started', placement)
  }, [])

  const reportFailure = useCallback((placement, method, reason) => {
    capturePreviewEvent('signup_failed', placement, { method, failure_type: reason })
  }, [])
  const clearFieldError = useCallback(field => {
    setFieldErrors(previous => previous[field] ? { ...previous, [field]: '' } : previous)
    setError('')
    setConfirmationMessage('')
  }, [])

  const handleSignup = useCallback((placement, event) => {
    event.preventDefault()
    if (loading || singleFlight.current) return
    const normalizedEmail = email.trim().toLowerCase()
    const nextErrors = {}
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter a password.'
    setFieldErrors(nextErrors)
    setError('')
    setConfirmationMessage('')
    if (Object.keys(nextErrors).length) {
      reportFailure(placement, 'email', Object.keys(nextErrors).join('_'))
      return
    }
    setEmail(normalizedEmail)
    capturePreviewEvent('signup_submitted', placement, { method: 'email' })
    setLoading(true)
    void runSingleFlight(singleFlight, async () => {
      const attribution = currentAttribution()
      try {
        const callbackPath = buildAttributedPath('/auth/callback', attribution, { signup_surface: 'preview_ad_inline' })
        const { data, error: signupError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { signup_attribution: attribution },
            emailRedirectTo: `${window.location.origin}${callbackPath}`,
          },
        })
        const outcome = classifySignupResult({ data, error: signupError })
        if (outcome.type === 'existing_user') {
          setError('existing_user')
          reportFailure(placement, 'email', 'existing_user')
          return
        }
        if (outcome.type === 'error') {
          const detail = String(outcome.error?.message || '')
          if (/password.{0,40}(weak|short|minimum|length|characters)|weak.{0,40}password/i.test(detail)) {
            setFieldErrors({ password: 'Choose a stronger password and try again.' })
            reportFailure(placement, 'email', 'weak_password')
          } else {
            setError('Something went wrong. Please try again.')
            reportFailure(placement, 'email', 'auth_error')
          }
          return
        }
        captureSignupConversion({ userId: outcome.user.id, method: 'email', createdAt: outcome.user.created_at, posthog, pixel: window.fbq, redditPixel: window.rdt, surface: 'preview_ad_inline', attribution, placement })
        if (outcome.type === 'authenticated') {
          router.replace(buildAttributedPath('/welcome', attribution, { signup_surface: 'preview_ad_inline' }))
          return
        }
        setConfirmationMessage('Account created. Check your email to confirm your account. The confirmation link will continue to profile setup.')
      } catch {
        setError('Something went wrong. Please try again.')
        reportFailure(placement, 'email', 'network_error')
      } finally {
        setLoading(false)
      }
    })
  }, [currentAttribution, email, loading, password, reportFailure, router])

  const handleGoogle = useCallback(async placement => {
    if (loading || singleFlight.current || oauthPending.current) return
    setError('')
    setConfirmationMessage('')
    setFieldErrors({})
    capturePreviewEvent('signup_submitted', placement, { method: 'google' })
    oauthPending.current = true
    setLoading(true)
    const attribution = currentAttribution()
    const params = new URLSearchParams(attributionParams(attribution))
    params.set('oauth', 'google')
    params.set('flow', 'signup')
    params.set('signup_surface', 'preview_ad_inline')
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?${params.toString()}` },
      })
      if (oauthError) {
        captureGoogleLoginFailure({ posthog, surface: 'preview_ad_inline', error: { code: oauthError.code || oauthError.name || 'oauth_failed' }, attemptId: 'preview_ad_inline:google' })
        setError('Something went wrong. Please try again.')
        setLoading(false)
        oauthPending.current = false
        reportFailure(placement, 'google', 'oauth_error')
      }
    } catch {
      captureGoogleLoginFailure({ posthog, surface: 'preview_ad_inline', error: { code: 'oauth_failed' }, attemptId: 'preview_ad_inline:google' })
      setError('Something went wrong. Please try again.')
      setLoading(false)
      oauthPending.current = false
      reportFailure(placement, 'google', 'oauth_error')
    }
  }, [currentAttribution, loading, reportFailure])

  const formProps = { email, setEmail, password, setPassword, showPassword, setShowPassword, loading, error, confirmationMessage, fieldErrors, loginHref: loginHref(), clearFieldError }
  if (ctaOnly) return <button className="ad-feature-cta" type="button" onClick={() => focusPrimarySignup('feature_showcase')}>
    <strong>Start your free 3-day trial</strong><span>No card needed</span>
  </button>
  return <>
    <div ref={primaryCard} className="ad-primary-signup-anchor" data-signup-card="hero">
      <SignupCard {...formProps} placement="hero" onSubmit={event => handleSignup('hero', event)} onGoogle={() => handleGoogle('hero')} onStart={() => startPlacement('hero')} />
      <p className="ad-inline-login">Already a student? <a href={loginHref()}>Log in</a></p>
    </div>

    <div className={`ad-sticky-cta${showSticky ? ' is-visible' : ''}`} aria-hidden={!showSticky}>
      <button type="button" onClick={() => focusPrimarySignup('mobile_sticky_bar')} tabIndex={showSticky ? 0 : -1}>
        <strong>Start your free 3-day trial</strong><span>No card needed</span>
      </button>
    </div>
  </>
}
