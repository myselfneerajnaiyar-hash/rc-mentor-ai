"use client"
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Send, Brain, Mic, } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { SpeechRecognition } from "@capacitor-community/speech-recognition"
import { ACTIONS } from "@/lib/birbalActions";


export default function ChatMentor({

  passage = "",

  contextual = false,

  setView,
  onClose,

}) {

  const [messages, setMessages] = useState([
   {
  role: "assistant",
  
content: `👋 Welcome back!

I'm Birbal — your AI Reading Mentor.

I can help you:

📊 Analyse your performance
🎯 Recommend today's practice
📖 Explain any RC
📰 Decode newspaper editorials
🧠 Improve your Reading IQ

Ask me anything or choose a suggestion below.`
}
  ])

  const [input, setInput] = useState("")
  const lastMessageRef = useRef(null)
  const bottomRef = useRef(null)
  const [thinking, setThinking] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter();
  
  const [listening, setListening] = useState(false)
const [voiceMode, setVoiceMode] = useState(false)

const voiceSupported =
  typeof window !== "undefined" &&
  "webkitSpeechRecognition" in window

 useEffect(() => {
bottomRef.current?.scrollIntoView({
  behavior: "smooth"
})
}, [messages])

  useEffect(() => {

  async function getUser() {

    const { data } = await supabase.auth.getUser()

    setUser(data?.user || null)

  }

  getUser()

}, [])



useEffect(() => {

  if (!window.speechSynthesis) return

  const loadVoices = () => {
    window.speechSynthesis.getVoices()
  }

  loadVoices()

  window.speechSynthesis.onvoiceschanged = loadVoices

}, [])

 async function sendMessage() {

  if (!input.trim()) return

  const userMessage = {
    role: "user",
    content: input,
    time: new Date()
  }

  const updated = [...messages, userMessage]

  setMessages(updated)
  setInput("")

  setThinking(true)

  const res = await fetch("/api/birbal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
   body: JSON.stringify({
  messages: updated,
  userId: user?.id,
  passage,
  contextual
})
  })

  const data = await res.json()

  setThinking(false)

 await typeMessage(data.reply, updated)
}

async function sendVoiceMessage(text) {

  const userMessage = {
    role: "user",
    content: text,
    time: new Date()
  }

  const updated = [...messages, userMessage]

  setMessages(updated)

  setThinking(true)

  const res = await fetch("/api/birbal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: updated,
      userId: user?.id,
      passage,
      contextual
    })
  })

  const data = await res.json()

  setThinking(false)

  await typeMessage(data.reply, updated)

 
}

async function typeMessage(text, updatedMessages) {

  const actionRegex = /<Action>(.*?)<\/Action>/g;

const actions = [...text.matchAll(actionRegex)].map(
  m => m[1]
);

text = text.replace(actionRegex, "").trim();
  let currentText = ""

  setMessages([
    ...updatedMessages,
    {
   role: "assistant",
   content: "",
   actions,
   time: new Date()
}
  ])

 for (let i = 0; i < text.length; i++) {
  currentText += text[i]

  setMessages(prev => {
    const copy = [...prev]
    copy[copy.length - 1].content = currentText
    return copy
  })

  bottomRef.current?.scrollIntoView({ behavior: "smooth" })

  await new Promise(resolve => setTimeout(resolve, 10))
}
}

  function quickPrompt(text) {
    setInput(text)
  }

  function formatTime(date) {
  if (!date) return ""
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })
}

