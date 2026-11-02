import assert from "node:assert/strict"
import test from "node:test"
import { ANACADEMY_HOSTNAME, ANACADEMY_INSTITUTE_ID, getInstituteHostRedirectPath, isAnacademyInstituteContext } from "../lib/tenant/instituteHostRouting.mjs"

test("ANACADEMY root and public trial routes go to the student login page", () => {
  for (const pathname of ["/", "/preview", "/preview/campaign", "/preview-ad", "/signup"]) {
    assert.equal(getInstituteHostRedirectPath(ANACADEMY_HOSTNAME, pathname), "/login", pathname)
  }
})
test("login and authenticated app routes remain directly accessible", () => {
  for (const pathname of ["/login", "/welcome", "/dashboard", "/api/tenant-context"]) {
    assert.equal(getInstituteHostRedirectPath(ANACADEMY_HOSTNAME, pathname), null, pathname)
  }
})

test("routing is exact-host only and normalizes host casing and ports", () => {
  assert.equal(getInstituteHostRedirectPath("ANACADEMY.AUCTORLABS.IN:443", "/preview"), "/login")
  assert.equal(getInstituteHostRedirectPath("rc.auctorlabs.in", "/preview"), null)
  assert.equal(getInstituteHostRedirectPath("other.auctorlabs.in", "/"), null)
})

test("server branding seed accepts only the configured ANACADEMY institute record", () => {
  assert.equal(isAnacademyInstituteContext({ ok: true, kind: "institute", hostname: ANACADEMY_HOSTNAME, institute: { id: ANACADEMY_INSTITUTE_ID } }), true)
  assert.equal(isAnacademyInstituteContext({ ok: true, kind: "institute", hostname: ANACADEMY_HOSTNAME, institute: { id: "another-institute" } }), false)
  assert.equal(isAnacademyInstituteContext({ ok: true, kind: "institute", hostname: "other.auctorlabs.in", institute: { id: ANACADEMY_INSTITUTE_ID } }), false)
})
