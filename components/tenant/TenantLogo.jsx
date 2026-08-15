"use client"

import { useState } from "react"
import { useTenant } from "@/components/providers/TenantProvider"

export default function TenantLogo({ className = "", decorative = false }) {
  const { branding } = useTenant()
  const [failedUrl, setFailedUrl] = useState(null)
  const src = failedUrl === branding.logoUrl ? "/logo.png" : branding.logoUrl

  return (
    <img
      src={src}
      alt={decorative ? "" : `${branding.brandName} logo`}
      className={className}
      onError={() => setFailedUrl(branding.logoUrl)}
    />
  )
}
