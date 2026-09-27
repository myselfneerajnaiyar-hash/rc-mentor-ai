'use client'
import { supabase } from '@/lib/supabase'
export async function bootcampRequest(path = '', method = 'GET', body) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { const error = new Error('Sign in to start your session.'); error.status = 401; throw error }
  const response = await fetch(`/api/bootcamp${path}`, { method, cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const result = await response.json()
  if (!response.ok) { const error = new Error(result.error || 'Unable to save. Please retry.'); error.status = response.status; throw error }
  return result
}
