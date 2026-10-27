export function buildLearningEventProperties(properties = {}, context = {}) {
  const attribution = context.attribution || {}
  return Object.fromEntries(
    Object.entries({
      ...properties,
      ...attribution,
      session_id: context.sessionId,
      device: context.device,
      source: context.source || attribution.utm_source,
    }).filter(([, value]) => value !== undefined && value !== null && value !== "")
  )
}
