"use client"

import { useState } from "react"
import { useTenant } from "@/components/providers/TenantProvider"

export default function TenantLogo({ className = "", decorative = false }) {
  const { branding } = useTenant()
  const [failedUrl, setFailedUrl] = useState(null)
  if (branding.isInstitute && (!branding.logoUrl || failedUrl === branding.logoUrl)) {
    const initials = branding.brandName.split(/\s+/).filter(Boolean).map(word => word[0]).join("").slice(0, 2).toUpperCase()
    return <span role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `${branding.brandName} mark`} aria-hidden={decorative ? "true" : undefined} className={className} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: branding.primaryColor, color: "#fff", fontWeight: 800 }}>{initials}</span>
  }
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
