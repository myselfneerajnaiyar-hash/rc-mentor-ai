import Link from 'next/link'
import BootCampSession from '@/components/bootcamp/BootCampSession'
import s from './page.module.css'

export const metadata = {
  title: 'CAT VARC Boot Camp | Try Day 1 · Auctor',
  description: 'Experience a complete day of Auctor CAT VARC Boot Camp practice and review.',
}

export default function CatVarcBootCampPage() {
  return <>
    <section className={s.hero}>
      <p className={s.eyebrow}>AUCTOR · CAT VARC BOOT CAMP</p>
      <h1>See what a focused day of VARC training feels like.</h1>
      <p>Try a published day with five activities, three reading passages, verbal reasoning, and detailed answer reviews. No account needed.</p>
      <div className={s.actions}>
        <a className={s.primary} href="#preview-day">Try the complete Day 1 preview</a>
        <Link className={s.secondary} href="/login?next=bootcamp">Get full Boot Camp access</Link>
      </div>
      <span className={s.note}>Your preview stays in this browser session. It never changes student progress, streaks, or leaderboard results.</span>
    </section>

    <div id="preview-day"><BootCampSession dayRoute dayNumber={1} preview /></div>

    <section className={s.offer}>
      <p className={s.eyebrow}>READY FOR THE FULL PROGRAM?</p>
      <h2>Take the same evidence-first training through all 45 days.</h2>
      <p>Create or sign in to your Auctor account, choose a plan, and continue into the full Boot Camp after purchase.</p>
      <Link className={s.primary} href="/login?next=bootcamp">Continue to full Boot Camp</Link>
    </section>
  </>
}
