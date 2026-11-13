"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { supabase } from "@/lib/supabase";
import { identifyPostHogUser } from "@/lib/analytics/conversionEvents.mjs";

export default function PostHogProvider() {
  useEffect(() => {
    posthog.init(
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
      {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
      }
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        posthog.reset();
      } else if (session?.user?.id) {
        identifyPostHogUser({ userId: session.user.id, posthog });
      }
    });

    console.log("POSTHOG LOADED");
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
