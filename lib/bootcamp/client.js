'use client'
import { supabase } from '@/lib/supabase'
export async function bootcampRequest(path = '', method = 'GET', body) {
  let testDate=''
  if(typeof window!=='undefined') {
    const params=new URLSearchParams(window.location.search)
    const requested=params.get('testDate')
    if(params.has('testDate')&&!requested)sessionStorage.removeItem('bootcamp-test-date')
    else if(requested && /^\d{4}-\d{2}-\d{2}$/.test(requested))sessionStorage.setItem('bootcamp-test-date',requested)
    testDate=sessionStorage.getItem('bootcamp-test-date')||''
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { const error = new Error('Sign in to start your session.'); error.status = 401; throw error }
  const url=new URL(`/api/bootcamp${path}`,window.location.origin)
  if(testDate)url.searchParams.set('testDate',testDate)
  const response = await fetch(url, { method, cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const result = await response.json()
  if (!response.ok) { const error = new Error(result.error || 'Unable to save. Please retry.'); error.status = response.status; throw error }
  return result
}
