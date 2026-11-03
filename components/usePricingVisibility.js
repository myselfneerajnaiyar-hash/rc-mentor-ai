"use client"

import { useTenant } from "@/components/providers/TenantProvider"
import { canShowPricingForProfile } from "@/lib/tenant/pricingVisibility.mjs"

export default function usePricingVisibility() {
  const { profile, loading } = useTenant()
  return canShowPricingForProfile(profile, { loading })
}
