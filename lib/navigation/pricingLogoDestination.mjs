export function getPricingLogoDestination({ authenticated = false, dashboardOrigin = false } = {}) {
  return authenticated || dashboardOrigin ? "/" : "/preview"
}
