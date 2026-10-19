import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { canAccessCATSectional } from "../lib/tenant/catTestSeriesAccess.js"
import { getEffectiveEntitlement } from "../lib/tenant/entitlement.js"

const now = new Date("2026-10-19T12:00:00.000Z")
const paidSectional = { is_published: true, is_free: false }
const active = (plan, expiresAt = "2027-01-01T00:00:00.000Z") => ({ plan, expires_at: expiresAt })

for (const plan of ["monthly", "quarterly", "half_yearly", "yearly"]) {
  test(`${plan} grants the same full-platform and CAT Sectional entitlement until its expiry`, () => {
    const entitlement = getEffectiveEntitlement({
      profile: { is_premium: false },
      subscriptions: [active(plan)],
      now,
    })
    assert.deepEqual(
      { hasAccess: entitlement.hasAccess, isPremium: entitlement.isPremium, hasCATSectionalAccess: entitlement.hasCATSectionalAccess },
      { hasAccess: true, isPremium: true, hasCATSectionalAccess: true },
    )
    assert.equal(canAccessCATSectional(paidSectional, entitlement), true)
  })
}

test("the most recent expired or narrower subscription cannot mask another active paid duration", () => {
  const entitlement = getEffectiveEntitlement({
    profile: { is_premium: false },
    subscriptions: [
      active("cat_test_series", "2027-10-01T00:00:00.000Z"),
      active("quarterly", "2026-10-20T00:00:00.000Z"),
      active("yearly", "2026-10-18T00:00:00.000Z"),
    ],
    now,
  })
  assert.equal(entitlement.kind, "subscription")
  assert.equal(entitlement.isPremium, true)
  assert.equal(entitlement.hasCATSectionalAccess, true)
})

test("CAT Test Series remains sectional-only; expired subscriptions and trials do not unlock paid PYQs", () => {
  const catSeries = getEffectiveEntitlement({ profile: { is_premium: false }, subscription: active("cat_test_series"), now })
  assert.equal(catSeries.hasAccess, false)
  assert.equal(catSeries.isPremium, false)
  assert.equal(canAccessCATSectional(paidSectional, catSeries), true)

  const expired = getEffectiveEntitlement({
    profile: { is_premium: false, trial_expires_at: "2026-10-18T00:00:00.000Z" },
    subscriptions: [active("quarterly", "2026-10-18T00:00:00.000Z")],
    now,
  })
  assert.equal(expired.hasCATSectionalAccess, false)
  assert.equal(canAccessCATSectional(paidSectional, expired), false)

  const trial = getEffectiveEntitlement({ profile: { is_premium: false, trial_expires_at: "2026-10-20T00:00:00.000Z" }, now })
  assert.equal(trial.kind, "trial")
  assert.equal(canAccessCATSectional(paidSectional, trial), false)
  assert.equal(canAccessCATSectional({ is_published: true, is_free: true }, trial), true)
  assert.equal(canAccessCATSectional({ is_published: false, is_free: true }, trial), false)
})

test("catalog, test start, and database content/attempt policies use the shared sectional entitlement", async () => {
  const landing = await readFile(new URL("../cat-arena/CATArenaLandingV2.jsx", import.meta.url), "utf8")
  const sessionRoute = await readFile(new URL("../app/api/cat-sectionals/[id]/session/route.js", import.meta.url), "utf8")
  const contentRoute = await readFile(new URL("../app/api/cat-sectionals/[id]/route.js", import.meta.url), "utf8")
  const migration = await readFile(new URL("../supabase/migrations/20261019174033_cat_sectional_entitlements.sql", import.meta.url), "utf8")

  assert.match(landing, /entitlement\.hasCATSectionalAccess/)
  assert.match(sessionRoute, /requireCATSectionalAccess/)
  assert.match(contentRoute, /requireCATSectionalAccess/)
  assert.match(migration, /published sectional tests require entitlement or free access/)
  assert.match(migration, /sectional passages require parent test access/)
  assert.match(migration, /mentor_test_attempts_insert_own_with_access/)
  assert.match(migration, /mentor_test_attempts_select_own_with_access/)
  assert.match(migration, /mentor_test_attempts_update_own_with_access/)
  assert.match(migration, /'monthly', 'quarterly', 'half_yearly', 'yearly', 'cat_test_series'/)
})
