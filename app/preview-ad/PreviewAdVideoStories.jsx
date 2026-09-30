'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export default function PreviewAdVideoStories({ stories }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedStory, setSelectedStory] = useState(null)
  const carouselRef = useRef(null)

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return undefined
    const update = () => {
      const cards = [...carousel.querySelectorAll('.ad-video-card')]
      if (!cards.length) return
      const center = carousel.scrollLeft + carousel.clientWidth / 2
      const nearest = cards.reduce((best, card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        return Math.abs(cardCenter - center) < best.distance ? { index, distance: Math.abs(cardCenter - center) } : best
      }, { index: 0, distance: Infinity })
      setActiveIndex(nearest.index)
    }
    carousel.addEventListener('scroll', update, { passive: true })
    update()
    return () => carousel.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    if (!selectedStory) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = event => { if (event.key === 'Escape') setSelectedStory(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedStory])

  const scrollToStory = index => {
    const card = carouselRef.current?.querySelectorAll('.ad-video-card')[index]
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return <>
    <div className="ad-video-carousel" ref={carouselRef} aria-label="Student video stories">
      {stories.map(story => <button className="ad-video-card" key={story.name} type="button" onClick={() => setSelectedStory(story)} aria-label={`Play ${story.name}'s story: ${story.title}`}>
        <Image src={story.image} alt={`${story.name}, Auctor RC student`} width={640} height={360} quality={65} loading="lazy" sizes="(max-width: 650px) 84vw, (max-width: 1000px) 44vw, 360px" />
        <span className="ad-play" aria-hidden="true">▶</span>
        <span className="ad-story-copy"><strong>{story.title}</strong><small>{story.name} · student experience</small></span>
      </button>)}
    </div>
    <div className="ad-video-pagination" aria-label={`Story ${activeIndex + 1} of ${stories.length}`}>
      {stories.map((story, index) => <button key={story.name} type="button" aria-label={`Show story ${index + 1}`} aria-current={activeIndex === index ? 'true' : undefined} onClick={() => scrollToStory(index)} />)}
    </div>
    {selectedStory && <div className="ad-video-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedStory(null) }}>
      <section className="ad-video-dialog" role="dialog" aria-modal="true" aria-label={`${selectedStory.name} student story`}>
        <button className="ad-video-close" type="button" onClick={() => setSelectedStory(null)} aria-label="Close video">×</button>
        <video key={selectedStory.video} controls autoPlay playsInline preload="none" poster={selectedStory.image}>
          <source src={selectedStory.video} type="video/mp4" />
          Your browser does not support video playback.
        </video>
        <p><strong>{selectedStory.name}</strong><span>{selectedStory.title}</span></p>
      </section>
    </div>}
  </>
}
