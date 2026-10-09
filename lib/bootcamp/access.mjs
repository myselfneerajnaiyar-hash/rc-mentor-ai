import { getEffectiveEntitlement } from '../tenant/entitlement.js'
import { BootCampError } from './content.mjs'
import { isBootCampPreviewUser } from './clock.mjs'
import { BOOTCAMP_ACCESS_END } from './calendar.mjs'
const STANDARD_PLANS = ['monthly', 'quarterly', 'half_yearly', 'yearly']
const ACCESS_PLANS = [...STANDARD_PLANS, 'cat_test_series']

/** Canonical server-side Boot Camp access resolver. */
export async function getBootCampAccess(db, { userId, profile, resolvedTenant, now = new Date() }) {
  const nowDate = now instanceof Date ? now : new Date(now)
  const entitlement = getEffectiveEntitlement({ profile, resolvedTenant, now: nowDate })
  const { data: claim, error: claimError } = await db.from('bootcamp_access')
    .select('source,claimed_at,expires_at').eq('user_id', userId).eq('program_key', 'bootcamp').maybeSingle()
  if (claimError) throw new BootCampError('Unable to verify your access. Please retry.', 503)
  const firstFreeClaimed = Boolean(claim)
  const canClaimFirstFree = !firstFreeClaimed
  const activeAccess = (source, expiresAt = null) => ({ allowed: true, source, expiresAt, firstFreeClaimed, canClaimFirstFree })
  if (entitlement.kind === 'institute') return activeAccess('institute')

  const { data: subscriptions, error: subscriptionError } = await db.from('subscriptions')
    .select('plan,expires_at').eq('user_id', userId).in('plan', ACCESS_PLANS)
    .gt('expires_at', nowDate.toISOString()).order('expires_at', { ascending: false })
  if (subscriptionError) throw new BootCampError('Unable to verify your access. Please retry.', 503)

  const activeSubscription = (subscriptions || []).find(row => STANDARD_PLANS.includes(row.plan))
  if (activeSubscription) return activeAccess('subscription', activeSubscription.expires_at)
  const activeTestSeries = (subscriptions || []).find(row => row.plan === 'cat_test_series')
  if (activeTestSeries) return activeAccess('test_series', activeTestSeries.expires_at)

  // Preserve legacy manually granted premium access, but exclude the separate 3-day trial.
  if (entitlement.kind === 'premium') return activeAccess('subscription', profile.premium_expires_at || null)

  const claimIsActive = firstFreeClaimed && (claim.expires_at == null || new Date(claim.expires_at).getTime() > nowDate.getTime())
  // Day 1 is a permanent, read-only free experience. Keep the separate
  // first-free claim history intact; this fallback grants no later days.
  return { allowed: true, source: claimIsActive ? claim.source : 'day1_free', expiresAt: claimIsActive ? claim.expires_at : null, firstFreeClaimed, canClaimFirstFree: !firstFreeClaimed }
}

/** The unique user/program constraint makes this insert race-safe. */
export async function claimFirstFreeBootcamp(db, userId, now = new Date()) {
  const accessExpiry = new Date(Date.parse(`${BOOTCAMP_ACCESS_END}T00:00:00+05:30`) + 86400000).toISOString()
  const { data, error } = await db.from('bootcamp_access').insert({ user_id: userId, program_key: 'bootcamp', source: 'first_free', claimed_at: (now instanceof Date ? now : new Date(now)).toISOString(), expires_at: accessExpiry })
    .select('user_id,program_key,source,claimed_at,expires_at').maybeSingle()
  if (error?.code === '23505') return { claimed: false, access: data || null }
  if (error) throw new BootCampError('Unable to claim Boot Camp access. Please retry.', 503)
  return { claimed: true, access: data }
}

// Reuse the existing payment/trial/institute policy; Boot Camp does not extend it.
export function requireBootCampEntitlement(context,now=new Date()) {
  const entitlement=getEffectiveEntitlement({...context,now})
  if(!entitlement.hasAccess)throw new BootCampError('An active trial or subscription is required for Boot Camp.',402)
  return entitlement
}

// Use the date simulator's allowlist for Preview-only entitlement bypass.
// Tenant membership and published-content checks remain separate.
export function requireBootCampAccess(context,{email,env=process.env,now=new Date()}={}) {
  if(isBootCampPreviewUser(email,env))return {kind:'preview',hasAccess:true,isPremium:false,isInstituteStudent:false}
  return requireBootCampEntitlement(context,now)
}

