import Image from 'next/image'

import { catDaysRemaining } from '@/lib/bootcamp/countdown.mjs'
import {
  Clock3,
  BookOpen,
  ListChecks,
  Sparkles,
} from "lucide-react";

import StickyStartCTA from './StickyStartCTA'

import s from './page.module.css'

const DESCRIPTION =
  'A 50-day guided CAT VARC training program with daily practice, mistake diagnosis and Birbal review.'

export const metadata = {
  title: 'CAT 2026 VARC Boot Camp | Auctor',
  description: DESCRIPTION,
  metadataBase: new URL('https://auctorlabs.in'),
  openGraph: {
    title: 'CAT 2026 VARC Boot Camp | Auctor',
    description: DESCRIPTION,
    type: 'website',
  },
}

function startHref(searchParams = {}) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item))
    } else if (typeof value === 'string') {
      query.append(key, value)
    }
  }

  const encoded = query.toString()

  return `/bootcamp-2026/start${encoded ? `?${encoded}` : ''}`
}

function StartLink({ href, children, className = '' }) {
  return (
    <a
      href={href}
      className={`${s.cta} ${className}`}
    >
      <span>{children}</span>
      <span aria-hidden="true">→</span>
    </a>
  )
}

function Countdown({ days, compact = false }) {
  return (
    <div
      className={`${s.countdown} ${
        compact ? s.countdownCompact : ''
      }`}
    >
      <span>CAT 2026</span>

      <strong>
        {days}
        <small>DAYS LEFT</small>
      </strong>

      {!compact && (
        <span className={s.countdownDate}>
          29 NOV 2026
        </span>
      )}
    </div>
  )
}

const testimonials = [
  {
    initials: 'AR',
    quote:
      'I stopped guessing why I got things wrong. Birbal just... told me.',
    name: 'Ananya R.',
    result: '99.1 %ile, CAT 2025',
  },
  {
    initials: 'SK',
    quote:
      '50 days felt like having a coach who never let a mistake slide.',
    name: 'Siddharth K.',
    result: '98.6 %ile, CAT 2025',
  },
  {
    initials: 'MP',
    quote:
      'The daily structure is the whole product. I just showed up.',
    name: 'Meher P.',
    result: '97.9 %ile, CAT 2025',
  },
]

const trainingSteps = [
  {
    number: '01',
    title: 'Your daily workout.',
    text:
      'Warm-up, RC training, Verbal Ability — exactly what to practice, every day.',
  },
  {
    number: '02',
    title: 'Birbal finds the pattern.',
    text:
      'Not just the correct answer — the trap behind your mistake.',
  },
  {
    number: '03',
    title: "Know what's next.",
    text:
      'A clear move for tomorrow, not a score to forget about.',
  },
]

const journey = [
  {
    day: 'DAY 01',
    title: 'Build the habit',
  },
  {
    day: 'DAY 10',
    title: 'Recognise patterns',
  },
  {
    day: 'DAY 25',
    title: 'Handle pressure',
  },
  {
    day: 'DAY 40',
    title: 'Sharpen accuracy',
  },
  {
    day: 'DAY 50',
    title: 'Enter CAT ready',
  },
]

const workout = [
  {
    number: '01',
    title: 'Warm-up',
    detail: '5 questions',
  },
  {
    number: '02',
    title: 'RC Training',
    detail: '3 passages · 12 questions',
  },
  {
    number: '03',
    title: 'Verbal Ability',
    detail: '10 questions',
  },
  {
    number: '04',
    title: 'Birbal Review',
    detail: 'Mistake → next move',
  },
]

