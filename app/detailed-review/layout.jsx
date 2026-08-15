import CapabilityGuard from "@/components/tenant/CapabilityGuard"

export default function Layout({ children }) { return <CapabilityGuard capability="showDailyRC">{children}</CapabilityGuard> }
