export const ANACADEMY_HOSTNAME = "anacademy.auctorlabs.in"
export const ANACADEMY_INSTITUTE_ID = "84e51c75-463e-46a1-a37f-75d993de56d7"

export function isAnacademyInstituteContext(resolved) {
  return resolved?.ok === true &&
    resolved.kind === "institute" &&
    resolved.hostname === ANACADEMY_HOSTNAME &&
    resolved.institute?.id === ANACADEMY_INSTITUTE_ID
}

const LOGIN_ONLY_PATHS = ["/", "/preview", "/preview-ad", "/signup"]

export function getInstituteHostRedirectPath(hostname, pathname) {
  const normalizedHostname = String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")

  if (normalizedHostname !== ANACADEMY_HOSTNAME) return null

  const normalizedPath = pathname || "/"
  const isPublicPreviewRoute = LOGIN_ONLY_PATHS.includes(normalizedPath) ||
    normalizedPath.startsWith("/preview/") ||
    normalizedPath.startsWith("/preview-ad/")

  return isPublicPreviewRoute ? "/login" : null
}
