"use client"

import usePricingVisibility from "@/components/usePricingVisibility"

export default function PricingVisibility({ children }) {
  return usePricingVisibility() ? children : null
}
