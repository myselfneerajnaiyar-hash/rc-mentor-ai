export function isTenantContextBypassedRoute(pathname) {
  return pathname === '/preview-ad' ||
    pathname === '/bootcamp-2026' || pathname.startsWith('/bootcamp-2026/') ||
    pathname === '/boot-camp' || pathname.startsWith('/boot-camp/')
}
