const ONBOARDING_DESTINATIONS = Object.freeze({
  bootcamp: "/boot-camp",
  "/inbox": "/inbox",
  cat: "/?view=cat",
  pricing: "/pricing",
})

export function getOnboardingDestination(next, free) {
  if (next === "cat" && free === "1") return "/?view=cat&free=1"
  return Object.hasOwn(ONBOARDING_DESTINATIONS, next) ? ONBOARDING_DESTINATIONS[next] : "/"
}
