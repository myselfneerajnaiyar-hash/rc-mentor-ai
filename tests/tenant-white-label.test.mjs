import test from "node:test"
import assert from "node:assert/strict"
import { authorizeTenantMembership } from "../lib/tenant/authorization.js"
import { buildInstituteBranding } from "../lib/tenant/branding.js"
import { getExamCapabilities, normalizeExam } from "../lib/tenant/capabilities.js"
import { getEffectiveEntitlement } from "../lib/tenant/entitlement.js"

const abc = { ok: true, kind: "institute", institute: { id: "abc-id" } }

test("B2C remains an explicit non-institute tenant", () => {
  assert.deepEqual(authorizeTenantMembership({ ok: true, kind: "b2c" }, { institute_id: null }), { allowed: true, reason: null })
})

test("ABC CAT student receives CAT-only capabilities", () => {
  assert.equal(authorizeTenantMembership(abc, { institute_id: "abc-id" }).allowed, true)
  assert.deepEqual(getExamCapabilities("cat"), { exam: "CAT", isCAT: true, showDailyRC: true, showCATSectionals: true })
})

test("ABC CLAT and IPMAT students do not receive CAT capabilities", () => {
  for (const exam of ["CLAT", "IPMAT"]) {
    const capabilities = getExamCapabilities(exam)
    assert.equal(capabilities.showDailyRC, false)
    assert.equal(capabilities.showCATSectionals, false)
  }
})

test("wrong-institute and B2C profiles are denied on an institute hostname", () => {
  assert.equal(authorizeTenantMembership(abc, { institute_id: "other-id" }).reason, "wrong_institute")
  assert.equal(authorizeTenantMembership(abc, { institute_id: null }).reason, "institute_membership_required")
})

test("unknown hostnames fail closed", () => {
  assert.equal(authorizeTenantMembership({ ok: false, kind: "unknown" }, { institute_id: "abc-id" }).reason, "unknown_hostname")
})

test("missing institute branding uses safe Auctor assets and colors", () => {
  const branding = buildInstituteBranding({ id: "abc-id", name: "ABC Institute", hostname: "abc.auctorlabs.in" })
  assert.equal(branding.brandName, "ABC Institute")
  assert.equal(branding.logoUrl, "/logo.png")
  assert.equal(branding.faviconUrl, "/icon-192.png")
  assert.match(branding.primaryColor, /^#[0-9a-f]{6}$/i)
})

test("exam aliases normalize without defaulting unknown exams to CAT", () => {
  assert.equal(normalizeExam("Bank PO"), "Banking")
  assert.equal(normalizeExam("xat"), "XAT")
  assert.equal(normalizeExam("something new"), "Unassigned")
  assert.equal(getExamCapabilities("something new").isCAT, false)
})

const b2c = { ok: true, kind: "b2c", institute: null }
const now = new Date("2026-08-15T12:00:00.000Z")

test("B2C active trial retains trial access", () => {
  const result = getEffectiveEntitlement({ profile: { institute_id: null, trial_expires_at: "2026-08-16T12:00:00.000Z" }, resolvedTenant: b2c, now })
  assert.equal(result.kind, "trial")
  assert.equal(result.hasAccess, true)
})

test("B2C expired trial without subscription remains restricted", () => {
  const result = getEffectiveEntitlement({ profile: { institute_id: null, trial_expires_at: "2026-08-14T12:00:00.000Z" }, resolvedTenant: b2c, now })
  assert.equal(result.kind, "restricted")
  assert.equal(result.hasAccess, false)
})

test("B2C paid user retains premium access", () => {
  const result = getEffectiveEntitlement({ profile: { institute_id: null }, resolvedTenant: b2c, subscription: { expires_at: "2026-09-15T12:00:00.000Z" }, now })
  assert.equal(result.kind, "subscription")
  assert.equal(result.isPremium, true)
})

test("institute CAT and CLAT students have full entitlement without a B2C subscription", () => {
  for (const exam of ["CAT", "CLAT"]) {
    const result = getEffectiveEntitlement({ profile: { institute_id: "abc-id", exam }, resolvedTenant: abc, now })
    assert.equal(result.kind, "institute")
    assert.equal(result.isPremium, true)
  }
})

test("expired trial metadata never restricts an authorized institute student", () => {
  const result = getEffectiveEntitlement({ profile: { institute_id: "abc-id", trial_expires_at: "2020-01-01T00:00:00.000Z" }, resolvedTenant: abc, now })
  assert.equal(result.hasAccess, true)
})

test("null institute ID remains B2C and unauthenticated users have no entitlement", () => {
  assert.equal(getEffectiveEntitlement({ profile: { institute_id: null }, resolvedTenant: b2c, now }).isInstituteStudent, false)
  assert.equal(getEffectiveEntitlement({ profile: null, resolvedTenant: abc, now }).hasAccess, false)
})

test("hostname mismatch cannot grant institute entitlement", () => {
  const result = getEffectiveEntitlement({ profile: { institute_id: "other-id" }, resolvedTenant: abc, now })
  assert.equal(result.isInstituteStudent, false)
  assert.equal(result.hasAccess, false)
})

test("exam capabilities remain independent from institute entitlement", () => {
  const cat = getExamCapabilities("CAT")
  assert.equal(cat.showDailyRC, true)
  assert.equal(cat.showCATSectionals, true)
  for (const exam of ["CLAT", "IPMAT"]) {
    const capabilities = getExamCapabilities(exam)
    assert.equal(capabilities.showDailyRC, false)
    assert.equal(capabilities.showCATSectionals, false)
    assert.equal(getEffectiveEntitlement({ profile: { institute_id: "abc-id", exam }, resolvedTenant: abc, now }).hasAccess, true)
  }
})
