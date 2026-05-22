"use client"

import { Upload, Brain, Sparkles, Camera, ImageIcon } from "lucide-react"
import { useState, useRef } from "react"
import ChatMentor from "@/components/ChatMentor"


export default function BirbalEditorialDecoder() {
   const [files, setFiles] = useState([])
const [previews, setPreviews] = useState([])


const [phase, setPhase] = useState("idle")
const [loadingMessage, setLoadingMessage] = useState(
  "Birbal is analyzing editorial psychology..."
)
const [analysis, setAnalysis] = useState(null)

const [openParagraphs, setOpenParagraphs] = useState({})
const [extractedPassage, setExtractedPassage] = useState([])
const loadingRef = useRef(null)
const flowRef = useRef(null)
const cognitiveRef = useRef(null)
const paragraphRef = useRef(null)
const vocabRef = useRef(null)
const chatRef = useRef(null)
const [visibleSections, setVisibleSections] = useState({
  flow: false,
  cognitive: false,
  paragraphs: false,
  vocab: false,
})

async function compressImage(file) {

  return new Promise((resolve) => {

    // If PDF, don't compress
    if (file.type === "application/pdf") {
      resolve(file)
      return
    }

    const reader = new FileReader()

    reader.readAsDataURL(file)

    reader.onload = (event) => {

      const img = new window.Image()

      img.src = event.target.result

      img.onload = () => {

        const canvas =
          document.createElement("canvas")

        const MAX_WIDTH = 1400

        let width = img.width
        let height = img.height

        // scale down
        if (width > MAX_WIDTH) {

          height =
            (height * MAX_WIDTH) / width

          width = MAX_WIDTH
        }

        canvas.width = width
        canvas.height = height

        const ctx =
          canvas.getContext("2d")

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        )

        canvas.toBlob(
          (blob) => {

            const compressedFile =
              new File(
                [blob],
                file.name,
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }
              )

            resolve(compressedFile)

          },
          "image/jpeg",
          0.7
        )
      }
    }
  })
}


async function handleFiles(e) {

  const incomingFiles =
    Array.from(e.target.files)

  if (!incomingFiles.length) return

  // total limit
  const remainingSlots =
    2 - files.length

  if (remainingSlots <= 0) {

    alert(
      "Maximum 2 screenshots allowed."
    )

    return
  }

  const selectedFiles =
    incomingFiles.slice(0, remainingSlots)

  try {

    const compressedFiles =
      await Promise.all(

        selectedFiles.map(file =>
          compressImage(file)
        )
      )

    setFiles(prev => [
      ...prev,
      ...compressedFiles
    ])

    const imageUrls =
      compressedFiles.map(file =>
        URL.createObjectURL(file)
      )

    setPreviews(prev => [
      ...prev,
      ...imageUrls
    ])

  } catch (err) {

    console.error(
      "IMAGE PROCESSING ERROR:",
      err
    )

    alert(
      "Failed to process images."
    )
  }

  // IMPORTANT RESET
  e.target.value = ""
}
function removeImage(index) {

  setFiles(prev => prev.filter((_, i) => i !== index))

  setPreviews(prev => prev.filter((_, i) => i !== index))
}

function toggleParagraph(index) {

  setOpenParagraphs(prev => ({
    ...prev,
    [index]: !prev[index]
  }))
}




async function extractEditorial() {

  if (!files.length) return

  
setAnalysis(null)
setVisibleSections({
  flow: false,
  cognitive: false,
  paragraphs: false,
  vocab: false,
})
setExtractedPassage([])

  try {

  setPhase("analyzing")
  const messages = [
  "Birbal is decoding editorial psychology...",
  "Birbal is identifying author intent...",
  "Birbal is mapping passage flow...",
  "Birbal is detecting hidden assumptions...",
  "Birbal is decoding CAT traps...",
  "Birbal is building inference engine...",
  "Birbal is constructing cognitive map...",
  "Birbal is extracting vocabulary intelligence...",
]

let messageIndex = 0

const messageInterval = setInterval(() => {

  messageIndex =
    (messageIndex + 1) % messages.length

  setLoadingMessage(messages[messageIndex])

}, 1800)
  setTimeout(() => {

  loadingRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })

}, 100)

