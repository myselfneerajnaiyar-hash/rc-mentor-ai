"use client";

import { Mail } from "lucide-react";

export default function InboxHeaderLink({ count = 0 }) {
  return (
    <a
      href="/inbox"
      title="Inbox"
      aria-label={count > 0 ? `Inbox — ${count} unread ${count === 1 ? "message" : "messages"}` : "Inbox"}
      className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/5 px-3.5 text-sm font-medium text-violet-200 transition-colors hover:border-violet-400 hover:bg-violet-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
    >
      <Mail aria-hidden="true" size={16} strokeWidth={1.8} />
      <span>Inbox</span>
      {count > 0 && (
        <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-4 rounded-full bg-indigo-500 px-1 py-px text-center text-[9px] font-bold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </a>
  );
}
