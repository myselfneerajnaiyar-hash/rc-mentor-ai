import { captureLearningEvent } from "@/lib/learningAnalytics";

export function captureFirstSessionEvent(name, attemptId, properties = {}, dedupeKey = name) {
  if (typeof window === "undefined") return;
  const key = `auctor:first-session:event:${attemptId}:${dedupeKey}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // Continue with the event if browser storage is disabled.
  }
  captureLearningEvent(name, properties);
}
