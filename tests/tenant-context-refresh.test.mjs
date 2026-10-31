import assert from "node:assert/strict"
import test from "node:test"
import { getContextRefreshFailureState } from "../lib/tenant/contextRefresh.mjs"

test("a transient refresh failure preserves the same user's confirmed access", () => {
  const current = {
    access: "allowed",
    loading: false,
    user: { id: "subscriber-1" },
    entitlement: { kind: "subscription", hasAccess: true, isPremium: true },
  }
  const next = getContextRefreshFailureState(current, new Error("request timed out"), "subscriber-1")

  assert.equal(next.access, "allowed")
  assert.equal(next.entitlement.hasAccess, true)
  assert.equal(next.refreshError, "request timed out")
})

test("initial, changed-user, and denied sessions still fail closed after refresh failure", () => {
  const pending = getContextRefreshFailureState({ access: "pending", user: null }, new Error("offline"), "subscriber-1")
  assert.equal(pending.access, "network_error")

  const changedUser = getContextRefreshFailureState({ access: "allowed", user: { id: "previous-user" } }, new Error("offline"), "subscriber-1")
  assert.equal(changedUser.access, "network_error")

  const denied = getContextRefreshFailureState({ access: "denied", user: { id: "subscriber-1" } }, new Error("offline"), "subscriber-1")
  assert.equal(denied.access, "network_error")
})
