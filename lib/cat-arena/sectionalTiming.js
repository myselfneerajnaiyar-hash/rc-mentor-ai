export const CAT_ARENA_SECTIONAL_DURATION_SECONDS = 40 * 60;

export const CAT_ARENA_SECTIONAL_DURATION_MINUTES =
  CAT_ARENA_SECTIONAL_DURATION_SECONDS / 60;

export function remainingSectionalSeconds(now, deadline) {
  const deadlineMs = typeof deadline === "number" ? deadline : Date.parse(deadline);
  return Math.max(0, Math.ceil((deadlineMs - now) / 1000));
}
