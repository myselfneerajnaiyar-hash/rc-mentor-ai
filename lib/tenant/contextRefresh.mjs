export function getContextRefreshFailureState(current, error, userId) {
  const sameConfirmedUser = Boolean(
    userId &&
    current?.access === "allowed" &&
    current?.user?.id === userId
  )

  if (sameConfirmedUser) {
    return { ...current, loading: false, refreshError: error?.message || "Unable to refresh session context." }
  }

  return {
    ...current,
    loading: false,
    access: "network_error",
    error: error?.message || "Unable to load session context.",
  }
}
