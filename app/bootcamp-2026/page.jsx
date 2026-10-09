'use client'

import { useEffect, useState } from 'react'
import s from './page.module.css'
import BootcampAccessCTA from '@/components/bootcamp/BootcampAccessCTA'

const CAT_DATE = '2026-11-29T00:00:00+05:30'

const testimonials = [
  {
    name: 'Nabeel',
    photo: '/assets/student3.jpeg',
    text: "Birbal doesn't just tell you the right answer. It explains why you were wrong, which completely changed how I approached Reading Comprehension.",
  },
  {
    name: 'Pushti Kapoor',
    photo: '/assets/student2.jpeg',
    text: 'The Daily Workout feature kept me consistent. Instead of randomly practising RCs, I finally had a proper learning routine every day.',
  },
  {
    name: 'Keshu Sharma',
    photo: '/assets/student1.jpeg',
    text: 'I used to avoid reading because I never enjoyed it. After using Auctor consistently, reading has become a daily habit and I can clearly feel the improvement in my comprehension.',
  },
]

const gaps = [
  ['Inference', 'Need work', 42],
  ['Main idea', 'Strong', 82],
  ["Author's tone", 'Improving', 63],
  ['Para jumbles', 'Needs work', 48],
  ['Summary', 'Strong', 71],
]

function daysToCat() {
  const exam = new Date(CAT_DATE).getTime()
  const now = Date.now()
  return Math.max(1, Math.ceil((exam - now) / 86400000))
}

function track(event, properties) {
  if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture(event, properties)
  }
}

