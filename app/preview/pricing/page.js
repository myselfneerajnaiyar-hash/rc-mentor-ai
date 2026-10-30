import { redirect } from "next/navigation"

export default function LegacyPreviewPricingRedirect() {
  redirect("/pricing?source=preview_pricing_redirect")
}
