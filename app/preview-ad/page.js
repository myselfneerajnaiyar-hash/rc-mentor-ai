import Image from 'next/image'
import { attributionFromParams } from '@/lib/attribution.mjs'
import PreviewAdSignupExperience from './PreviewAdSignupExperience'
import PreviewAdFeatureShowcase from './PreviewAdFeatureShowcase'
import PreviewAdVideoStories from './PreviewAdVideoStories'
import './preview-ad.css'
import './preview-ad-signup.css'

const videoStories = [
  { name: 'Ishaan Chandrakar', title: 'From avoiding RC to enjoying reading', image: '/testimonials/video1.jpeg', video: '/testimonials/video1.mp4' },
  { name: 'Bhoomi Saluja', title: 'A daily routine that made reading easier', image: '/testimonials/video2.jpeg', video: '/testimonials/video2.mp4' },
  { name: 'Rushill', title: 'Understanding mistakes with Birbal', image: '/testimonials/video3.jpeg', video: '/testimonials/video3.mp4' },
]

const studentReviews = [
  { name: 'Keshu Sharma', image: '/testimonials/student1.jpeg', quote: 'I used to avoid reading because I never enjoyed it. After using Auctor consistently, reading has become a daily habit and I can clearly feel the improvement in my comprehension.' },
  { name: 'Pushti Kapoor', image: '/testimonials/student2.jpeg', quote: 'The Daily Workout feature kept me consistent. Instead of randomly practising RCs, I finally had a proper learning routine every day.' },
  { name: 'Nabeel', image: '/testimonials/student3.jpeg', quote: 'Birbal doesn’t just tell you the right answer. It explains why you were wrong, which completely changed how I approached Reading Comprehension.' },
]

export default function PreviewAdPage({ searchParams = {} }) {
  const signupAttribution = attributionFromParams(searchParams)

  return <main className="ad-page">
    <header className="ad-header">
      <a className="ad-brand" href="/preview-ad" aria-label="Auctor RC home">
        <Image src="/logo.png" alt="" width={34} height={34} priority />
        <span>Auctor <small>CAT VARC PRACTICE</small></span>
      </a>
      <a className="ad-login" href="/login">Already a student? <strong>Log in</strong></a>
    </header>

    <section className="ad-hero" aria-labelledby="ad-title">
      <div className="ad-hero-copy">
        <p className="ad-eyebrow"><span /> RC TRAINING TOOL</p>
        <h1 id="ad-title"><span className="ad-heading-line">Want to improve your</span>{' '}<span className="ad-heading-accent">Reading Comprehension</span>{' '}<span className="ad-heading-line">score?</span></h1>
        <div className="ad-founder-intro">
          <Image src="/founder.jpeg" alt="" width={58} height={58} priority />
          <p><strong>Built by Neeraj Sir</strong><span>16+ years teaching CAT</span></p>
        </div>
        <p className="ad-lead">Auctor RC is built by a CAT teacher to target your exact weak spots, not give you random practice.</p>
        <ul className="ad-benefits" aria-label="What you get with Auctor RC">
          <li><span aria-hidden="true">01</span> Daily CAT-level RC practice</li>
          <li><span aria-hidden="true">02</span> Understand why an option works</li>
          <li><span aria-hidden="true">03</span> Track your practice over time</li>
        </ul>
      </div>
      <PreviewAdSignupExperience initialAttribution={signupAttribution} />
    </section>

    <figure className="ad-hero-image">
      <Image src="/auctor-rc-student-hero.png" alt="A student practising a reading comprehension passage on a laptop" width={1536} height={1024} priority quality={65} sizes="(max-width: 760px) 92vw, 72vw" />
      <figcaption><span>THE DAILY PRACTICE</span><strong>Read. Reason. Review.</strong></figcaption>
    </figure>

    <section className="ad-proof" aria-label="Auctor RC student experience">
      <p>More than solving passages</p><span>Build a daily routine</span><i /><span>Review your reasoning</span><i /><span>See your progress</span>
    </section>

    <section className="ad-students" aria-labelledby="student-stories-title">
      <div className="ad-students-heading">
        <div><div className="ad-section-label">STUDENT EXPERIENCES</div><h2 id="student-stories-title">A practice routine<br/><span>students can stick with.</span></h2></div>
        <p>Hear how students use Auctor to make RC practice more focused and consistent.</p>
      </div>
      <PreviewAdVideoStories stories={videoStories} />
      <div className="ad-written-reviews">
        {studentReviews.map(review => <article className="ad-review" key={review.name}>
          <div className="ad-stars" aria-hidden="true">★★★★★</div>
          <blockquote>“{review.quote}”</blockquote>
          <div className="ad-review-person"><Image src={review.image} alt="" width={40} height={40} quality={60} loading="lazy" sizes="40px"/><strong>{review.name}</strong></div>
        </article>)}
      </div>
    </section>

    <section className="ad-classroom" aria-labelledby="classroom-title">
      <div className="ad-classroom-photo"><Image src="/founder.jpeg" alt="Neeraj Sir, founder of Auctor Labs" width={900} height={1100} sizes="(max-width: 650px) 82vw, 400px" loading="lazy" /></div>
      <div className="ad-classroom-copy">
        <div className="ad-section-label">BUILT FROM THE CLASSROOM</div>
        <h2 id="classroom-title">Built from the classroom.<br/><span>Designed for the CAT.</span></h2>
        <p>Auctor RC was created by Neeraj Sir, an educator with over 16 years of classroom teaching experience. Its approach is simple: improve by understanding how you reached an answer, not just seeing which option was correct.</p>
        <div className="ad-founder-caption"><strong>Neeraj Sir</strong><span>Educator · Auctor Labs</span></div>
      </div>
    </section>

    <section className="ad-process" aria-labelledby="process-title">
      <div className="ad-process-heading">
        <div className="ad-section-label">A BETTER PRACTICE LOOP</div>
        <h2 id="process-title">Practice is only<br/><span>the beginning.</span></h2>
        <p>Build understanding one passage at a time.</p>
      </div>
      <ol className="ad-process-steps">
        <li><span className="ad-step-number">01</span><div><strong>READ</strong><p>Work through CAT-level RC passages and notice how the ideas connect.</p></div></li>
        <li><span className="ad-step-number">02</span><div><strong>REASON</strong><p>Test each option against the passage and find the evidence that matters.</p></div></li>
        <li><span className="ad-step-number">03</span><div><strong>REVIEW</strong><p>Understand the explanation and spot patterns in your mistakes.</p></div></li>
      </ol>
    </section>

    <section className="ad-feature-section" aria-labelledby="feature-showcase-title">
      <div className="ad-section-label">EXPLORE THE PRACTICE TOOLKIT</div>
      <h2 id="feature-showcase-title">Tools for a more focused VARC practice routine.</h2>
      <p className="ad-feature-intro">Choose focused practice, build a daily habit, and get help understanding the reasoning.</p>
      <PreviewAdFeatureShowcase />
      <PreviewAdSignupExperience initialAttribution={signupAttribution} ctaOnly />
    </section>

    <footer className="ad-footer"><a href="/preview-ad">Auctor RC</a><span>Focused CAT VARC practice.</span><a href="/privacy-policy">Privacy</a></footer>
  </main>
}