function CTA({ location, children = 'Start Day 1 for free', className = '' }) {
  return <BootcampAccessCTA href="/bootcamp-2026/signup?next=bootcamp" location={location} className={`${s.cta} ${className}`}>{children}</BootcampAccessCTA>
}



  function PlayCard({ name, image, video }) {
  const [open, setOpen] = useState(false)

  const play = (e) => {
    e.preventDefault()
    e.stopPropagation()

    track('bootcamp_video_play', { title: name })
    setOpen(true)
  }

  return (
    <>
      <button
        className={s.videoCard}
        type="button"
        onClick={play}
        data-video={video}
        aria-label={`Play ${name} testimonial`}
      >
        <div className={s.videoImage}>
          <img
            src={image}
            alt={`${name} testimonial`}
            loading="lazy"
          />
          <span className={s.play}>▶</span>
        </div>

        <strong>
          {name === 'Ishaan Chandrakar'
            ? 'From avoiding RC to enjoying reading'
            : name === 'Bhoomi Saluja'
              ? 'A daily routine that made reading easier'
              : 'Understanding mistakes with Birbal'}
        </strong>

        <small>{name}</small>
      </button>

      {open && (
        <div className={s.videoModal}>
          <div
            className={s.videoModalBackdrop}
            onClick={() => setOpen(false)}
          />

          <div className={s.videoModalContent}>
            <button
              type="button"
              className={s.videoClose}
              onClick={() => setOpen(false)}
              aria-label="Close video"
            >
              ×
            </button>

            <video
              className={s.videoPlayer}
              src={video}
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
          </div>
        </div>
      )}
    </>
  )
}
export default function Bootcamp2026Page() {
  const [days, setDays] = useState(daysToCat())

  useEffect(() => {
    const update = () => setDays(daysToCat())
    update()
    const timer = window.setInterval(update, 60000)
    track('bootcamp_lp_view', { days_left: daysToCat() })
    document.title = `${daysToCat()} days to CAT | Auctor Boot Camp`
    return () => window.clearInterval(timer)
  }, [])


  const openFaq = (question) => {
    track('bootcamp_faq_open', { q: question })
  }

  return (
    <main className={s.page}>
      <header className={s.header}>
        <a href="/bootcamp-2026" className={s.logo} aria-label="Auctor home">
          <span className={s.logoMark}>A</span>
          <strong>Auctor</strong>
        </a>
        <a href="/login" className={s.login}>Already a student? <b>Log in</b></a>
      </header>

      <section className={s.hero}>
        <div className={s.heroCopy}>
          <div className={s.topPills}>
            <span><b>{days}</b> days to CAT</span>
            <span>Day 1 is live</span>
          </div>
          <div className={s.tag}>FOR CAT VERBAL ABILITY (VARC)</div>
          <div className={s.heroTitle}>
            <strong>45</strong>
            <span>DAY<br />BOOT<br />CAMP</span>
          </div>
          <h1>Mocks grade you.<br /><em>Boot Camp trains you.</em></h1>
          <p>Your AI mentor, Birbal, learns from your mistakes and guides your VARC practice for 45 days.</p>
          <CTA location="hero" />
         
        </div>

        <div className={s.whatBox}>
        
<div className={s.panelEyebrow}>WHAT IS BOOT CAMP?</div>

<div className={s.compare}>
  <div className={s.bootColumn}>
    <b>BOOT CAMP</b>
    <div><i>1</i><span>Practise today's set</span></div>
    <div className={s.down}>↓</div>
    <div><i>2</i><span>Review every mistake</span></div>
    <div className={s.down}>↓</div>
    <div><i>3</i><span>Learn from past mistakes</span></div>
    <div className={s.down}>↓</div>
    <div><i>4</i><span>Tomorrow targets your gaps</span></div>
    <strong>Repeat daily. Improve every day.</strong>
  </div>

  <div className={s.mockColumn}>
    <b>A MOCK</b>
    <div><i>1</i><span>Take the test</span></div>
    <div className={s.down}>↓</div>
    <div><i>2</i><span>Score &amp; solutions</span></div>
    <div className={s.down}>↓</div>
    <div><i>3</i><span>Move on</span></div>
    <small className={s.mockReset}>
      NEXT MOCK STARTS FROM ZERO
    </small>
  </div>
</div>

        </div>
      </section>

      

<section className={s.threePoints}>
  <div>
    <span>01</span>
    <b>Practise</b>
    <small>Complete today's set</small>
  </div>
  <div>
    <span>02</span>
    <b>Review</b>
    <small>Understand every mistake</small>
  </div>
  <div>
    <span>03</span>
    <b>Improve</b>
    <small>Train tomorrow's weak spots</small>
  </div>
</section>

<section className={s.programStats}>
  <div className={s.programStatsHeading}>
    <div className={s.panelEyebrow}>THE 45-DAY PLAN</div>
    <h2>Focused practice. Measurable progress.</h2>
  </div>

  <div className={s.programStatsGrid}>
    <article className={s.programStat}>
      <span className={s.programStatIcon}>↗</span>
      <strong>135</strong>
      <b>RC passages</b>
      <small>3 passages every day</small>
    </article>

    <article className={s.programStat}>
      <span className={s.programStatIcon}>≡</span>
      <strong>1,125</strong>
      <b>Practice questions</b>
      <small>25 questions every day</small>
    </article>

    <article className={s.programStat}>
      <span className={s.programStatIcon}>◷</span>
      <strong>45</strong>
      <b>Training days</b>
      <small>One guided routine each day</small>
    </article>

    <article className={s.programStat}>
      <span className={s.programStatIcon}>◎</span>
      <strong>360</strong>
      <b>Verbal Ability questions</b>
      <small>8 questions every day</small>
    </article>
  </div>

  <p className={s.programStatsNote}>
    Every day: 5 warm-up questions + 12 RC questions + 8 Verbal Ability questions,
    followed by Birbal’s review.
  </p>
</section>




      <section className={s.gridSection}>
        <article className={`${s.panel} ${s.curvePanel}`}>
          <div className={s.panelEyebrow}>IT GETS SHARPER EVERY DAY</div>
          <svg className={s.curve} viewBox="0 0 700 260" role="img" aria-label="Training gets sharper every day">
            <defs><linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" /><stop offset="1" /></linearGradient></defs>
            <path d="M30 215 C180 215 250 180 390 145 S560 85 670 25 L670 240 L30 240 Z" className={s.curveFill} />
            <path d="M30 215 C180 215 250 180 390 145 S560 85 670 25" className={s.curveLine} />
            <circle cx="30" cy="215" r="9" className={s.curveDot} />
            <circle cx="390" cy="145" r="9" className={s.curveDot} />
            <circle cx="670" cy="25" r="12" className={s.curveDotEnd} />
          </svg>
          <div className={s.curveLabels}>
            <div><b>Day 1</b><small>Birbal starts learning<br />from your answers</small></div>
            <div><b>Day 25</b><small>Your gaps get clear</small></div>
            <div><b>Day 45</b><small>You know where you lose marks</small></div>
          </div>
        </article>

       
<article className={`${s.panel} ${s.dayPanel}`}>
  <div className={s.panelEyebrow}>ONE DAY IN BOOT CAMP</div>

  
<div className={s.dayStrip}>
  <span>01 · WARM-UP</span>
  <span>02 · RC TRAINING</span>
  <span>03 · VERBAL ABILITY</span>
  <span>04 · REVIEW</span>
</div>


  <div className={s.dayMeta}>
    <span>5 questions</span>
    <span>12 questions</span>
    <span>8 questions</span>
    <span>Birbal</span>
  </div>

  <strong className={s.dayTotal}>
    25 questions · About 30 minutes a day
  </strong>
</article>


       
<article className={`${s.panel} ${s.gapPanel}`}>
  <div className={s.panelEyebrow}>
    YOUR GAP REPORT <span>SAMPLE</span>
  </div>

  <h2>Your VARC performance, at a glance</h2>

  <div className={s.gapSummary}>
    <div className={s.gapSummaryStrength}>
      <span>STRENGTH</span>
      <b>Main idea</b>
      <small>82% accuracy</small>
    </div>

    <div className={s.gapSummaryFocus}>
      <span>FOCUS AREA</span>
      <b>Inference</b>
      <small>42% accuracy</small>
    </div>

    <div className={s.gapSummaryTrend}>
      <span>PROGRESS</span>
      <b>Track your trend</b>
      <small>Review accuracy over time</small>
    </div>
  </div>

  <h3 className={s.gapSubheading}>Accuracy by question type</h3>

  {gaps.map(([label, status, width]) => (
    <div className={s.gapRow} key={label}>
      <div>
        <span>{label}</span>
        <b>{status}</b>
      </div>
      <div className={s.gapTrack}>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  ))}

  <p className={s.gapNote}>
    Birbal helps you identify recurring mistakes and focus your next practice.
  </p>
</article>


        <article className={`${s.panel} ${s.founderPanel}`}>
          <img src="/assets/founder.jpeg" alt="Neraj Kumar Naiyar" loading="lazy" />
          <div><div className={s.panelEyebrow}>BUILT FROM THE CLASSROOM</div><h2>Neraj Kumar Naiyar</h2><p>Teaching CAT aspirants for over 15 years.</p></div>
        </article>
      </section>

      <section className={s.proofSection}>
        <div className={s.panelEyebrow}>STUDENTS ON AUCTOR</div>
        <div className={s.videoRow}>
         <PlayCard
  name="Ishaan Chandrakar"
  image="/assets/video-1.jpeg"
  video="/assets/video1.mp4"
/>

<PlayCard
  name="Bhoomi Saluja"
  image="/assets/video2.jpeg"
  video="/assets/video2.mp4"
/>

<PlayCard
  name="Rushill"
  image="/assets/video3.jpeg"
  video="/assets/video3.mp4"
/>
        </div>
        <div className={s.testimonialRow}>
          {testimonials.map((item) => (
            <article className={s.testimonial} key={item.name}>
              <div className={s.stars}>★★★★★</div>
              <p>“{item.text}”</p>
              <div className={s.person}>
                <img src={item.photo} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <strong>{item.name}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={s.offerFaq}>
        <article className={s.offer}>
          <div className={s.panelEyebrow}>THE FULL 45-DAY BOOT CAMP</div>
          <div className={s.price}>
  <del>₹999</del>
  <strong>₹799</strong>
  <span>Bootcamp offer</span>
</div>
          <ul>
            <li>All 45 days of Verbal Ability practice</li>
            <li>Birbal's review and your gap report</li>
            <li>Daily streak and leaderboard</li>
          </ul>
          <small>Day 1 is free, so you can see how it works first.</small>
          <CTA location="price" />
        </article>

        <div className={s.faq}>
          <h2>Quick answers</h2>
         
{[
  {
    q: 'What is the 45-day Boot Camp?',
    a: 'A guided daily VARC routine with warm-up questions, three RC passages, Verbal Ability practice and review with Birbal.'
  },
  {
    q: 'How is Boot Camp different from mock tests?',
    a: 'Mocks measure your performance. Boot Camp connects daily practice and review so you can work on recurring mistakes.'
  },
  {
    q: 'What will I practise each day?',
    a: 'Five warm-up questions, 12 RC questions and 8 Verbal Ability questions, followed by review with Birbal.'
  },
  {
    q: 'How does Birbal identify my weak areas?',
    a: 'Birbal uses your answers and mistake patterns to highlight question types that need more practice.'
  },
  {
    q: 'Can I use Boot Camp alongside mock tests?',
    a: 'Yes. Use mocks to benchmark your performance and Boot Camp to practise, review mistakes and target weak areas.'
  },
  {
    q: 'What does the ₹799 offer include?',
    a: 'The 45-day guided Boot Camp, daily VARC practice, Birbal review, progress insights and leaderboard features. Day 1 is free to try.'
  }
].map(({ q, a }) => (
  <details
    key={q}
    onToggle={(e) => {
      if (e.currentTarget.open) openFaq(q)
    }}
  >
    <summary>{q}<span>+</span></summary>
    <p>{a}</p>
  </details>
))}

        </div>
      </section>

      <section className={s.finalCard}>
        <div className={s.finalNumber}>45</div>
        <div><b>DAY<br />BOOT CAMP</b><h2>{days} days to CAT. Start training today.</h2></div>
        <CTA location="final" />
      </section>

      <footer className={s.footer}><span>Auctor RC · Focused CAT VARC practice</span><a href="/privacy">Privacy</a></footer>

      <div className={s.sticky}>
        <div><b>45-DAY BOOT CAMP</b><span>{days} days to CAT</span></div>
        <CTA location="sticky" />
      </div>
    </main>
  )
}
