import { normalizeExam } from "../tenant/capabilities.js"

// Explicitly approved product announcements only. There is no current announcement.
// Entries require a stable id, type, title, body, startsAt, endsAt, actionUrl and
// audience: { all: true } OR { exams: [recognized exam names] }.
export const INBOX_ANNOUNCEMENTS = Object.freeze([])

export function inboxAnnouncements(profile, now, announcements = INBOX_ANNOUNCEMENTS) {
  const time = new Date(now).getTime()
  return announcements.filter((entry) =>
    ["FEATURE_UPDATE", "SYSTEM"].includes(entry.type) && typeof entry.id === "string" && entry.id.length > 0 && entry.id.length <= 120 &&
    entry.title && entry.body && Date.parse(entry.startsAt) <= time && time < Date.parse(entry.endsAt) &&
    (entry.audience?.all === true || (normalizeExam(profile.exam) !== "Unassigned" && entry.audience?.exams?.includes(normalizeExam(profile.exam))))
  ).map((entry) => ({ userId: profile.user_id, type: entry.type, title: entry.title, body: entry.body, preview: entry.body.slice(0, 320), source: "Auctor", actionUrl: entry.actionUrl, priority: 3, idempotencyKey: "announcement:" + entry.id, ruleKey: "announcement:" + entry.id }))
}
