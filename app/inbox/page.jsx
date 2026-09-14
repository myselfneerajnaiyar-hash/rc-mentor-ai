"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import InboxApp from "@/components/inbox/InboxApp"
import { useTenant } from "@/components/providers/TenantProvider"

export default function InboxPage() {
  const router = useRouter()
  const { user, access } = useTenant()
  useEffect(() => {
    if (access === "guest" || !user) router.replace("/login?next=/inbox")
  }, [access, router, user])
  if (!user || access === "guest") return null
  return <InboxApp key={user.id} />
}

