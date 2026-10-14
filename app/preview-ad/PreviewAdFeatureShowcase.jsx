'use client'

import { useCallback, useRef, useState } from 'react'
import posthog from 'posthog-js'
import { BookOpen, CalendarCheck, Gauge, GraduationCap, MessageCircle, Sparkles, TextSearch } from 'lucide-react'

const features = [
  {
    id: 'daily-rc-challenge',
    name: 'Daily RC Challenges',
    label: 'One focused passage',
    description: 'Work through a daily CAT reading passage and its questions, then review your attempt.',
    icon: CalendarCheck,
  },
  {
    id: 'daily-workout',
    name: 'Daily Workout',
    label: 'A guided practice routine',
    description: 'Bring RC, vocabulary, speed and verbal micro-skills together in one guided session.',
    icon: Gauge,
  },
  {
    id: 'varc-bootcamp',
    name: 'VARC Bootcamp',
    label: 'CAT-focused · 45 days',
    description: 'Follow a guided CAT VARC program with daily practice and detailed answer reviews.',
    icon: GraduationCap,
  },
  {
    id: 'passage-generator',
    name: 'Passage Generator',
    label: 'Practice with purpose',
    description: 'Generate complete Reading Comprehension passages or bring your own for guided practice.',
    icon: TextSearch,
  },
  {
    id: 'speed-drills',
    name: 'Speed Drills',
    label: 'Timed reading practice',
    description: 'Build a focused reading rhythm with short passages and comprehension questions.',
    icon: Gauge,
  },
  {
    id: 'vocabulary-lab',
    name: 'Vocabulary Lab',
    label: 'Learn · recall · revisit',
    description: 'Learn words, practise recall and revisit your word bank as you study.',
    icon: BookOpen,
  },
  {
    id: 'birbal-mentor',
    name: 'Birbal AI Mentor',
    label: 'Understand your reasoning',
    description: 'Ask follow-up questions about RC passages and answers to explore the reasoning behind them.',
    icon: MessageCircle,
  },
]

function captureFeatureSelection(feature, placement) {
  try {
    posthog.capture('preview_ad_feature_explored', { feature_id: feature.id, placement })
  } catch { /* Analytics must not affect feature browsing. */ }
}

export default function PreviewAdFeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef(null)
  const lastMobileSelection = useRef(0)

  const selectDesktopFeature = useCallback(index => {
    setActiveIndex(index)
    captureFeatureSelection(features[index], 'desktop_tab')
  }, [])

  const selectMobileFeature = useCallback(index => {
    setActiveIndex(index)
    lastMobileSelection.current = index
    const card = trackRef.current?.querySelectorAll('[data-feature-card]')[index]
    if (card) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      card.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'start' })
    }
    captureFeatureSelection(features[index], 'mobile_control')
  }, [])

  const updateMobileSelection = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const cards = [...track.querySelectorAll('[data-feature-card]')]
    if (!cards.length) return
    const center = track.scrollLeft + track.clientWidth / 2
    const nearest = cards.reduce((best, card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      return Math.abs(cardCenter - center) < best.distance ? { index, distance: Math.abs(cardCenter - center) } : best
    }, { index: 0, distance: Infinity }).index
    setActiveIndex(nearest)
    if (nearest !== lastMobileSelection.current) {
      lastMobileSelection.current = nearest
      captureFeatureSelection(features[nearest], 'mobile_swipe')
    }
  }, [])

  const onTabKeyDown = event => {
    let nextIndex = activeIndex
    if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % features.length
    else if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + features.length) % features.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = features.length - 1
    else return
    event.preventDefault()
    selectDesktopFeature(nextIndex)
    document.getElementById(`preview-feature-tab-${nextIndex}`)?.focus()
  }

  const activeFeature = features[activeIndex]
  const ActiveIcon = activeFeature.icon

  return <div className="ad-feature-showcase">
    <div className="ad-feature-desktop">
      <div className="ad-feature-tabs" role="tablist" aria-label="Explore Auctor features" onKeyDown={onTabKeyDown}>
        {features.map((feature, index) => <button
          key={feature.id}
          id={`preview-feature-tab-${index}`}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          aria-controls="preview-feature-panel"
          tabIndex={index === activeIndex ? 0 : -1}
          onClick={() => selectDesktopFeature(index)}
        >
          {feature.name}
        </button>)}
      </div>
      <section id="preview-feature-panel" className="ad-feature-panel" role="tabpanel" aria-labelledby={`preview-feature-tab-${activeIndex}`} tabIndex={0}>
        <span className="ad-feature-icon"><ActiveIcon size={25} aria-hidden="true" /></span>
        <div>
          <p className="ad-feature-label">{activeFeature.label}</p>
          <h3>{activeFeature.name}</h3>
          <p className="ad-feature-description">{activeFeature.description}</p>
        </div>
        <span className="ad-feature-count">{String(activeIndex + 1).padStart(2, '0')} <i>/</i> {String(features.length).padStart(2, '0')}</span>
      </section>
    </div>

    <div className="ad-feature-mobile">
      <p className="ad-feature-swipe-hint">Swipe to explore <span aria-hidden="true">→</span></p>
      <div className="ad-feature-track" ref={trackRef} onScroll={updateMobileSelection} role="region" tabIndex={0} aria-label="Auctor product features">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return <article className="ad-feature-card" key={feature.id} data-feature-card>
            <span className="ad-feature-icon"><Icon size={24} aria-hidden="true" /></span>
            <p className="ad-feature-label">{feature.label}</p>
            <h3>{feature.name}</h3>
            <p className="ad-feature-description">{feature.description}</p>
            <span className="ad-feature-count">{String(index + 1).padStart(2, '0')} <i>/</i> {String(features.length).padStart(2, '0')}</span>
          </article>
        })}
      </div>
      <div className="ad-feature-controls" aria-label="Choose a feature">
        <span aria-live="polite">{String(activeIndex + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}</span>
        <div>
          {features.map((feature, index) => <button
            key={feature.id}
            type="button"
            aria-label={`Show feature ${index + 1}: ${feature.name}`}
            aria-pressed={index === activeIndex}
            onClick={() => selectMobileFeature(index)}
          />)}
        </div>
      </div>
    </div>
    <Sparkles className="ad-feature-sparkle" size={16} aria-hidden="true" />
  </div>
}
