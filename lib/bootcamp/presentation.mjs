import { BOOTCAMP_CALENDAR } from './calendar.mjs'

const FREE_DAY_ACCESS_SOURCES = new Set(['day1_free', 'first_free'])
const PAID_ACCESS_SOURCES = new Set(['subscription', 'test_series', 'institute', 'purchase'])

export function canPromoteBootCampFreeDay(access) {
  return access?.allowed === true && FREE_DAY_ACCESS_SOURCES.has(access.source)
}

export function hasPaidBootCampAccess(access) {
  return access?.allowed === true && PAID_ACCESS_SOURCES.has(access.source)
}

export function getBootCampHomeCardVariant(access) {
  return hasPaidBootCampAccess(access) ? 'included' : 'offer'
}

const isCompleted = day => day?.status === 'completed'
const dayPath = day => `/boot-camp/day/${day}`

function unavailableDay(day, calendar, contentAvailable = false) {
  const isUpcoming = !!calendar?.today && !!day?.releaseDate && day.releaseDate > calendar.today
  return {
    kind: isUpcoming ? 'upcoming' : contentAvailable ? 'scheduled' : 'preparing',
    day: day?.day ?? null,
    destination: 'calendar',
    headline: !day ? 'Your Boot Camp calendar is ready.'
      : isUpcoming ? `Day ${day.day} is upcoming.`
        : contentAvailable ? `Day ${day.day} is on today’s schedule.`
          : `Day ${day.day} is being prepared.`,
    message: 'Open the training calendar to see the next available day.',
    cta: 'Open Boot Camp',
    href: '/boot-camp',
  }
}

export function getBootCampHomeBannerState(access, catalog) {
  const included = hasPaidBootCampAccess(access)
  const days = Array.isArray(catalog?.days)
    ? catalog.days.filter(day => Number.isInteger(day?.day)).slice().sort((a, b) => a.day - b.day)
    : null
  const calendar = catalog?.calendar
  const day1 = days?.find(day => day.day === 1)

  if (!included) {
    if (!days || !day1) return {
      kind: 'fallback', day: null, destination: 'calendar', headline: 'Your Boot Camp is ready.',
      message: 'Open your training calendar to check your saved progress.', cta: 'Open Boot Camp', href: '/boot-camp',
    }
    if (!isCompleted(day1)) return {
      kind: 'free-day', day: 1, destination: 'day', headline: 'Day 1 is ready.',
      message: 'Start with the complete Day 1 experience, free.', cta: 'Start Day 1 Free', href: dayPath(1),
    }

    const todayDay = Number.isInteger(calendar?.todayDay) ? calendar.todayDay : null
    const target = todayDay > 1
      ? days?.find(day => day.day === todayDay)
      : days?.find(day => day.day > 1 && day.releaseDate > calendar?.today)
        || BOOTCAMP_CALENDAR.find(day => day.day > 1 && calendar?.today && day.date > calendar.today)
    if (!target) return {
      kind: 'unlock', day: null, destination: 'purchase', headline: 'Your free Day 1 is complete.',
      message: 'Unlock Boot Camp to continue with the full 45-day training experience.',
      cta: 'Unlock Boot Camp', href: '/pricing?offer=bootcamp',
    }

    const contentAvailable = target.contentAvailable === true
    const releaseDate = target.releaseDate ?? target.date
    const isUpcoming = !!calendar?.today && !!releaseDate && releaseDate > calendar.today
    return {
      kind: isUpcoming ? 'upcoming' : contentAvailable ? 'scheduled' : 'preparing',
      day: target.day, destination: 'purchase',
      headline: isUpcoming ? `Day ${target.day} is upcoming.`
        : contentAvailable ? `Day ${target.day} is live.` : `Day ${target.day} is being prepared.`,
      message: 'Day 1 is complete. Unlock Boot Camp to continue with the next training day.',
      cta: 'Unlock Boot Camp', href: '/pricing?offer=bootcamp',
    }
  }

  // Never infer completion from a missing catalog or a visit to a day route.
  if (!days) return {
    kind: 'fallback', day: null, destination: 'calendar', headline: 'Your Boot Camp is ready.',
    message: 'Open your training calendar to find your next available day.', cta: 'Open Boot Camp', href: '/boot-camp',
  }

  const nextIncomplete = days.find(day => day.accessible === true && !isCompleted(day))
  if (nextIncomplete) {
    const resume = ['in_progress', 'abandoned'].includes(nextIncomplete.status)
    return {
      kind: resume ? 'resume' : 'day', day: nextIncomplete.day,
      destination: 'day', headline: `Day ${nextIncomplete.day} is ready.`,
      message: resume ? 'Your saved progress is ready to continue.' : 'Your next available training day is ready.',
      cta: `${resume ? 'Continue' : 'Start'} Day ${nextIncomplete.day}`,
      href: dayPath(nextIncomplete.day),
    }
  }

  const today = days.find(day => day.day === calendar?.todayDay)
  if (isCompleted(today)) {
    const next = days.find(day => day.day > today.day && !isCompleted(day))
    const upcoming = next && calendar?.today && next.releaseDate > calendar.today
    const preparing = next && next.contentAvailable !== true && !upcoming
    return {
      kind: 'report', day: today.day, destination: 'report', headline: `Day ${today.day} is complete.`,
      message: upcoming ? `Day ${next.day} is upcoming. Your saved report is ready to review.`
        : preparing ? `Day ${next.day} is being prepared. Your saved report is ready to review.`
          : 'Your saved report is ready to review.',
      cta: `View Day ${today.day} Report`, href: `${dayPath(today.day)}/report`,
    }
  }

  if (days.length && days.every(isCompleted)) {
    const latest = days.at(-1)
    return {
      kind: 'report', day: latest.day, destination: 'report', headline: 'Your training is complete.',
      message: 'Your latest saved report is ready to review.', cta: `View Day ${latest.day} Report`,
      href: `${dayPath(latest.day)}/report`,
    }
  }

  const nextScheduled = days.find(day => !isCompleted(day))
  return unavailableDay(nextScheduled, calendar, nextScheduled?.contentAvailable === true)
}