export default function Bootcamp2026Page({
  searchParams = {},
}) {
  const href = startHref(searchParams)

  const daysLeft = Math.max(
    0,
    catDaysRemaining(new Date())
  )

  return (
    <main className={s.page}>

      {/* HEADER */}

      <header className={s.header}>
        <a
          href="/bootcamp-2026"
          className={s.logo}
        >
          Auctor
        </a>

        <div className={s.headerRight}>
          <div className={s.headerCountdown}>
            CAT 2026 ·{' '}
            <strong>{daysLeft} DAYS LEFT</strong>
          </div>

          <StartLink
            href={href}
            className={s.headerCta}
          >
            JOIN · ₹499
          </StartLink>
        </div>
      </header>

      {/* HERO */}

      <section className={s.hero}>

        <div className={s.heroCopy}>

          <div className={s.eyebrow}>
            50-DAY VARC BOOT CAMP
          </div>

          <h1>
            Your VARC trainer.
            <br />
            Every day.
            <br />
            Until{' '}
            <em>CAT 2026.</em>
          </h1>

          <p className={s.heroDescription}>
            50 days of guided VARC training that tells
            you what to practice, shows you where
            you&apos;re going wrong, and tells you what
            to fix next.
          </p>

        <StartLink href={href} className={s.heroCta}>
  Start your Bootcamp Preview
</StartLink>

         <div className={s.heroMeta}>
  <span>
    <Clock3 aria-hidden="true" />
    <strong>50</strong>
    <em>guided days</em>
  </span>

  <span>
    <BookOpen aria-hidden="true" />
    <strong>150</strong>
    <em>RC passages</em>
  </span>

  <span>
    <ListChecks aria-hidden="true" />
    <strong>1,250+</strong>
    <em>questions</em>
  </span>

  <span>
    <Sparkles aria-hidden="true" />
    <em>Birbal review</em>
  </span>
</div>

        </div>

        <div className={s.heroVisual}>

          <div className={s.heroImageFrame}>
           <img
  src="/student5.jpeg"
  alt="Student intensely preparing for CAT"
/>

            <div className={s.heroImageCaption}>
              <span>50 DAYS OF TRAINING</span>
              <strong>
                Practice with purpose.
              </strong>
            </div>
          </div>

          <div className={s.heroAnnotation}>
            <span>DAY 03 / 50</span>
            <strong>
              RC → VA → REVIEW
            </strong>
          </div>

        </div>

      </section>

      {/* COUNTDOWN / INTRO STRIP */}

      <section className={s.introStrip}>
        <div>
          <span>CAT 2026</span>
          <strong>{daysLeft} DAYS LEFT</strong>
        </div>

        <p>
          The next 50 days should not be random.
          They should be deliberate.
        </p>

        <Countdown days={daysLeft} compact />
      </section>

      {/* TRAINING LOOP */}

     <section className={s.loopSection}>

  <div className={s.loopHeader}>
    <div>
      <span className={s.eyebrow}>VARC 26 · 50-DAY BOOT CAMP</span>

     <h2>
  <span className={s.cyanText}>50 days</span> of
  <br />
  <em>guided VARC practice.</em>
</h2>
    </div>

    <p>
  VARC 26 is a daily training program where you practice with a plan,
  not a question bank. Auctor gives you the workout, Birbal works
  through your mistakes with you, and every day leads into the next.
</p>
  </div>

  <div className={s.trainingStory}>

    {/* 01 — PRACTICE */}
    <article className={s.storyCard}>

      <div className={s.storyTop}>
        <span>01</span>
        <span>YOUR DAILY MISSION</span>
      </div>

      <div className={s.missionVisual}>

        <div className={s.missionHeader}>
          <div>
            <small>DAY 03 / 50</small>
            <strong>Today's Training</strong>
          </div>

          <span className={s.missionTime}>
            30 MIN
          </span>
        </div>

        <div className={s.missionRows}>

          <div className={s.missionRow}>
            <span className={s.rowNumber}>01</span>
            <div>
              <strong>Warm-up</strong>
              <small>5 questions</small>
            </div>
            <span className={s.rowCheck}>✓</span>
          </div>

          <div className={s.missionRow}>
            <span className={s.rowNumber}>02</span>
            <div>
              <strong>RC Training</strong>
              <small>3 passages · 12 questions</small>
            </div>
            <span className={s.rowArrow}>→</span>
          </div>

          <div className={s.missionRow}>
            <span className={s.rowNumber}>03</span>
            <div>
              <strong>Verbal Ability</strong>
              <small>10 questions</small>
            </div>
            <span className={s.rowArrow}>→</span>
          </div>

          <div className={s.missionRow}>
            <span className={s.rowNumber}>04</span>
            <div>
              <strong>Birbal Review</strong>
              <small>Understand your mistakes</small>
            </div>
            <span className={s.rowArrow}>→</span>
          </div>

        </div>

      </div>

      <div className={s.storyCaption}>
        <strong>You don't decide what to practice.</strong>
        <span>Auctor gives you a focused workout every day.</span>
      </div>

    </article>


    {/* 02 — BIRBAL */}
    <article className={`${s.storyCard} ${s.storyCardDark}`}>

      <div className={s.storyTop}>
        <span>02</span>
        <span>YOUR AI MENTOR</span>
      </div>

      <div className={s.birbalVisual}>

        <div className={s.birbalVisualHeader}>
          <span>✦ BIRBAL</span>
          <small>REVIEWING YOUR ANSWER</small>
        </div>

        <div className={s.studentMistake}>
          <small>YOUR ANSWER</small>
          <strong>B</strong>
          <p>
            "...the reforms were primarily
            motivated by external pressure."
          </p>
        </div>

        <div className={s.birbalMessage}>
          <small>BIRBAL</small>

          <strong>
            Half truth.
          </strong>

          <p>
            You picked a true detail. The problem is
            that the option makes the author's claim
            stronger than it actually is.
          </p>

          <div>
            <span>NEXT MOVE</span>
            <strong>Check the complete claim.</strong>
          </div>
        </div>

      </div>

      <div className={s.storyCaption}>
        <strong>You don't just get an answer.</strong>
        <span>Your AI mentor explains the mistake behind it.</span>
      </div>

    </article>


    {/* 03 — ADAPT */}
    <article className={`${s.storyCard} ${s.storyCardAdapt}`}>

      <div className={s.storyTop}>
        <span>03</span>
        <span>WHAT HAPPENS NEXT</span>
      </div>

      <div className={s.adaptVisual}>

        <div className={s.adaptTitle}>
          <small>YOUR TRAINING JOURNEY</small>
          <strong>Every mistake changes what comes next.</strong>
        </div>

        <div className={s.journeyMini}>

          <div className={s.journeyMiniStep}>
            <span>DAY 03</span>
            <strong>Inference</strong>
            <small>Needs work</small>
          </div>

          <div className={s.journeyMiniLine} />

          <div className={s.journeyMiniStep}>
            <span>DAY 04</span>
            <strong>Inference traps</strong>
            <small>Targeted practice</small>
          </div>

          <div className={s.journeyMiniLine} />

          <div className={s.journeyMiniStep}>
            <span>DAY 10</span>
            <strong>Recognise patterns</strong>
            <small>Building accuracy</small>
          </div>

        </div>

        <div className={s.adaptBottom}>
          <span>50 DAYS</span>
          <strong>One continuous training journey.</strong>
        </div>

      </div>

      <div className={s.storyCaption}>
        <strong>The next day isn't random.</strong>
        <span>Your training keeps moving you forward.</span>
      </div>

    </article>

  </div>

</section>
      {/* PRODUCT */}

      <section className={s.productSection}>

        <div className={s.sectionHeader}>
          <span className={s.eyebrow}>
            INSIDE THE APP
          </span>

          <h2>
            Open Auctor.
            <br />
            <em>Know exactly what to do.</em>
          </h2>
        </div>

        <div className={s.productShowcase}>

          <div className={s.productTop}>
            <span>DAY 03 / 50</span>
            <span>YOUR DAILY TRAINING</span>
          </div>

          <div className={s.productWorkout}>

            {workout.map((item) => (
              <div
                className={s.workoutRow}
                key={item.number}
              >
                <span className={s.workoutNumber}>
                  {item.number}
                </span>

                <strong>{item.title}</strong>

                <span className={s.workoutDetail}>
                  {item.detail}
                </span>

                <span className={s.workoutArrow}>
                  →
                </span>
              </div>
            ))}

          </div>

          <div className={s.productBottom}>
            <span>
              TODAY&apos;S TRAINING
            </span>

            <strong>
              No random practice. No guessing what
              to do next.
            </strong>
          </div>

        </div>

      </section>

      {/* DIAGNOSIS */}

      <section className={s.diagnosisSection}>

        <div className={s.diagnosisIntro}>
          <span className={s.eyebrow}>
            THE REAL DIFFERENCE
          </span>

          <h2>
            You get a question wrong.
            <br />
            <em>Something useful happens.</em>
          </h2>
        </div>

        <div className={s.diagnosisGrid}>

          <div className={s.answerPanel}>

            <div className={s.panelLabel}>
              YOUR ANSWER
            </div>

            <p>
              &quot;...the passage suggests the reforms
              were primarily motivated by external
              pressure.&quot;
            </p>

            <div className={s.answerChoice}>
              B
            </div>

          </div>

          <div className={s.birbalDiagnosis}>

            <div className={s.panelLabel}>
              BIRBAL
            </div>

            <h3>
              Half truth.
            </h3>

            <p>
              You picked a true detail. The problem
              is that the option makes the author&apos;s
              claim stronger than it actually is.
            </p>

            <div className={s.nextTime}>
              <span>NEXT TIME</span>
              <strong>
                Check whether the option preserves
                the complete claim.
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* JOURNEY */}

      <section className={s.journeySection}>

        <div className={s.sectionHeader}>
          <span className={s.eyebrow}>
            THE JOURNEY
          </span>

          <h2>
            50 days.
          </h2>
        </div>

        <div className={s.journeyLine}>

          {journey.map((item, index) => (
            <div
              className={s.journeyItem}
              key={item.day}
            >
              <div className={s.journeyDot} />

              {index < journey.length - 1 && (
                <div className={s.journeyConnector} />
              )}

              <span>{item.day}</span>

              <strong>{item.title}</strong>
            </div>
          ))}

        </div>

      </section>

      {/* TESTIMONIALS */}

      <section className={s.testimonialsSection}>

        <div className={s.sectionHeader}>
          <span className={s.eyebrow}>
            THE HABIT MATTERS
          </span>

          <h2>
            Show up.
            <br />
            <em>Every day.</em>
          </h2>
        </div>

        <div className={s.testimonials}>

          {testimonials.map((review) => (
            <article
              className={s.testimonial}
              key={review.name}
            >
              <span className={s.initials}>
                {review.initials}
              </span>

              <blockquote>
                &quot;{review.quote}&quot;
              </blockquote>

              <div className={s.testimonialPerson}>
                <strong>{review.name}</strong>
                <span>{review.result}</span>
              </div>
            </article>
          ))}

        </div>

      </section>

      {/* BIRBAL */}

      <section className={s.birbalSection}>

        <div className={s.birbalImage}>
          <Image
            src="/Birbal%20avatar.jpeg"
            alt="Birbal"
            width={360}
            height={360}
            loading="lazy"
          />
        </div>

        <div className={s.birbalCopy}>

          <span className={s.eyebrow}>
            MEET BIRBAL
          </span>

          <h2>
            Not just the answer.
            <br />
            <em>The next move.</em>
          </h2>

          <p>
            Birbal reviews your answers, finds patterns
            in your mistakes, and gives you a clear next
            move.
          </p>

          <div className={s.birbalPoints}>

            <div>
              <span>01</span>
              <strong>
                Understand the mistake
              </strong>
            </div>

            <div>
              <span>02</span>
              <strong>
                Spot the trap
              </strong>
            </div>

            <div>
              <span>03</span>
              <strong>
                Know what to do next
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* OFFER */}

      <section className={s.offerSection}>

        <div className={s.offerCopy}>

          <span className={s.offerEyebrow}>
            CAT 2026 · VARC BOOT CAMP
          </span>

          <h2>
            50 days.
            <br />
            <em>One system.</em>
          </h2>

          <div className={s.price}>
            <del>₹799</del>
            <strong>₹499</strong>
          </div>

          <StartLink
            href={href}
            className={s.offerCta}
          >
            Start the bootcamp — ₹499
          </StartLink>

        </div>

        <div className={s.offerList}>

          <div>50 guided training days</div>
          <div>150 RC passages</div>
          <div>1,250+ questions</div>
          <div>Daily guided training</div>
          <div>Birbal review</div>
          <div>10 buffer days</div>
          <div>Practice through 4 February 2027</div>

        </div>

      </section>

      {/* FINAL CTA */}

      <section className={s.finalCta}>

        <div>
          <span>CAT 2026 IS GETTING CLOSER.</span>

          <h2>
            {daysLeft} days left.
          </h2>

          <p>
            Make every remaining day count.
          </p>
        </div>

        <StartLink
          href={href}
          className={s.finalCtaButton}
        >
          Start your bootcamp → ₹499
        </StartLink>

      </section>

      {/* FOOTER */}

      <footer className={s.footer}>

        <div className={s.footerBrand}>
          AUCTOR
          <small>CAT VARC · 2026</small>
        </div>

        <span>
          50 days · 150 RCs · 1,250+ questions ·
          Birbal review
        </span>

        <a href="#top">
          Back to top ↑
        </a>

      </footer>

      <StickyStartCTA
        href={href}
        daysLeft={daysLeft}
      />

    </main>
  )
}