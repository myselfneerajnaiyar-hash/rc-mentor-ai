"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Send, Brain, Mic, } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { SpeechRecognition } from "@capacitor-community/speech-recognition"


export default function ChatMentor() {

  const [messages, setMessages] = useState([
   {
role: "assistant",
content: "👋 Hi! I'm Birbal — your RC mentor. I help you read between the lines, understand author logic, and improve your CAT Reading Comprehension skills. Ask me anything about passages, inference questions, or mistakes."
}
  ])

  const [input, setInput] = useState("")
  const lastMessageRef = useRef(null)
  const bottomRef = useRef(null)
  const [thinking, setThinking] = useState(false)
  const [user, setUser] = useState(null)
  const inputRef = useRef(null)
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
  inputRef.current?.focus()
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

  const res = await fetch("/api/chat-mentor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
   body: JSON.stringify({
  messages: updated,
  userId: user?.id
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

  const res = await fetch("/api/chat-mentor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: updated,
      userId: user?.id
    })
  })

  const data = await res.json()

  setThinking(false)

  await typeMessage(data.reply, updated)

 
}

async function typeMessage(text, updatedMessages) {
  let currentText = ""

  setMessages([
    ...updatedMessages,
    {
      role: "assistant",
      content: "",
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

    <div className="max-w-2xl mx-auto flex flex-col h-[80vh] bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl">

      {/* Header */}

      <div className="flex items-center gap-3 p-4 border-b border-slate-800">

       <div className="w-10 h-10 overflow-hidden rounded-full">
  <img
    src="/birbal.png"
    alt="Birbal"
    className="w-full h-full object-cover"
  />
</div>

        <div>
          <div className="text-white font-semibold">
            Birbal - RC Mentor
          </div>

          <div className="text-xs text-slate-400">
            Ask Birbal anything about reading comprehension
          </div>
        </div>

      </div>


      {/* Quick prompts */}

      <div className="flex gap-2 p-3 flex-wrap border-b border-slate-800">

        {[
          "How to improve inference questions?",
          "How should I read RC faster?",
          "What is tone detection?",
          "How to find main idea quickly?"
        ].map((p, i) => (
          <button
            key={i}
            onClick={() => quickPrompt(p)}
            className="text-xs bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 px-3 py-1.5 rounded-full"
          >
            {p}
          </button>
        ))}

      </div>


      {/* Chat area */}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

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
    src="/birbal.png"
    alt="Birbal"
    className="w-7 h-7 rounded-full mt-1"
  />
)}

<div className="max-w-[calc(100%-60px)]">

  <div
  className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed flex items-start gap-2 shadow-md ${
    m.role === "user"
      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
      : "bg-slate-800/80 backdrop-blur border border-slate-700 text-slate-200"
  }`}
>

  <div className="whitespace-pre-line flex-1">
    {m.content}
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
  <div className="flex items-start gap-2">

    <img
      src="/birbal.png"
      alt="Birbal"
     className="w-8 h-8 rounded-full mt-1 border border-slate-700"
    />

    <div className="bg-slate-800 text-slate-300 px-4 py-3 rounded-xl text-sm animate-pulse">
      Birbal is thinking...
    </div>

  </div>
)}

<div ref={bottomRef}></div>
        

      </div>


      {/* Input */}

  <div className="p-3 border-t border-slate-800 flex gap-2 sticky bottom-0 bg-slate-900/95 backdrop-blur">

        <input
        ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
       onKeyDown={(e) => {
  if (e.key === "Enter" && input.trim()) {
    e.preventDefault()
    sendMessage()
  }
}}
         placeholder="Ask Birbal about RC..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-xl outline-none"
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