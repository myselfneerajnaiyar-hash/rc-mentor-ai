import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = path => readFile(new URL(path, import.meta.url), "utf8")

test("profile loading ends with a retryable error when auth or profile loading fails", async () => {
  const source = await read("../components/ProfileView.jsx")

  assert.match(source, /const \[profileLoading, setProfileLoading\] = useState\(true\)/)
  assert.match(source, /finally\s*\{\s*setProfileLoading\(false\)/)
  assert.match(source, /if \(!profile && profileLoading\)/)
  assert.match(source, /if \(!profile\) return/)
  assert.match(source, /role="alert"/)
  assert.match(source, /onClick=\{loadProfile\}/)
  assert.match(source, /useEffect\(\(\) => \{\s*void loadProfile\(\);\s*\}, \[loadProfile\]\)/)
})

test("profile data queries retain their existing user-scoped contracts", async () => {
  const source = await read("../components/ProfileView.jsx")

  assert.match(source, /from\("profiles"\)\s*\.select\("\*"\)\s*\.eq\("user_id", userId\)\s*\.maybeSingle\(\)/)
  assert.match(source, /from\("subscriptions"\)\s*\.select\("\*"\)\s*\.eq\("user_id", userId\)/)
  assert.match(source, /from\("rc_questions"\)\s*\.select\("\*"\)\s*\.eq\("user_id", userId\)/)
})

test("trial status remains dynamic below the desktop logo and uses its existing pricing destination", async () => {
  const [sidebar, promotions, dashboard] = await Promise.all([
    read("../components/StudentDesktopSidebar.jsx"),
    read("../components/TrialPromotions.jsx"),
    read("../app/page.js"),
  ])

  assert.match(sidebar, /<TrialStatusChip className="mt-4 self-start"\s*\/>/)
  assert.match(promotions, /if \(!showPricing \|\| state\.type !== "active"\) return null/)
  assert.match(promotions, /href="\/pricing\?source=trial_chip"/)
  assert.match(dashboard, /window\.innerWidth < 768/)
  assert.match(dashboard, /isMobile === false[\s\S]*?<StudentDesktopSidebar/)
  assert.match(dashboard, /dashboard-mobile-header[\s\S]*?md:hidden/)
})