const formData = new FormData()

files.forEach((file) => {
  formData.append("files", file)
})

const response = await fetch(
  "/api/birbal-analysis",
  {
    method: "POST",
    body: formData,
  }
)

if (!response.ok) {

  const errorText = await response.text()

  console.error("API ERROR:", errorText)

  alert(
    "Birbal servers are overloaded. Please retry with 1-2 screenshots."
  )

  setPhase("idle")

  return
}

const data = await response.json()
clearInterval(messageInterval)
setPhase("streaming")

setAnalysis(data)
setTimeout(() => {

  setVisibleSections(prev => ({
    ...prev,
    flow: true,
  }))

  setTimeout(() => {
    flowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, 100)

}, 1200)

setTimeout(() => {

  setVisibleSections(prev => ({
    ...prev,
    cognitive: true,
  }))

  setTimeout(() => {
    cognitiveRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, 100)

}, 2800)

setTimeout(() => {

  setVisibleSections(prev => ({
    ...prev,
    paragraphs: true,
  }))

  setTimeout(() => {
    paragraphRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, 500)

}, 4800)

setTimeout(() => {

  setVisibleSections(prev => ({
    ...prev,
    vocab: true,
  }))

  setTimeout(() => {
    vocabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, 700)

}, 7600)

setTimeout(() => {

  setPhase("complete")

  setTimeout(() => {

    vocabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })

  }, 400)

}, 8200)
setExtractedPassage(
  data.cleanedPassage || []
)



} catch (err) {

  console.error(
    "BIRBAL FAILURE:",
    err
  )

  alert(
    "Analysis failed. Please retry with clearer or fewer screenshots."
  )

  setPhase("complete")
}
}

const fullText = extractedPassage
  .map(p => p.text)
  .join(" ")

const totalWords =
  fullText.trim().split(/\s+/).length

const readingTime =
  Math.ceil(totalWords / 180)

const avgWordLength =
  fullText.length / totalWords

let readingDifficulty = "Easy"

if (avgWordLength > 5.8)
  readingDifficulty = "Medium"

if (avgWordLength > 6.3)
  readingDifficulty = "Hard"

if (avgWordLength > 7)
  readingDifficulty = "CAT Killer"

const inferenceDensity = analysis
  ? Math.min(
      100,
      analysis.paragraphs.length * 18
    )
  : "--"

let trapProbability = "--"

