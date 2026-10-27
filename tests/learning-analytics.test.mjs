import test from "node:test"
import assert from "node:assert/strict"
import { buildLearningEventProperties } from "../lib/analytics/learningEventProperties.mjs"

test("learning events carry first-touch UTM fields, last-touch UTM, and session context", () => {
  const properties = buildLearningEventProperties(
    { attempt_id: "attempt-1", question_number: 2 },
    {
      attribution: {
        utm_source: "instagram",
        first_touch_utm_source: "instagram",
        first_touch_utm_campaign: "cat2026",
        last_touch_utm_source: "google",
        last_touch_utm_campaign: "retarget",
        landing_referrer: "instagram.com",
      },
      sessionId: "session-1",
      device: "Mobile",
    }
  )
  assert.deepEqual(properties, {
    attempt_id: "attempt-1",
    question_number: 2,
    utm_source: "instagram",
    first_touch_utm_source: "instagram",
    first_touch_utm_campaign: "cat2026",
    last_touch_utm_source: "google",
    last_touch_utm_campaign: "retarget",
    landing_referrer: "instagram.com",
    session_id: "session-1",
    device: "Mobile",
    source: "instagram",
  })
})

test("learning events omit unavailable attribution and device fields", () => {
  assert.deepEqual(buildLearningEventProperties({ attempt_id: "attempt-1" }), { attempt_id: "attempt-1" })
})
