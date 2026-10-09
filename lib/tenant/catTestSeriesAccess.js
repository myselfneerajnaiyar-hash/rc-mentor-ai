const CAT_TEST_SERIES_PLANS = Object.freeze(["cat_test_series", "half_yearly", "yearly"])

export function hasCATTestSeriesAccess(subscriptions, now = new Date()) {
  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return (subscriptions || []).some(subscription => {
    if (!CAT_TEST_SERIES_PLANS.includes(subscription?.plan)) return false
    const expiry = subscription?.expires_at ? new Date(subscription.expires_at).getTime() : NaN
    return Number.isFinite(expiry) && currentTime < expiry
  })
}
