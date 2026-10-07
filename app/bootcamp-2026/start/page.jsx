import Link from 'next/link'
import s from '../page.module.css'

export const metadata = {
  title: 'Boot Camp enrollment | Auctor',
  description: 'The CAT 2026 VARC Boot Camp enrollment experience is being prepared.',
  robots: { index: false, follow: true },
}

function landingHref(searchParams = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach(item => query.append(key, item))
    else if (typeof value === 'string') query.append(key, value)
  }
  const encoded = query.toString()
  return `/bootcamp-2026${encoded ? `?${encoded}` : ''}`
}

export default function BootcampStartPlaceholder({ searchParams = {} }) {
  return <main className={s.placeholder}>
    <Link className={s.brand} href="/bootcamp-2026"><span className={s.placeholderMark}>A</span><span>Auctor <small>CAT VARC · 2026</small></span></Link>
    <p className={s.sectionLabel}>CAT 2026 · VARC BOOT CAMP</p>
    <h1>Your 50-day training plan is ready.</h1>
    <p>Enrollment is being prepared. The Boot Camp offer is ₹499 and includes 50 training days, 150 RC passages, 1,250+ questions and 10 buffer days.</p>
    <div className={s.placeholderOffer}><span>Current promotional price</span><strong>₹499</strong><small>Practice access through 4 February 2027</small></div>
    <Link className={s.cta} href={landingHref(searchParams)}>Back to the Boot Camp overview <span aria-hidden="true">↗</span></Link>
  </main>
}
