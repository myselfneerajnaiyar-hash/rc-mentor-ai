import test from "node:test"
import assert from "node:assert/strict"
import { authorizeTenantMembership } from "../lib/tenant/authorization.js"
import { buildInstituteBranding } from "../lib/tenant/branding.js"
import { getExamCapabilities, normalizeExam } from "../lib/tenant/capabilities.js"

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