if (typeof inferenceDensity === "number") {

  if (inferenceDensity <= 40)
    trapProbability = "Low"

  if (inferenceDensity > 40)
    trapProbability = "Medium"

  if (inferenceDensity > 65)
    trapProbability = "High"

  if (inferenceDensity > 85)
    trapProbability = "Deadly"
}
function highlightDirectionalWords(text) {

  if (!text) return text

  const directionalWords = [
    "however",
    "but",
    "although",
    "though",
    "yet",
    "despite",
    "nevertheless",
    "nonetheless",
    "instead",
    "rather",
    "therefore",
    "thus",
    "moreover",
    "furthermore",
    "consequently",
    "meanwhile",
    "whereas",
    "while",
    "in contrast",
    "on the other hand",
    "surprisingly",
    "ironically",
    "ultimately",
    "indeed",
    "because",
    "since",
  ]

  let highlightedText = text

  directionalWords.forEach(word => {

    const escapedWord = word.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )

    const regex = new RegExp(
      `\\b(${escapedWord})\\b`,
      "gi"
    )

   highlightedText = highlightedText.replace(
  regex,
  `<span class="bg-yellow-400/20 text-yellow-300 font-bold px-1 py-[2px] rounded-md border border-yellow-400/30 inline">$1</span>`
)
  })

  return highlightedText
}
  return (

    <div className="min-h-screen bg-slate-950 text-white px-4 md:px-6 py-6">

      {/* HERO */}
      <div className="max-w-4xl mx-auto space-y-4 text-center md:text-left">

        <div className="inline-flex items-center gap-2 mx-auto md:mx-0 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-sm">
          <Sparkles size={16} />
          Birbal Intelligence Lab
        </div>

        <div className="space-y-4">

         <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Birbal Editorial Decoder™
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mx-auto md:mx-0">
  Upload any editorial screenshot and let Birbal decode
  author intent, paragraph flow, vocabulary,
  inference logic and CAT traps.
</p>

        </div>

        {/* FEATURE TAGS */}

        <div className="flex flex-wrap gap-3 justify-center md:justify-start">

          {[
  "Author Intent",
  "Inference Engine",
  "CAT Trap Decoder",
].map((item) => (

            <div
              key={item}
              className="px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-sm text-slate-300"
            >
              {item}
            </div>

          ))}

        </div>

      </div>

      {/* UPLOAD ZONE */}

      <div className="max-w-4xl mx-auto mt-16">

        <div className="border-2 border-dashed border-indigo-500/30 rounded-3xl p-10 text-center bg-slate-900/40">

          <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
            <Upload size={36} className="text-indigo-400" />
          </div>

          <h2 className="text-2xl font-semibold">
            Upload Editorial Screenshot
          </h2>

          <p className="text-slate-400 mt-3">
            Drag & drop image, PDF or screenshot
          </p>

       <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">

  {/* CAMERA BUTTON */}

  <label
    htmlFor="camera-upload"
    className="cursor-pointer px-8 py-4 bg-indigo-600 hover:bg-indigo-500 transition rounded-2xl font-semibold text-lg flex items-center justify-center gap-3"
  >
    <Camera size={24} />
    Scan Editorial
  </label>

  {/* GALLERY BUTTON */}

  <label
    htmlFor="gallery-upload"
    className="cursor-pointer px-8 py-4 bg-slate-900 border border-slate-700 hover:border-slate-500 transition rounded-2xl font-semibold text-lg flex items-center justify-center gap-3"
  >
    <ImageIcon size={24} />
    Upload From Gallery
  </label>

  

</div>

<p className="text-slate-500 text-sm mt-4">
  Works best with clear editorial screenshots.
</p>
{/* CAMERA INPUT */}

<input
  id="camera-upload"
  type="file"
  accept="image/*"
  capture="environment"
  multiple
  className="hidden"
  onChange={handleFiles}
/>

{/* GALLERY INPUT */}

<input
  id="gallery-upload"
  type="file"
  accept="image/*,.pdf"
  multiple
  className="hidden"
  onChange={handleFiles}
/>



        </div>

      </div>

     {previews.length > 0 && (

  <div className="max-w-5xl mx-auto mt-10">

    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">

        <div className="w-full md:w-auto">
          

  <button
  onClick={extractEditorial}
  disabled={phase !== "idle" && phase !== "complete"}
  className={`w-full md:w-auto px-8 py-5 rounded-2xl text-xl font-bold shadow-2xl transition
${
  phase !== "idle" && phase !== "complete"
    ? "bg-slate-700 cursor-not-allowed"
    : "bg-indigo-600 hover:bg-indigo-500 opacity-90"
}`}
>

 {
 phase === "ocr"
? "Running OCR..."
: phase === "analyzing"
? "Birbal Is Thinking..."
: phase === "streaming"
? "Birbal Is Building Intelligence Maps..."
: `Analyze ${previews.length} Screenshot${previews.length > 1 ? "s" : ""} with Birbal →`
}

</button>

</div>

        <div className="text-lg font-semibold">
          Uploaded Editorial Screenshots
        </div>

        <div className="text-sm text-slate-400">
          {previews.length} files selected
        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {previews.map((src, i) => (
    <div
      key={i}
      className="relative group"
    >
      <img
        src={src}
        className="w-28 h-28 object-cover rounded-xl border border-slate-700"
      />

      <button
        onClick={() => removeImage(i)}
        className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 transition px-2 py-1 rounded-lg text-xs"
      >
        Remove
      </button>
    </div>
  ))}
</div>

    </div>

  </div>

)}

{(phase === "analyzing") && (

 <div
  ref={loadingRef}
  className="max-w-5xl mx-auto mt-10"
>

    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-10 text-center">

     <div className="flex flex-col items-center">

  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin mb-8"></div>

  <div className="text-2xl font-bold text-indigo-300 text-center leading-relaxed">
    {loadingMessage}
  </div>

  <div className="mt-8 flex flex-wrap justify-center gap-3">

    {[
      "Author Intent",
      "Tone & Bias",
      "Hidden Assumptions",
      "CAT Trap Construction",
      "Vocabulary Intelligence",
      "Inference Mapping",
      "Cognitive Analysis",
    ].map((item) => (

      <div
        key={item}
        className="px-4 py-2 rounded-full bg-slate-950 border border-slate-800 text-sm text-slate-300"
      >
        {item}
      </div>

    ))}

  </div>

</div>
    </div>

  </div>

)}


{extractedPassage.length > 0 && (

<div className="max-w-5xl mx-auto mt-10">

  <div className="bg-slate-900 rounded-3xl p-8">

    <h2 className="text-3xl font-bold mb-6">
      Extracted Editorial
    </h2>

     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">

    <div className="text-xs text-slate-400 mb-2">
      Reading Difficulty
    </div>

    <div className="text-2xl font-bold text-indigo-300">
      {readingDifficulty}
    </div>

  </div>

  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">

    <div className="text-xs text-slate-400 mb-2">
      Ideal Reading Time
    </div>

    <div className="text-2xl font-bold text-green-300">
      {readingTime} min
    </div>

  </div>

  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">

    <div className="text-xs text-slate-400 mb-2">
      Inference Density
    </div>

    <div className="text-2xl font-bold text-yellow-300">
      {inferenceDensity}%
    </div>

  </div>

  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">

    <div className="text-xs text-slate-400 mb-2">
      CAT Trap Probability
    </div>

    <div className="text-2xl font-bold text-red-300">
      {trapProbability}
    </div>

  </div>

</div>

    <div className="space-y-6">

      {extractedPassage.map((para, i) => (

        <div
          key={i}
          className="bg-slate-950 rounded-2xl p-6"
        >

          <div className="text-indigo-400 mb-3">
            Paragraph {i + 1}
          </div>

         <div
  className="text-slate-200 whitespace-pre-wrap leading-relaxed"
  dangerouslySetInnerHTML={{
    __html: highlightDirectionalWords(para.text),
  }}
/>

        </div>

      ))}

      <div className="mt-8">

 {phase === "analyzing" ? (

    <div className="w-full py-5 rounded-2xl bg-slate-800 text-center text-xl font-bold text-indigo-300 animate-pulse">

      Birbal is analyzing editorial psychology...

    </div>

  ) : analysis ? (

    <div className="w-full py-5 rounded-2xl bg-green-600 text-center text-xl font-bold">

      Birbal Analysis Ready ↓

    </div>

  ) : null}

</div>
     

    </div>

    
  </div>

</div>

)}


{(phase === "streaming" || phase === "complete") && analysis && (

  <div className="max-w-6xl mx-auto mt-10 space-y-6">
    

    {/* MAIN RESULT */}
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
       
            {!visibleSections.flow && (
  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 mb-8 animate-pulse">
    <div className="text-indigo-300 text-2xl font-bold">
      Birbal is mapping passage structure...
    </div>
  </div>
)}

{visibleSections.flow && (

<div 
  ref={flowRef}
className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

  <h2 className="text-3xl font-bold mb-8">
    Passage Flow Map
  </h2>

  <div className="space-y-5">

    {analysis?.passageFlow?.map((step, i) => (

     <div
  key={i}
  className="bg-slate-950 border border-slate-800 rounded-2xl p-5"
>

  <div className="flex items-center gap-3 mb-4">

    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-bold text-sm">
      {i + 1}
    </div>

    <div className="text-indigo-300 font-semibold">
      Flow Step {i + 1}
    </div>

  </div>

  <div className="text-slate-200 leading-8">
    {step}
  </div>

</div>

    ))}

  </div>


</div>
)}

{visibleSections.flow && !visibleSections.cognitive && (
  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 mb-8 animate-pulse">
    <div className="text-indigo-300 text-2xl font-bold">
      Birbal is building cognitive map...
    </div>
  </div>
)}


{visibleSections.cognitive && (

<div 
ref={cognitiveRef}
className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

  <h2 className="text-3xl font-bold mb-8">
    Birbal Cognitive Map
  </h2>

  <div className="grid md:grid-cols-2 gap-6">

    <ResultCard
      title="Central Debate"
      value={analysis?.centralDebate}
    />

    <ResultCard
      title="Core Idea"
      value={analysis?.authorPositioning?.coreIdea}
    />

    <ResultCard
      title="What Author Supports"
      value={analysis?.authorPositioning?.whatAuthorSupports}
    />

    <ResultCard
      title="What Author Questions"
      value={analysis?.authorPositioning?.whatAuthorQuestions}
    />

    <ResultCard
      title="Hidden Assumption"
      value={analysis?.authorPositioning?.hiddenAssumption}
    />

    <ResultCard
      title="Reading Danger"
      value={analysis?.authorPositioning?.readingDanger}
    />

  </div>

</div>

)}




      <div className="flex items-center justify-between mb-8">

        <div>
          <h2 className="text-3xl font-bold">
            Birbal Editorial Analysis
          </h2>

          <p className="text-slate-400 mt-2">
            AI-powered inference breakdown
          </p>
        </div>

        <div className="px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
          Analysis Complete
        </div>

      </div>



      {/* GRID */}
     
     {visibleSections.cognitive && !visibleSections.paragraphs && (
  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 mb-8 animate-pulse">
    <div className="text-indigo-300 text-2xl font-bold">
      Birbal is decoding paragraph psychology...
    </div>
  </div>
)}
     
      {visibleSections.paragraphs && (

<div 
ref={paragraphRef}
className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

  {analysis?.paragraphs?.map((para, index) => (

    <div
      key={index}
      className="bg-slate-950 border border-slate-800 rounded-3xl p-8"
    >

     <div className="flex items-center justify-between mb-6">

  <div className="text-2xl font-bold">
    Paragraph {index + 1}
  </div>

  <button
    onClick={() => toggleParagraph(index)}
    className="px-4 py-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 transition text-indigo-300 border border-indigo-500/20 text-sm"
  >

    {openParagraphs[index]
      ? "Collapse"
      : "Expand Analysis"}

  </button>

</div>



{openParagraphs[index] && (
    <>

      {/* SIMPLE EXPLANATION */}

<div className="mb-8">

  <div className="text-green-400 text-sm mb-3">
    Simple Meaning
  </div>

  <div className="text-white leading-relaxed text-lg">
    {para.simpleExplanation}
  </div>

</div>

{/* AUTHOR INTENT */}

<div className="mb-8">

  <div className="text-yellow-400 text-sm mb-3">
    What The Author Is Trying To Do
  </div>

  <div className="text-white leading-relaxed text-lg">
    {para.authorMove}
  </div>

</div>

{/* IMPORTANT INFERENCE */}

<div className="mb-8">

  <div className="text-pink-400 text-sm mb-3">
    Important Inference
  </div>

  <div className="text-white leading-relaxed text-lg">
    {para.inference}
  </div>

</div>

{/* WHAT NOT TO INFER */}

<div className="mb-8">

  <div className="text-red-400 text-sm mb-3">
    What Students Should NOT Infer
  </div>

  <div className="text-white leading-relaxed text-lg">
    {para.whatNotToInfer}
  </div>

</div>

{/* PARAGRAPH PURPOSE */}

<div className="mb-8">

  <div className="text-blue-400 text-sm mb-3">
    Why This Paragraph Exists
  </div>

  <div className="text-white leading-relaxed text-lg">
    {para.paragraphPurpose}
  </div>

</div>

{/* CAT TRAP */}

<div className="mb-8">

  <div className="text-orange-400 text-sm mb-3">
    CAT Trap Students Fall Into
  </div>

  <div className="text-white leading-relaxed text-lg">
    {para.catTrap}
  </div>

</div>

{/* DIRECTIONAL WORDS */}

<div>

  <div className="text-cyan-400 text-sm mb-4">
    Directional Words & Signals
  </div>

  <div className="space-y-4">

    {para.directionalWords?.map((wordObj, i) => (

      <div
        key={i}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-4"
      >

        <div className="text-cyan-300 font-semibold text-lg">
          {wordObj.word}
        </div>

        <div className="text-slate-300 mt-2 leading-relaxed">
          {wordObj.meaning}
        </div>

      </div>

    

    ))}

  </div>

</div>




{/* TRAP OPTIONS */}

<div className="mt-10">

  <div className="text-orange-400 text-sm mb-5">
    Fake CAT Conclusions Students May Choose
  </div>

  <div className="space-y-5">

    {para.trapOptions?.map((trap, i) => (

      <div
        key={i}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
      >

        <div className="text-red-400 font-semibold mb-3">
          Wrong Conclusion
        </div>

        <div className="text-white leading-relaxed mb-5">
          {trap.fakeConclusion}
        </div>

        <div className="text-yellow-400 font-semibold mb-3">
          Why Weak Students Choose It
        </div>

        <div className="text-slate-300 leading-relaxed mb-5">
          {trap.whyStudentsFallForIt}
        </div>

        <div className="text-green-400 font-semibold mb-3">
          Why It Is Actually Wrong
        </div>

        <div className="text-slate-300 leading-relaxed">
          {trap.whyItIsWrong}
        </div>

      </div>

    ))}

  </div>

</div>
</>

)}

    </div>

  ))}

</div>
      )}
      </div>

      

    

    {/* VOCAB */}

    {visibleSections.paragraphs && !visibleSections.vocab && (
  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 mb-8 animate-pulse">
    <div className="text-indigo-300 text-2xl font-bold">
      Birbal is building vocabulary intelligence...
    </div>
  </div>
)}

    {visibleSections.vocab && (

<div 
ref={vocabRef}
className="bg-slate-900 border border-slate-800 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <h3 className="text-2xl font-bold mb-6">
        Vocabulary Intelligence
      </h3>

    <div className="grid md:grid-cols-2 gap-6">

 {analysis?.vocabulary?.map((wordObj, i) => (

  <div
    key={i}
    className="bg-slate-950 border border-slate-800 rounded-3xl p-6"
  >

    <div className="text-2xl font-bold text-indigo-300 mb-2">
      {wordObj.word}
    </div>

    <div className="text-sm text-slate-400 mb-6 italic">
      {wordObj.partOfSpeech}
    </div>

    <div className="space-y-5">

      <ResultCard
        title="Contextual Meaning"
        value={wordObj.contextualMeaning}
      />

      <ResultCard
        title="Simple Meaning"
        value={wordObj.simpleMeaning}
      />

      <ResultCard
        title="Why Author Used This Word"
        value={wordObj.whyAuthorUsedIt}
      />

      <ResultCard
        title="Root Word"
        value={wordObj.rootWord}
      />

      <ResultCard
        title="Application Sentence"
        value={wordObj.applicationSentence}
      />

      <ResultCard
        title="Synonyms"
        value={wordObj.synonyms?.join(", ")}
      />

      <ResultCard
        title="Antonyms"
        value={wordObj.antonyms?.join(", ")}
      />

    </div>

  </div>

))}
</div>

    </div>
    )}

  </div>

)}
     
     {analysis &&
 extractedPassage.length > 0 &&
 fullText &&
 fullText.trim().length > 100 && (

  <div
    ref={chatRef}
    className="max-w-5xl mx-auto mt-14"
  >

    <div className="mb-6">

      <div className="text-center mb-8">

        <h2 className="text-4xl font-extrabold text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.7)]">
          Still confused?
        </h2>

        <p className="text-white/80 text-lg mt-3">
          Ask Birbal anything about this article.
        </p>

      </div>

    </div>

    <ChatMentor
      key={fullText}
      passage={fullText}
      contextual={true}
    />

  </div>

)}
    </div>

  )
}

function FeatureCard({ title, desc }) {

  return (

    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
        <Brain className="text-indigo-400" />
      </div>

      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="text-slate-400 mt-3 leading-relaxed">
        {desc}
      </p>

    </div>
  )
}

    function ResultCard({ title, value }) {

  return (

    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

      <div className="text-indigo-400 text-sm mb-3">
        {title}
      </div>

      <div className="text-white leading-relaxed">
        {value}
      </div>



    </div>

  )
}
