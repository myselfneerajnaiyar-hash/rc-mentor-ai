import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { captureSignupConversion } from '../lib/analytics/conversionEvents.mjs'

const form = await readFile(new URL('../app/preview-ad/PreviewAdSignupExperience.jsx', import.meta.url), 'utf8')
const page = await readFile(new URL('../app/preview-ad/page.js', import.meta.url), 'utf8')
const callback = await readFile(new URL('../app/auth/callback/route.js', import.meta.url), 'utf8')
const welcome = await readFile(new URL('../app/welcome/page.jsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../app/preview-ad/preview-ad-signup.css', import.meta.url), 'utf8')
const videos = await readFile(new URL('../app/preview-ad/PreviewAdVideoStories.jsx', import.meta.url), 'utf8')
const features = await readFile(new URL('../app/preview-ad/PreviewAdFeatureShowcase.jsx', import.meta.url), 'utf8')

test('preview-ad form reuses verified auth classification and routes inline signup to welcome', () => {
  assert.match(form, /supabase\.auth\.signUp/)
  assert.match(form, /classifySignupResult\(\{ data, error: signupError \}\)/)
  assert.match(form, /email\.trim\(\)\.toLowerCase\(\)/)
  assert.match(form, /signup_attribution: attribution/)
  assert.match(form, /emailRedirectTo:/)
  assert.match(form, /router\.replace\(buildAttributedPath\('\/welcome'/)
  assert.doesNotMatch(form, /buildAttributedPath\('\/signup'/)
  assert.match(form, /signup_surface: 'preview_ad_inline'/)
  assert.match(callback, /signup_surface.*preview_ad_inline/)
  assert.match(welcome, /surface: signupSurface/)
  assert.match(welcome, /const inlinePreviewSignup = searchParams\.get\("signup_surface"\) === "preview_ad_inline"/)
  assert.match(welcome, /if \(inlinePreviewSignup\) \{\s*posthog\.identify\(user\.id\)/)
  assert.match(welcome, /email: user\.email/)
  assert.match(form, /buildAttributedPath\('\/welcome', attribution, \{ signup_surface: 'preview_ad_inline' \}\)/)
  assert.match(page, /PreviewAdSignupExperience initialAttribution/)
})

test('inline signup exposes accessible validation, duplicate-account login, and busy states', () => {
  assert.match(form, /type="email"/)
  assert.match(form, /autoComplete="email"/)
  assert.match(form, /autoComplete="new-password"/)
  assert.match(form, /aria-invalid=\{Boolean\(fieldErrors\.email\)\}/)
  assert.match(form, /aria-live="polite"/)
  assert.match(form, /This email already has an account/)
  assert.match(form, /params\.set\('email', email\.trim\(\)\.toLowerCase\(\)\)/)
  assert.match(form, /Choose a stronger password/)
  assert.match(form, /Creating your account/)
  assert.match(form, /runSingleFlight\(singleFlight/)
  assert.match(form, /disabled=\{loading\}/)
  assert.match(form, /setFieldErrors\(nextErrors\)/)
})

test('feature and sticky CTAs focus the existing signup without duplicating the form', () => {
  assert.match(form, /function focusPrimarySignup\(placement\)/)
  assert.match(form, /signupCard\.scrollIntoView\(\{ behavior: reducedMotion \? 'auto' : 'smooth'/)
  assert.match(form, /emailInput\.focus\(\{ preventScroll: true \}\)/)
  assert.match(form, /preview_ad_signup_cta_clicked/)
  assert.match(form, /if \(ctaOnly\) return <button className="ad-feature-cta"/)
  assert.match(form, /onClick=\{\(\) => focusPrimarySignup\('mobile_sticky_bar'\)\}/)
  assert.doesNotMatch(form, /ad-signup-sheet|role="dialog"|finalOnly/)
  assert.match(page, /PreviewAdSignupExperience initialAttribution=\{signupAttribution\} ctaOnly/)
  assert.doesNotMatch(page, /PreviewAdSignupExperience[^\n]*finalOnly/)
  assert.match(styles, /env\(safe-area-inset-bottom\)/)
  assert.match(styles, /prefers-reduced-motion:reduce/)
})

test('showcase includes all seven grounded product features and responsive exploration controls', () => {
  for (const feature of ['Daily RC Challenges', 'Daily Workout', 'VARC Bootcamp', 'Passage Generator', 'Speed Drills', 'Vocabulary Lab', 'Birbal AI Mentor']) {
    assert.ok(features.includes(feature), `${feature} appears in the feature showcase`)
  }
  assert.match(features, /role="tablist"/)
  assert.match(features, /ArrowRight/)
  assert.match(features, /data-feature-card/)
  assert.match(features, /mobile_swipe/)
  assert.match(features, /aria-label=\{`Show feature/)
  assert.match(styles, /\.ad-feature-track\{[^}]*overflow-x:auto/)
  assert.match(styles, /\.ad-feature-desktop\{display:none\}/)
  assert.match(styles, /\.ad-feature-mobile\{display:block\}/)
  assert.match(styles, /\.ad-feature-cta\{display:none\}/)
  assert.match(page, /ad-feature-section/)
  assert.match(page, /ctaOnly/)
})

test('mobile sticky signup CTA is accessible, dismisses when the hero form is visible, and has no overlay sheet', () => {
  assert.match(styles, /@media\(max-width:1023px\)/)
  assert.match(styles, /@media\(max-width:360px\)/)
  assert.match(styles, /position:fixed;z-index:120;right:0;bottom:0;left:0/)
  assert.match(form, /IntersectionObserver/)
  assert.doesNotMatch(form, /sheetOpenRef|visualViewport|signup_sheet/)
})

test('preview-ad analytics events carry placement and viewport context', () => {
  for (const event of ['preview_ad_scroll_depth', 'signup_card_viewed', 'preview_ad_signup_cta_clicked', 'signup_form_started', 'signup_submitted', 'signup_failed', 'login_link_clicked']) {
    assert.ok(form.includes(event), `${event} is implemented`)
  }
  assert.match(videos, /testimonial_video_played/)
  assert.match(form, /viewport_width: window\.innerWidth/)
  assert.match(form, /in_app_browser: inAppBrowser\(\)/)
  assert.match(features, /preview_ad_feature_explored/)
})

test('signup and scroll analytics include context but never receive credentials', async () => {
  const originalWindow = globalThis.window
  const originalFetch = globalThis.fetch
  const storageValues = new Map()
  const captured = []
  const requests = []
  globalThis.window = {
    innerWidth: 390,
    localStorage: {
      getItem: key => storageValues.get(key) || null,
      setItem: (key, value) => storageValues.set(key, value),
    },
  }
  globalThis.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body))
    return { ok: true, status: 200 }
  }
  try {
    captureSignupConversion({
      userId: '0b1b9c4a-f2b5-4c1a-a58e-9eb0497b1d08',
      method: 'email',
      posthog: { identify() {}, capture: (...args) => captured.push(args) },
      pixel() {},
      storage: window.localStorage,
      surface: 'preview_ad_inline',
      placement: 'hero',
      attribution: { firstTouch: { utm_source: 'instagram' }, lastTouch: { fbclid: 'click-1' } },
    })
    await new Promise(resolve => setImmediate(resolve))
    const signupEvent = captured.find(([name]) => name === 'user_signed_up')
    const successEvent = captured.find(([name]) => name === 'signup_succeeded')
    assert.equal(signupEvent[1].signup_surface, 'preview_ad_inline')
    assert.equal(signupEvent[1].viewport_width, 390)
    assert.equal(signupEvent[1].placement, 'hero')
    assert.deepEqual(signupEvent[1].signup_attribution.firstTouch, { utm_source: 'instagram' })
    assert.equal(successEvent[1].placement, 'hero')
    assert.equal(requests[0].surface, 'preview_ad_inline')
    for (const [, properties] of captured) {
      assert.equal('email' in properties, false)
      assert.equal('password' in properties, false)
    }
    assert.equal(JSON.stringify(requests).includes('student@example.test'), false)
    assert.equal(JSON.stringify(requests).includes('SecretPassword'), false)
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
    if (originalFetch === undefined) delete globalThis.fetch
    else globalThis.fetch = originalFetch
  }
})
