const fs=require('fs');function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('components/home-v2/BirbalFloatingButton.jsx',s=>s.replace('import Image from', 'import { usePathname, useSearchParams } from "next/navigation";\nimport { acquireBodyScrollLock } from "@/lib/ui/bodyScrollLock.mjs";\nimport Image from').replace('  const [isMobile,', '  const pathname = usePathname();\n  const searchParams = useSearchParams();\n  useEffect(() => { setChatOpen(false); }, [pathname, searchParams, setChatOpen]);\n  const [isMobile,').replace(/  useEffect\(\(\) => \{\s*document.body.style.overflow = chatOpen[\s\S]*?\}, \[chatOpen\]\);/,`  useEffect(() => {
    if (chatOpen && !isMobile && !assessmentActive) return acquireBodyScrollLock();
  }, [chatOpen, isMobile, assessmentActive]);`).replace('const check = () => setIsMobile(window.innerWidth < 900);',`const check = () => {
    const mobile = window.innerWidth < 900;
    setIsMobile(mobile);
    if (mobile) setChatOpen(false);
  };`).replace('}, []);\n\n if (assessmentActive)', '}, [setChatOpen]);\n\n if (assessmentActive)'));
edit('components/inbox/InboxApp.jsx',s=>s.replace('import { useRouter }','import { acquireBodyScrollLock } from "@/lib/ui/bodyScrollLock.mjs"\nimport { useRouter }').replace('const prior = document.activeElement, overflow = document.body.style.overflow\n    document.body.style.overflow = "hidden"','const prior = document.activeElement\n    const releaseScroll = acquireBodyScrollLock()').replace('document.body.style.overflow = overflow;', 'releaseScroll();'));
edit('app/preview/page.js',s=>s.replace('import { useRouter }','import { acquireBodyScrollLock } from "@/lib/ui/bodyScrollLock.mjs";\nimport { useRouter }').replace('const previousOverflow = document.body.style.overflow;\n  document.body.style.overflow = "hidden";', 'const releaseScroll = acquireBodyScrollLock();').replace('document.body.style.overflow = previousOverflow;', 'releaseScroll();'));
edit('components/ChatMentor.jsx',s=>s.replace('  const bottomRef = useRef(null)','  const bottomRef = useRef(null)\n  const messagesRef = useRef(null)\n  const followMessages = useRef(true)').replace(/ useEffect\(\(\) => \{\s*bottomRef.current\?\.scrollIntoView\(\{\s*behavior: "smooth"\s*\}\)\s*\}, \[messages\]\)/,` useEffect(() => {
    const pane = messagesRef.current;
    if (pane && followMessages.current) pane.scrollTop = pane.scrollHeight;
  }, [messages])`).replace('  bottomRef.current?.scrollIntoView({ behavior: "smooth" })','').replace(' for (let i = 0; i < text.length; i++) {',' for (let i = 0; i < text.length; i++) {\n  if (!mountedRef.current) return;').replace('className="\nflex\nflex-col\nw-full\nh-full', 'style={contextual ? { height: "min(650px, 75dvh)", minHeight: "300px" } : undefined}\nclassName="\nflex\nflex-col\nw-full\nh-full').replace('    <div\nclassName="\nflex-1\nmin-h-0\nh-0',`    <div
ref={messagesRef}
aria-label="Birbal messages"
onScroll={event => { const pane = event.currentTarget; followMessages.current = pane.scrollHeight - pane.clientHeight - pane.scrollTop < 32; }}
onWheel={event => { if (event.deltaY < 0) followMessages.current = false; }}
onTouchStart={() => { followMessages.current = false; }}
className="
flex-1
min-h-0
h-0`));
