import { hasActiveCATSectionalSubscription } from "./entitlement.js"

export function hasCATTestSeriesAccess(subscriptions, now = new Date()) {
  return hasActiveCATSectionalSubscription(subscriptions, now)
}

export function getCATTestSeriesAccessStatus({ loading = false, error = null } = {}) {
  if (loading) return "checking"
  if (error) return "error"
  return "ready"
}

export function isCATSectionalPublished(sectional) {
  return sectional?.is_published === true
}

export function canAccessCATSectional(sectional, entitlement) {
  return isCATSectionalPublished(sectional)
    && (sectional?.is_free === true || entitlement?.hasCATSectionalAccess === true)
}

export function isCATSectionalLocked(sectional, hasFullCATAccess) {
  return sectional?.is_free !== true && !hasFullCATAccess
}