async function startVoiceConversation() {

  // If running inside Capacitor (APK)
  if (window.Capacitor) {

    const available = await SpeechRecognition.available()

    if (!available.available) {
      alert("Speech recognition not available")
      return
    }

    await SpeechRecognition.requestPermissions()

    setListening(true)

    const result = await SpeechRecognition.start({
      language: "en-US",
      maxResults: 1
    })

    setListening(false)

    if (result.matches && result.matches.length > 0) {

      const transcript = result.matches[0]

      setInput(transcript)

      await sendVoiceMessage(transcript)

    }

    return
  }

  // Browser fallback (your existing code)

  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice input not supported")
    return
  }

  const recognition = new window.webkitSpeechRecognition()

  recognition.lang = "en-US"
  recognition.continuous = false
  recognition.interimResults = false

  recognition.onstart = () => setListening(true)

  recognition.onresult = async (event) => {

    const transcript = event.results[0][0].transcript

    setInput(transcript)

    setListening(false)

    await sendVoiceMessage(transcript)

  }

  recognition.onend = () => setListening(false)

  recognition.start()
}



  return (

    <div
className="
flex
flex-col
w-full
h-full
overflow-hidden
bg-[#101623]
"
>

      {/* Header */}

      <div className="
flex

items-center

gap-3

px-5

py-4

bg-gradient-to-r

from-indigo-600

via-indigo-500

to-blue-600

text-white
">

       <div className="w-10 h-10 overflow-hidden rounded-full">
  <img
    src="/Birbal avatar.jpeg"
    alt="Birbal"
    className="w-full h-full object-cover"
  />
</div>

       <div className="flex-1">
  <h2 className="text-lg font-bold tracking-wide">
    Birbal AI
  </h2>

  <p className="text-xs text-indigo-100">
    Your Personal Reading Mentor
  </p>

  <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-1 text-[10px]">
    <span className="h-2 w-2 rounded-full bg-green-400"></span>
    Online
  </div>
</div>

{onClose && (
  <button
    onClick={onClose}
    className="h-11 w-11 rounded-full bg-black/30 flex items-center justify-center shrink-0"
  >
    ✕
  </button>
)}

</div>

      {/* Quick prompts */}

      <div className="flex gap-2 p-3 overflow-x-auto
whitespace-nowrap
no-scrollbar border-b border-slate-800">

        {[
          "How to improve inference questions?",
          "How should I read RC faster?",
          "What is tone detection?",
          "How to find main idea quickly?"
        ].map((p, i) => (
          <button
            key={i}
            onClick={() => quickPrompt(p)}
            className="text-[11px] bg-gradient-to-br
from-slate-800
to-slate-900
border
border-cyan-500/20
shadow-xl hover:bg-indigo-600/30 border border-slate-700 px-3 py-1.5 rounded-full"
          >
            {p}
          </button>
        ))}

      </div>


      {/* Chat area */}

    <div
className="
flex-1
min-h-0
h-0
overflow-y-auto
overscroll-contain
touch-pan-y
p-3
space-y-4
pb-6
"
>

     {messages.map((m, i) => {
  const isLast = i === messages.length - 1

  return (
<div
  key={i}
  ref={isLast ? lastMessageRef : null}
  className={`flex items-start gap-2 ${
    m.role === "user" ? "justify-end" : "justify-start"
  }`}
>

{m.role === "assistant" && (
  <img
    src="/Birbal avatar.jpeg"
    alt="Birbal"
    className="w-7 h-7 rounded-full mt-1"
  />
)}

<div className="max-w-[85%]">

  <div
  className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed flex items-start gap-2 shadow-md ${
    m.role === "user"
      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
      : "bg-slate-800/80 backdrop-blur border border-slate-700 text-slate-200"
  }`}
>

 <div className="flex-1">

  <div className="whitespace-pre-line">
    {m.content}
  </div>

  {m.actions?.length > 0 && (
    <div className="mt-4 flex flex-col gap-2">

     {m.actions?.map(action => {

   const item = ACTIONS[action];

   if (!item) return null;

   return (

      <button
         key={action}
        onClick={() => {

   // Route based actions
   if (item.route) {
      router.push(item.route);
      return;
   }

   // Internal app views
   if (setView && item.view) {
      setView(item.view);
      return;
   }

}}
        className="
mt-3
w-full
rounded-2xl
border
border-cyan-500/20
bg-gradient-to-r
from-indigo-600
to-cyan-600
px-4
py-3
text-left
font-semibold
shadow-lg
transition-all
hover:scale-[1.02]
hover:shadow-cyan-500/20
"
      >
         {item.title}
      </button>

   );

})}
    </div>
  )}

</div>
  

</div>

  <div
    className={`text-xs mt-1 text-slate-500 ${
      m.role === "user" ? "text-right" : "text-left"
    }`}
  >
    {formatTime(m.time)}
  </div>

</div>

</div>
  )
})}

    {thinking && (
  <div className="flex items-start gap-3">

    <img
      src="/Birbal avatar.jpeg"
      alt="Birbal"
      className="w-8 h-8 rounded-full border border-slate-700"
    />

    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3">

      <div className="flex gap-1 mb-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></div>
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-150"></div>
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-300"></div>
      </div>

      <div className="font-medium">
        🧠 Birbal is analysing...
      </div>

      <div className="text-xs text-slate-400">
        Looking at your reading profile
      </div>

    </div>

  </div>
)}
<div ref={bottomRef}></div>
        

      </div>


      {/* Input */}

  <div className="p-3 border-t border-slate-800 flex gap-2 bg-[#0f172a] backdrop-blur">

        <input
        
          value={input}
          onChange={(e) => setInput(e.target.value)}
       onKeyDown={(e) => {
  if (e.key === "Enter" && input.trim()) {
    e.preventDefault()
    sendMessage()
  }
}}
         placeholder="Ask Birbal about RC..."
          className="flex-1 bg-[#1b2434] border border-slate-700 text-white px-4 py-2 rounded-full outline-none"
        />

        <button
  onClick={startVoiceConversation}
  disabled={!voiceSupported}
  className={`px-3 rounded-xl flex items-center justify-center ${
    listening ? "bg-red-500" : "bg-slate-700"
  } ${!voiceSupported ? "opacity-40 cursor-not-allowed" : ""}`}
>
  <Mic size={18} />
</button>

<button
  onClick={sendMessage}
  className="bg-indigo-600 hover:bg-indigo-500 px-4 rounded-xl flex items-center justify-center"
>
  <Send size={18} />
</button>

      </div>

    </div>
  )
}