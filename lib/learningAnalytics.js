"use client";

import posthog from "posthog-js";
import { postHogAttributionProperties } from "./attribution.mjs";
import { buildLearningEventProperties } from "./analytics/learningEventProperties.mjs";

// Keep unavailable dimensions absent. PostHog supplies its own device and URL properties.
export function captureLearningEvent(name, properties = {}) {
  if (typeof window === "undefined") return;
  try {
    const sessionId = posthog.get_session_id?.();
    const device = posthog.get_property?.("$device_type");
    const source = new URLSearchParams(window.location.search).get("utm_source") ||
      posthog.get_property?.("$initial_utm_source");
    const attribution = postHogAttributionProperties();
    posthog.capture(name, buildLearningEventProperties(properties, {
      attribution,
      sessionId,
      device,
      source: source || attribution.utm_source,
    }));
  } catch {
    // Analytics must never interrupt an activity.
  }
}

function activityKey(activityType, activityId) {
  return `${activityType}:${activityId || ""}:${new Date().toISOString().slice(0, 10)}`;
}

export function startLearningActivity(activityType, activityId, properties = {}) {
  if (typeof window === "undefined") return;
  const dimensions = { activity_type: activityType, activity_id: activityId, ...properties };
  captureLearningEvent("activity_started", dimensions);
  try {
    const key = `auctor_learning_first_activity:${posthog.get_distinct_id?.() || "anonymous"}`;
    const current = activityKey(activityType, activityId);
    const first = window.localStorage.getItem(key);
    if (first && first !== current && !window.localStorage.getItem(`${key}:second`)) {
      window.localStorage.setItem(`${key}:second`, current);
      captureLearningEvent("second_activity_started", dimensions);
    }
    if (!first) window.localStorage.setItem(key, current);
    window.sessionStorage.setItem("auctor_learning_current_activity", current);
  } catch {
    // Storage may be disabled; the base event was still captured.
  }
}

export function completeLearningActivity(activityType, activityId, properties = {}) {
  if (typeof window === "undefined") return;
  const dimensions = { activity_type: activityType, activity_id: activityId, ...properties };
  captureLearningEvent("activity_completed", dimensions);
  window.dispatchEvent(new Event("auctor:activity-saved"));
  try {
    const key = `auctor_learning_first_activity:${posthog.get_distinct_id?.() || "anonymous"}`;
    const current = window.sessionStorage.getItem("auctor_learning_current_activity") || activityKey(activityType, activityId);
    if (window.localStorage.getItem(`${key}:second`) === current && !window.localStorage.getItem(`${key}:second_completed`)) {
      window.localStorage.setItem(`${key}:second_completed`, "1");
      captureLearningEvent("second_activity_completed", dimensions);
    }
  } catch {
    // Storage may be disabled; the base event was still captured.
  }
}
