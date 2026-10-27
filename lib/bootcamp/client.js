'use client'
import { supabase } from '@/lib/supabase'
import posthog from 'posthog-js'
import { bootCampErrorCategory, createBootCampEventTracker, getBootCampAnalyticsContext } from './analytics.mjs'
import { bootCampCommitKey, dedupeBootCampCommit } from './commit-guard.mjs'

const apiErrorTracker = createBootCampEventTracker({
  getUserId: async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id || null
  },
  identify: userId => posthog.identify(userId),
  capture: (event, properties) => posthog.capture(event, properties),
})

export async function bootcampRequest(path = '', method = 'GET', body) {
  let session = null
  let testDate=''
  try {
    if(typeof window!=='undefined') {
      const params=new URLSearchParams(window.location.search)
      const requested=params.get('testDate')
      if(params.has('testDate')&&!requested)sessionStorage.removeItem('bootcamp-test-date')
      else if(requested && /^\d{4}-\d{2}-\d{2}$/.test(requested))sessionStorage.setItem('bootcamp-test-date',requested)
      testDate=sessionStorage.getItem('bootcamp-test-date')||''
    }
    const { data } = await supabase.auth.getSession()
    session = data.session
    if (!session) { const error = new Error('Sign in to start your session.'); error.status = 401; throw error }
    const url=new URL(`/api/bootcamp${path}`,window.location.origin)
    if(testDate)url.searchParams.set('testDate',testDate)
    const perform = async () => {
      const response = await fetch(url, { method, cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
      const result = await response.json()
      if (!response.ok) { const error = new Error(result.error || 'Unable to save. Please retry.'); error.status = response.status; error.code = result.code || null; throw error }
      return result
    }
    return await dedupeBootCampCommit(bootCampCommitKey(session.user.id, path, method, body), perform)
  } catch (error) {
    if (session?.user?.id) {
      const category = bootCampErrorCategory(error)
      const dayNumber = Number(path.match(/(?:\?|&)day=(\d+)|\/days\/(\d+)/)?.slice(1).find(Boolean)) || undefined
      void apiErrorTracker('bootcamp_error', {
        eventKey: `api-error:${session.user.id}:${path}:${category}:${error.status || 0}:${Math.floor(Date.now() / 1000)}`,
        userId: session.user.id,
        properties: {
          ...getBootCampAnalyticsContext(session.user.id),
          ...(dayNumber ? { day_number: dayNumber } : {}),
          error_category: category,
          http_status: error.status || null,
          enrollment_state: getBootCampAnalyticsContext(session.user.id).enrollment_state || 'unknown',
          access_state: getBootCampAnalyticsContext(session.user.id).access_state || 'unknown',
        },
      })
    }
    throw error
  }
}
