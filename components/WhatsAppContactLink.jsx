import { MessageCircle } from "lucide-react"

export default function WhatsAppContactLink({ compactOnMobile = false }) {
  return (
    <a
      href="https://wa.me/917975369704"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20 sm:px-3"
    >
      <MessageCircle size={18} aria-hidden="true" />
      {compactOnMobile ? (
        <span className="hidden md:inline">Chat with us on WhatsApp</span>
      ) : (
        <>
          <span className="text-xs sm:hidden">Chat with us</span>
          <span className="hidden text-sm sm:inline">Chat with us on WhatsApp</span>
        </>
      )}
    </a>
  )
}
