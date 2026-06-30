"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TabGroup from "@/components/TabGroup";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export default function DetailedReviewPage(props) {
  console.log("REVIEW PROPS:", props);
console.log("ATTEMPT:", props.attempt);

  const testId =
  props?.attempt?.test_id;
  console.log("TEST ID:", testId);

 

    const [passages, setPassages] = useState([]);
const [selectedPassage, setSelectedPassage] =
  useState(null);
    const [reviewTab, setReviewTab] =
  useState("passage-1");

const [subTab, setSubTab] =
  useState("blueprint");
    const [questions, setQuestions] =
  useState([]);

  const [vaQuestions, setVaQuestions] =
  useState([]);

  const [openRCQuestion, setOpenRCQuestion] = useState(null);

const [openVAQuestion, setOpenVAQuestion] = useState(null);

  const [rcAttempts, setRcAttempts] = useState([]);
const [vaAttempts, setVaAttempts] = useState([]);

const [testInfo, setTestInfo] =
  useState(null);


    const [openParagraph, setOpenParagraph] =
  useState(null);
  

useEffect(() => {
  if (!testId) return;

  async function loadData() {

    const { data: passageData } =
      await supabase
        .from("sectional_passage_content")
        .select("*")
        .eq("test_id", testId)
        .order("passage_number");

    setPassages(passageData || []);

    if (passageData?.length) {
     setSelectedPassage(
  passageData[0]
);

setReviewTab(
  `passage-${passageData[0].passage_number}`
);
    }

    const { data: questionData } =
      await supabase
        .from("sectional_question_content")
        .select("*")
        .eq("test_id", testId)
        .order("question_number");

    setQuestions(questionData || []);

   const { data: vaData, error: vaError } =
await supabase
.from("sectional_va_content")
.select("*")
.eq("test_id", testId)
.order("question_number");

console.log("VA ERROR", vaError);
console.log("VA DATA", vaData);
console.log("TEST ID USED", testId);

setVaQuestions(vaData || []);
console.log("CURRENT TEST ID", testId);
console.log("VA DATA", vaData);
const attemptId = props?.attempt?.id;
console.log("props.attempt =", props.attempt);
console.log("Attempt ID =", attemptId);

if (attemptId) {

  const { data: rcAttemptData } =
    await supabase
      .from("mentor_rc_question_attempts")
      .select("*")
      .eq("attempt_id", attemptId);

  setRcAttempts(rcAttemptData || []);

  console.log("Attempt ID:", attemptId);

  const { data: vaAttemptData } =
    await supabase
      .from("mentor_va_attempts")
      .select("*")
      .eq("attempt_id", attemptId);

  setVaAttempts(vaAttemptData || []);
  console.log("Attempt ID Used:", attemptId);
console.log("VA Attempt Data:", vaAttemptData);

}

  }

  

  

  loadData();

}, [testId]);

useEffect(() => {

  if (reviewTab === "va") return;

  const passageNumber =
    Number(
      reviewTab.replace(
        "passage-",
        ""
      )
    );

  const passage =
    passages.find(
      p =>
        p.passage_number ===
        passageNumber
    );

  if (passage) {
    setSelectedPassage(
      passage
    );
  }

}, [reviewTab, passages]);


if (!selectedPassage) {
  return (
    <div className="min-h-screen bg-[#071120] text-white flex items-center justify-center">
      Loading Review...
    </div>
  );
}


const enrichment =
  selectedPassage?.passage_enrichment || {};

  const passageFlow =
  enrichment.passageFlow || [];

  const psychology =
  enrichment?.readingPsychology || {};

  console.log(enrichment.readingPsychology);


  return (
    <div className="min-h-screen bg-[#071120] text-white">
      <div className="max-w-7xl mx-auto px-8 py-10">

     



        <h1 className="text-6xl font-black">
          Detailed Review
        </h1>

        <p className="text-slate-400 mt-4">
          Passage analysis, vocabulary, trap analysis and question review.
        </p>

        <div className="mt-10">

    
<TabGroup
tabs={[

  
  ...passages
    .filter((p) => p.passage_number)
    .map((p) => ({
      label: `Passage ${p.passage_number}`,
      value: `passage-${p.passage_number}`,
    })),
  {
    label: "Verbal Ability",
    value: "va",
  },
]}
  active={reviewTab}
  onChange={setReviewTab}
/>
</div>

{reviewTab === "va" && (

  <div className="mt-10">

    {vaQuestions.map((q, index) => {

      const payload = q.payload || {};

      const review = q.diagnosis || {};
      const displayNumber = questions.length + index + 1;

      const attempt =
  vaAttempts.find(
    a => a.va_question_id === q.id
  );

  console.log("VA Question ID:", q.id);
console.log("All VA Attempts:", vaAttempts);
console.log("Matched Attempt:", attempt);

      const type =
        q.question_type?.toLowerCase() || "";

      const showInstruction =
        type.includes("summary") ||
        type.includes("placement");

      return (

<>
  <div
    className="
    h-px
    bg-gradient-to-r
    from-transparent
    via-cyan-500/20
    to-transparent
    my-12
    "
  />

 <Accordion
  type="single"
  collapsible
  className="w-full"
>
  <AccordionItem
    value={`va-${q.id}`}
    className="border-0"
  >

<Card
  key={q.id}
  className="mb-6 bg-slate-900/60 border-cyan-500/20 overflow-hidden"
>

        <AccordionTrigger className="px-6 py-5 hover:no-underline">

<div className="w-full flex justify-between items-center">

<div className="text-left">

<div className="text-cyan-300 text-5xl font-black">
Q{displayNumber}
</div>

<div className="text-slate-500 mt-1">
Detailed Review
</div>

{attempt?.selected_answer == null ? (
<div className="mt-4 text-slate-400 font-black">
* Unattempted
</div>
) : attempt?.is_correct ? (
<div className="mt-4 text-emerald-400 font-black">
✓ Correct
</div>
) : (
<div className="mt-4 text-red-400 font-black">
✗ Incorrect
</div>
)}

</div>

</div>

</AccordionTrigger>

<AccordionContent>

<CardContent className="p-6">

           
           <div
  className="
  inline-flex
  mt-4
  px-3
  py-1
  rounded-full
  bg-amber-500/10
  border
  border-amber-500/20
  text-amber-300
  text-sm
  font-bold
  "
>
  {q.question_type}
</div>

<div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-6">

  <div>
    <div className="text-slate-500 text-xs uppercase">
      Difficulty
    </div>

    <div className="text-white font-bold">
      {review.difficulty}
    </div>
  </div>

  <div>
    <div className="text-slate-500 text-xs uppercase">
      Time Taken
    </div>

    <div className="text-white font-bold">
      {attempt?.time_taken_s ?? 0}s
    </div>
  </div>

  <div>
    <div className="text-slate-500 text-xs uppercase">
      Trap Type
    </div>

    <div className="text-red-300 font-bold">
      {review.trapType}
    </div>
  </div>

  <div>
    <div className="text-slate-500 text-xs uppercase">
      Skill Tested
    </div>

    <div className="text-cyan-300 font-bold">
      {review.skillTested}
    </div>
  </div>

</div>

            {/* INSTRUCTION */}

          {showInstruction &&
  payload.questionText && (

  <div className="mt-6">

    <div
      className="
      text-cyan-300
      text-xs
      uppercase
      tracking-[0.35em]
      font-black
      mb-3
      "
    >
      Question Prompt
    </div>

    <Card
      className="
      bg-slate-900
      border-cyan-500/20
      "
    >

      <CardContent
        className="
        p-6
        leading-8
        whitespace-pre-wrap
        text-slate-300
        "
      >
        {payload.questionText}
      </CardContent>

    </Card>

  </div>

)}

            {/* PARAGRAPH FOR SENTENCE PLACEMENT */}

            {payload.paragraph && (

              <Card
                className="
                mt-6
                bg-slate-900
                border-cyan-500/20
                "
              >

                <CardContent
                  className="
                  p-6
                  whitespace-pre-wrap
                  leading-8
                  text-slate-300
                  "
                >
                  {payload.paragraph}
                </CardContent>

              </Card>

            )}

            {/* SENTENCES */}

            {payload.sentences?.length > 0 && (

              <div className="mt-6 space-y-3">

               {payload.sentences.map((s, index) => {

  const isOddQuestion =
    type.includes("odd");

  const isCorrectSentence =
    isOddQuestion &&
    String(index + 1) === String(q.correct_answer);

  const isSelectedSentence =
    isOddQuestion &&
    String(index + 1) === String(attempt?.selected_answer);

  return (

    <div
      key={index}
      className={`
        p-5
        rounded-2xl
        border
        ${
          isCorrectSentence
            ? "bg-emerald-500/20 border-emerald-500"
            : isSelectedSentence
            ? "bg-red-500/20 border-red-500"
            : "bg-slate-900 border-slate-700"
        }
        leading-8
        text-slate-200
      `}
    >
      {index + 1}. {s}
    </div>

  );

})}
              </div>

            )}

            {/* OPTIONS */}

           {payload.options?.length > 0 && (

  <div className="mt-6 space-y-3">

    {payload.options.map((option, index) => {

      console.log({
  option,
  correctAnswer: q.correct_answer,
  payloadOptions: payload.options
});

      const letter = String.fromCharCode(65 + index);

     const normalize = (value) => {

  if (value == null) return null;

  const str = String(value).trim();

  if (/^[1-4]$/.test(str))
    return ["A","B","C","D"][Number(str)-1];

  if (/^[A-D]$/i.test(str))
    return str.toUpperCase();

  if (/^Option\s*[1-4]$/i.test(str))
    return ["A","B","C","D"][
      Number(str.replace(/\D/g,""))-1
    ];

  return str;

};

const selectedLetter =
  normalize(attempt?.selected_answer);

let isCorrect = false;

if (type.includes("placement")) {

  isCorrect =
    String(option).trim() === `Option ${q.correct_answer}`;

} else {

  const correctLetter = normalize(q.correct_answer);
  isCorrect = letter === correctLetter;

}

const isSelected =
  letter === selectedLetter;

      return (

        <div
          key={index}
          className={`
            p-4
            rounded-xl
            border
            ${
              isCorrect
                ? "border-emerald-500 bg-emerald-500/20"
                : isSelected
                ? "border-red-500 bg-red-500/20"
                : "border-slate-700 bg-slate-900"
            }
          `}
        >

          <div className="font-black text-cyan-300">
            {letter}
          </div>

         <div className="mt-2 text-white">

{type.includes("placement")
  ? `Position ${String(option).replace("Option ", "")}`
  : option}

</div>
        </div>

      );

    })}

  </div>

)}
            {/* USER ANSWER */}

<div className="grid md:grid-cols-2 gap-4 mt-8">

  <Card className="bg-red-500/10 border-red-500/20">

    <CardContent className="p-6">

      <div className="text-red-300 font-bold">
        Your Answer
      </div>

      <div className="mt-3 text-slate-400">
        Time Taken: {attempt?.time_taken_s ?? 0}s
      </div>

     <div className="mt-4 text-2xl font-black text-white">

{attempt?.selected_answer == null
  ? "Not Attempted"
  : (() => {

      if (type.includes("jumble"))
        return attempt.selected_answer;

      if (type.includes("placement"))
        return `Position ${String(attempt.selected_answer).replace("Option ","")}`;

      if (type.includes("odd"))
        return `Sentence ${attempt.selected_answer}`;

      const index =
        /^[1-4]$/.test(String(attempt.selected_answer))
          ? Number(attempt.selected_answer)-1
          : ["A","B","C","D"].indexOf(
              String(attempt.selected_answer)
            );

      return payload.options?.[index];

    })()}

</div>

    </CardContent>

  </Card>

  <Card className="bg-emerald-500/10 border-emerald-500/20">

    <CardContent className="p-6">

      <div className="text-emerald-300 font-bold">
        Correct Answer
      </div>

      <div className="mt-3 text-slate-400">
        Official Solution
      </div>

     <div className="mt-4 text-2xl font-black text-emerald-300">

{type.includes("placement")
  ? (() => {
      const correctIndex = payload.options.findIndex(
        (opt) =>
          String(opt).replace("Position ", "").replace("Option ", "").trim() ===
          String(q.correct_answer)
      );

      const letter = ["A", "B", "C", "D"][correctIndex];

      return `Option ${letter} (Position ${q.correct_answer})`;
    })()
  : type.includes("jumble")
  ? q.correct_answer
  : type.includes("odd")
  ? q.correct_answer
  : payload.options?.[Number(q.correct_answer) - 1]}

</div>

    </CardContent>

  </Card>

</div>

          {/* CORRECT ANSWER */}



         

        <Card className="mt-6 bg-cyan-500/10 border-cyan-500/20">

<CardContent className="p-6">

<h3 className="text-cyan-300 font-black text-xl">
Question DNA
</h3>

</CardContent>
</Card>

<Card className="mt-6 bg-purple-500/10 border-purple-500/20">

<CardContent className="p-6">

<h3 className="text-purple-300 font-black">
What CAT Was Really Testing
</h3>

<p className="mt-4 text-slate-300">
{review.whyThisQuestionIsAsked}
</p>

<div className="mt-6">

<div className="text-cyan-300 font-bold">
Cognitive Error Tested
</div>

<p className="mt-2 text-slate-300">
{review.cognitiveErrorTested}
</p>

</div>



<Card className="mt-6 bg-emerald-500/10 border-emerald-500/20">

<CardContent className="p-6">

<h3 className="text-emerald-300 font-black">
Topper Thinking Process
</h3>

<p className="mt-4 text-slate-300">
{review.topperApproach}
</p>

<p className="mt-4 text-cyan-300">
{review.topperShortcut}
</p>

<p className="mt-4 text-slate-400">
{review.idealThinkingProcess}
</p>

</CardContent>

</Card>

<Card className="mt-6 bg-red-500/10 border-red-500/20">

<CardContent className="p-6">

<h3 className="text-red-300 font-black">
Why Students Fail
</h3>

<p className="mt-4 text-slate-300">
{review.whyStudentsFail}
</p>

<p className="mt-4 text-amber-300">
{review.averageStudentMistake}
</p>

<p className="mt-4 text-red-400">
{review.timePressureDanger}
</p>

</CardContent>

</Card>

<Card className="mt-6 bg-amber-500/10 border-amber-500/20">

<CardContent className="p-6">

<h3 className="text-amber-300 font-black">
Trap Breakdown
</h3>

<p className="mt-4 text-slate-300">
{review.whyThisTrapWorks}
</p>

<p className="mt-4 text-slate-400">
{review.trapExplanation}
</p>

</CardContent>

</Card>


<div className="grid md:grid-cols-2 gap-4 mt-6">



{type.includes("summary") && (

<Card className="mt-6 bg-cyan-500/10 border-cyan-500/20">

<CardContent className="p-6">

<h3 className="text-cyan-300 font-black">
Summary Autopsy
</h3>

<div className="space-y-5 mt-6">

<div>
<div className="text-cyan-300 font-bold">
Subject
</div>

<p className="mt-2 text-slate-300">
{review.summaryFramework?.subject}
</p>
</div>

<div>
<div className="text-cyan-300 font-bold">
Claim
</div>

<p className="mt-2 text-slate-300">
{review.summaryFramework?.claim}
</p>
</div>

<div>
<div className="text-cyan-300 font-bold">
Qualification
</div>

<p className="mt-2 text-slate-300">
{review.summaryFramework?.qualification}
</p>
</div>

<div>
<div className="text-red-300 font-bold">
Most Dangerous Distortion
</div>

<div>
<div className="text-emerald-300 font-bold">
Main Claim
</div>

<p className="mt-2 text-slate-300">
{review.summaryAutopsy?.mainClaim}
</p>
</div>

<div>
<div className="text-cyan-300 font-bold">
Scope Limit
</div>

<p className="mt-2 text-slate-300">
{review.summaryAutopsy?.scopeLimit}
</p>
</div>

<div>
<div className="text-purple-300 font-bold">
Secondary Claim
</div>

<p className="mt-2 text-slate-300">
{review.summaryAutopsy?.secondaryClaim}
</p>
</div>

<p className="mt-2 text-slate-300">
{review.summaryAutopsy?.mostDangerousDistortion}
</p>
</div>

</div>

</CardContent>

</Card>

)}

<Card className="mt-6 bg-cyan-500/10 border-cyan-500/20">
<CardContent className="p-6">

<h3 className="text-cyan-300 font-black">
Question Solving Time
</h3>

<div className="grid grid-cols-2 gap-4 mt-6">

<div className="rounded-xl bg-slate-900 p-4">
<div className="text-slate-400">
Topper
</div>
<div className="text-cyan-300 text-2xl font-black">
{review.questionSolvingTime?.topper}
</div>
</div>

<div className="rounded-xl bg-slate-900 p-4">
<div className="text-slate-400">
Average Student
</div>
<div className="text-red-300 text-2xl font-black">
{review.questionSolvingTime?.averageStudent}
</div>
</div>

</div>

</CardContent>
</Card>

{review.signalWordsDetected?.length > 0 && (

<Card className="mt-6 bg-purple-500/10 border-purple-500/20">

<CardContent className="p-6">

<h3 className="text-purple-300 font-black">
Signal Words Detected
</h3>

<div className="flex flex-wrap gap-3 mt-4">

{review.signalWordsDetected.map(
(word,index)=>(
<div
key={index}
className="
px-3 py-2
rounded-xl
bg-slate-900
border border-purple-500/20
text-purple-300
"
>
{word}
</div>
)
)}

</div>

</CardContent>

</Card>

)}

<Card className="mt-6 bg-purple-500/10 border-purple-500/20">

<CardContent className="p-6">

<h3 className="text-purple-300 font-black">
Birbal's Takeaway
</h3>

<p className="mt-4 text-slate-300">
{review.futureRule}
</p>

<p className="mt-4 text-cyan-300">
{review.lessonForFutureQuestions}
</p>

<p className="mt-4 text-emerald-300">
{review.fiveSecondRevision}
</p>

</CardContent>

</Card>

</div>
</CardContent>
</Card>

</CardContent>

</AccordionContent>

</Card>

</AccordionItem>

</Accordion>
        </>

      );

    })}

  </div>

)}

{reviewTab !== "va" && (

<div className="mt-4 ml-2">

<TabGroup
  tabs={[
    {
      label: "Passage Analysis",
      value: "blueprint",
    },
    {
      label: "Question Autopsy",
      value: "autopsy",
    },
  ]}
  active={subTab}
  onChange={setSubTab}
/>
</div>
)}
 

  {reviewTab !== "va" &&
subTab === "blueprint" && (
<>

        {/* PASSAGE BLUEPRINT */}

        <div className="mt-12">

          <div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-bold">
            Passage Analysis
          </div>

          <Card
className="
mt-6
bg-gradient-to-r
from-cyan-500/10
via-slate-800/90
to-slate-800/90
border
border-cyan-400/30
shadow-lg
shadow-cyan-500/10
">

<CardContent className="p-6">

<h3 className="text-2xl font-black text-cyan-300">
  Passage Profile
</h3>

<p className="text-slate-400 mt-1">
  Understand the passage before reviewing the questions.
</p>

<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">

<div>
<div className="text-slate-500 text-xs uppercase">
Genre
</div>

<div className="text-white font-bold mt-2">
{enrichment.passageArchetype}
</div>
</div>

<div>
<div className="text-slate-500 text-xs uppercase">
Tone
</div>

<div className="text-white font-bold mt-2">
{enrichment.authorTone}
</div>
</div>

<div>
<div className="text-slate-500 text-xs uppercase">
Paragraphs
</div>

<div className="text-white font-bold mt-2">
{enrichment.paragraphCount}
</div>
</div>

<div>
<div className="text-slate-500 text-xs uppercase">
Main Idea
</div>

<div className="text-cyan-300 font-bold mt-2">
{enrichment.mainIdeaInOneLine}
</div>
</div>

</div>

</CardContent>

</Card>

          <div className="grid md:grid-cols-2 gap-6 mt-6">

            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/60 p-6">
              <div className="text-cyan-300 font-bold">
                Central Debate
              </div>

              <p className="mt-4 text-slate-300">
               {enrichment.centralDebate}
              </p>
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-slate-900/60 p-6">
              <div className="text-purple-300 font-bold">
                Core Theme
              </div>

              <p className="mt-4 text-slate-300">
                {enrichment.coreTheme}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6">
              <div className="text-emerald-300 font-bold">
                Author Intent
              </div>

              <p className="mt-4 text-slate-300">
               {enrichment.authorIntent}
              </p>
            </div>

           <div className="space-y-3">

  <div>
    <span className="text-orange-300 font-bold">
      Supports:
    </span>

    <p className="text-slate-300 mt-1">
      {enrichment.authorPositioning?.supports}
    </p>
  </div>

  <div>
    <span className="text-red-300 font-bold">
      Criticizes:
    </span>

    <p className="text-slate-300 mt-1">
      {enrichment.authorPositioning?.criticizes}
    </p>
  </div>

  <div>
    <span className="text-cyan-300 font-bold">
      Hidden Assumption:
    </span>

    <p className="text-slate-300 mt-1">
      {enrichment.authorPositioning?.hiddenAssumption}
    </p>
  </div>

</div>

          </div>
      
</div>

<Card className="mt-8 bg-cyan-500/10 border-cyan-500/20">
<CardContent className="p-6">
<h3 className="text-cyan-300 font-black">
Birbal Advice
</h3>

<p className="mt-4 text-slate-300">
{enrichment.birbalAdvice}
</p>
</CardContent>
</Card>
<Card className="mt-6 bg-red-500/10 border-red-500/20">
<CardContent className="p-6">

<h3 className="text-red-300 font-black">
⚠️ Exam Hall Warning
</h3>

<p className="mt-4 text-slate-300">
{enrichment.examHallWarning}
</p>

</CardContent>
</Card>

<Card className="mt-6 bg-purple-500/10 border-purple-500/20">
<CardContent className="p-6">

<h3 className="text-purple-300 font-black">
Main Idea In One Line
</h3>

<p className="mt-4 text-white">
{enrichment.mainIdeaInOneLine}
</p>

</CardContent>
</Card>

{/* ACTUAL PASSAGE */}

<div className="mt-16">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.35em] font-black">
    Actual Passage
  </div>

  <Card
    className="
      mt-6
      bg-slate-900/60
      border-cyan-500/20
    "
  >

    <CardContent className="p-8">

      {(selectedPassage.passage_json || []).length > 0 ? (

        <div className="space-y-6">

          {selectedPassage.passage_json.map(
            (paragraph, index) => (

              <p
                key={index}
                className="
                  text-slate-300
                  leading-8
                  text-base md:text-lg
                "
              >
                {paragraph}
              </p>

            )
          )}

        </div>

      ) : (

        <p
          className="
            text-slate-300
            leading-8
            text-base md:text-lg
            whitespace-pre-wrap
          "
        >
          {selectedPassage.passage_text}
        </p>

      )}

    </CardContent>

  </Card>

</div>

<div className="mt-16">

 <div className="text-cyan-300 text-sm uppercase tracking-[0.35em] font-black">
  Author's Argument Journey
</div>

 <div className="mt-8">

  {(enrichment.passageFlowMap || []).map(
    (step, index) => (

      <div
        key={step.step}
        className="flex gap-4"
      >

        {/* TIMELINE */}

        <div className="flex flex-col items-center">

          <div
            className="
              h-10
              w-10
              rounded-full
              bg-cyan-400
              text-black
              font-black
              flex
              items-center
              justify-center
              shadow-lg
              ring-4
              ring-cyan-500/20
              shadow-cyan-500/30
            "
          >
            {step.step}
          </div>

         {index <
  enrichment.passageFlowMap.length - 1 && (

  <>
    <div
      className="
        w-[3px]
        h-12
        bg-cyan-400/50
      "
    />

    <div
      className="
        text-cyan-300
        text-xl
        font-black
        leading-none
      "
    >
      ▼
    </div>

    <div
      className="
        w-[3px]
        h-12
        bg-cyan-400/50
      "
    />
  </>

)}

        </div>

        {/* CONTENT */}

        <div
         className="
  flex-1
  pb-16
"
        >

          <div
            className="
              text-cyan-300
              text-sm
              uppercase
              tracking-widest
              font-black
            "
          >
            Argument Step
          </div>

          <h3
            className="
              text-2xl
              font-black
              text-white
              mt-2
            "
          >
            {step.title}
          </h3>

          <p
            className="
              text-slate-300
              leading-7
              mt-4
            "
          >
            {step.description}
          </p>

        </div>

      </div>

    )
  )}

</div>

</div>

<div className="mt-16">

<h2 className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
Argument Chain
</h2>

<div className="mt-6 space-y-4">

{(enrichment.argumentChain || []).map(
(step,index)=>(
<Card
key={index}
className="bg-slate-900/60 border-cyan-500/20"
>

<CardContent className="p-6">

<div className="text-cyan-300 font-black">
Step {step.step}
</div>

<div className="mt-3 text-white font-bold">
{step.claim}
</div>

<p className="mt-3 text-slate-400">
{step.whyItMatters}
</p>

</CardContent>

</Card>
)
)}

</div>

</div>

      {/* PARAGRAPH FLOW */}

{/* PARAGRAPH FLOW */}

<div className="mt-16 max-w-7xl mx-auto px-8">

  <div className="text-purple-300 text-sm uppercase tracking-[0.25em] font-bold">
    Paragraph Flow
  </div>

  <div className="mt-6 space-y-4">

    {passageFlow.map((para, index) => (

      <Card
        key={index}
        className="bg-slate-900/60 border-cyan-500/20 overflow-hidden"
      >

        <button
          onClick={() =>
            setOpenParagraph(
              openParagraph === index
                ? null
                : index
            )
          }
          className="w-full flex items-center justify-between p-6 text-left"
        >

          <div>

          <div className="text-cyan-300 font-black text-lg">
  Paragraph {para.paragraph}
</div>

<div className="text-slate-400 mt-1">
  {para.transitionType}
</div>

<div className="text-xs text-cyan-400 mt-2">
  Click to expand
</div>

          </div>

          <ChevronDown
            className={`transition-transform duration-300 ${
              openParagraph === index
                ? "rotate-180"
                : ""
            }`}
          />

        </button>

        {openParagraph === index && (

          <CardContent className="pt-0 pb-6 px-6">

            <div className="mt-4">

              <div className="text-cyan-300 font-bold">
                Actual Meaning
              </div>

              <p className="mt-2 text-slate-300 leading-7">
                {para.actualMeaning}
              </p>

            </div>

            <div className="mt-6">

              <div className="text-emerald-300 font-bold">
                Simple Explanation
              </div>

              <p className="mt-2 text-slate-300 leading-7">
                {para.simpleExplanation}
              </p>

            </div>

            <div className="mt-6">

              <div className="text-purple-300 font-bold">
                Why This Paragraph Exists
              </div>

              <p className="mt-2 text-slate-300 leading-7">
                {para.whyThisParagraphExists}
              </p>

              <div className="mt-6">

<div className="text-cyan-300 font-bold">
Memory Hook
</div>

<p className="mt-2 text-slate-300">
{para.oneLineMemoryHook}
</p>

</div>

<div className="mt-6">

<div className="text-purple-300 font-bold">
Likely CAT Question
</div>

<p className="mt-2 text-slate-300">
{para.likelyQuestionFromThisParagraph}
</p>

</div>

<div className="mt-6">

<div className="text-amber-300 font-bold">
What Students Usually Miss
</div>

<p className="mt-2 text-slate-300">
{para.whatStudentsUsuallyMiss}
</p>

</div>

            </div>

            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">

              <div className="text-red-300 font-bold">
                ⚠️ CAT Reading Danger
              </div>

              <p className="mt-2 text-slate-300">
                {para.catReadingDanger}
              </p>

            </div>

           

          </CardContent>

        )}

      </Card>

    ))}

  </div>

</div>

{/* VOCABULARY INTELLIGENCE */}

<div className="mt-20 max-w-7xl mx-auto px-8">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
    Vocabulary Intelligence
  </div>

  <div className="grid md:grid-cols-2 gap-6 mt-6">

    {(enrichment.vocabulary || []).map((word, index) => (

      <Card
        key={index}
        className="
          bg-slate-900/60
          border-cyan-500/20
        "
      >

        <CardContent className="p-6">

          <h3 className="text-2xl font-black text-cyan-300">
            {word.word}
          </h3>

          <div className="mt-6">

            <div className="text-purple-300 font-bold">
              Dictionary Meaning
            </div>

            <p className="mt-2 text-slate-300">
              {word.meaning}
            </p>

          </div>

          <div className="mt-6">

            <div className="text-emerald-300 font-bold">
              Simple Meaning
            </div>

            <p className="mt-2 text-slate-300">
              {word.simpleMeaning}
            </p>

          </div>

          <div
            className="
              mt-6
              rounded-2xl
              border
              border-amber-500/20
              bg-amber-500/10
              p-4
            "
          >

            <div className="text-amber-300 font-bold">
              Why The Author Used It
            </div>



            <p className="mt-2 text-slate-300">
              {word.whyAuthorUsedIt}
            </p>

          </div>

          <div className="mt-6">

<div className="text-cyan-300 font-bold">
Root Word
</div>

<p className="mt-2 text-slate-300">
{word.rootWord}
</p>

</div>

<div className="mt-6">

<div className="text-purple-300 font-bold">
CAT Importance
</div>

<p className="mt-2 text-slate-300">
{word.catImportance}
</p>

</div>

<div className="mt-6">

<div className="text-emerald-300 font-bold">
Example Sentence
</div>

<p className="mt-2 text-slate-300">
{word.sentence}
</p>

</div>

        </CardContent>

      </Card>

    ))}

  </div>

</div>
{/* READING PSYCHOLOGY */}

<div className="mt-20">

  <div className="text-pink-300 text-sm uppercase tracking-[0.25em] font-black">
    Reading Psychology
  </div>

  <div className="grid md:grid-cols-2 gap-6 mt-6">

    <Card className="bg-slate-900/50 border-pink-500/20">
      <CardContent className="p-6">
        <h3 className="text-red-300 font-black mb-4">
          Author Trap Moments
        </h3>

        <ul className="space-y-3">
          {(psychology.authorTrapMoments || []).map(
            (item, i) => (
              <li key={i} className="text-slate-300">
                • {item}
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-cyan-500/20">
      <CardContent className="p-6">
        <h3 className="text-cyan-300 font-black mb-4">
          Scope Shift Moments
        </h3>

        <ul className="space-y-3">
          {(psychology.scopeShiftMoments || []).map(
            (item, i) => (
              <li key={i} className="text-slate-300">
                • {item}
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-amber-500/20">
      <CardContent className="p-6">
        <h3 className="text-amber-300 font-black mb-4">
          False Inference Zones
        </h3>

        <ul className="space-y-3">
          {(psychology.falseInferenceZones || []).map(
            (item, i) => (
              <li key={i} className="text-slate-300">
                • {item}
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-purple-500/20">
      <CardContent className="p-6">
        <h3 className="text-purple-300 font-black mb-4">
          Where Weak Students Fail
        </h3>

        <ul className="space-y-3">
          {(psychology.whereWeakStudentsFail || []).map(
            (item, i) => (
              <li key={i} className="text-slate-300">
                • {item}
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>

  </div>

</div>

<div className="mt-20">

<h2 className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
Topper Mental Notes
</h2>

<div className="mt-6">

{(enrichment.topperMentalNotes || []).map(
(note,index)=>(
<div
key={index}
className="
p-4
rounded-xl
bg-emerald-500/10
border
border-emerald-500/20
mb-3
"
>
{note}
</div>
)
)}

</div>

</div>

</>
  )}


{reviewTab !== "va" &&
subTab === "autopsy" && (
<>
  <div className="mt-10">

    <Card className="bg-slate-900/60 border-cyan-500/20">

      <CardContent className="p-8">

        <h2 className="text-3xl font-black text-cyan-300">
          Question Autopsy
        </h2>
        <Card className="mt-6 bg-slate-900/60 border-cyan-500/20">
  <CardContent className="p-8">

    <h3 className="text-cyan-300 font-black mb-6">
      Actual Passage
    </h3>

    {(selectedPassage.passage_json || []).map((paragraph, index) => (
      <p
        key={index}
        className="mb-6 leading-8 text-slate-300"
      >
        {paragraph}
      </p>
    ))}

  </CardContent>
</Card>

       <div className="space-y-8">
{questions
  .filter(
    (question) =>
      question.passage_id ===
      selectedPassage.id
  )
  .map((question) => {

    const autopsy =
      question.diagnosis || {};


  const type =
    question.question_type?.toLowerCase() || "";

    const attempt =
      rcAttempts.find(
        a =>
          a.question_id ===
          question.id
      );

      const isOpen = openRCQuestion === question.id;

    return (

      <Accordion
  type="single"
  collapsible
  className="w-full"
>
<AccordionItem value={`q-${question.id}`} className="border-0">

     <Card
  key={question.id}
  className="bg-slate-900/60 border-cyan-500/20 overflow-hidden"
>

  <AccordionTrigger className="px-6 py-5 hover:no-underline">

<div className="text-left">

<h2 className="text-2xl font-black text-cyan-300">
Question {autopsy.questionNumber}
</h2>

<div className="mt-2 text-slate-400">
{attempt?.selected_answer == null
  ? "Unattempted"
  : attempt?.is_correct
  ? "✓ Correct"
  : "✗ Incorrect"}
</div>

</div>

</AccordionTrigger>

<AccordionContent>
        <CardContent className="p-4 md:p-8">

         
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">

  <div>
    <div className="text-slate-500 text-xs uppercase">
      Difficulty
    </div>

    <div className="text-white font-bold mt-1">
      {autopsy.difficulty}
    </div>
  </div>

  <div>
    <div className="text-slate-500 text-xs uppercase">
      Time Taken
    </div>

    <div className="text-white font-bold mt-1">
      {attempt?.time_taken_s ?? 0}s
    </div>
  </div>

  <div>
    <div className="text-slate-500 text-xs uppercase">
      Trap Type
    </div>

    <div className="text-red-300 font-bold mt-1">
      {autopsy.trapType}
    </div>
  </div>

  <div>
    <div className="text-slate-500 text-xs uppercase">
      Skills
    </div>

    <div className="flex flex-wrap gap-2 mt-2">

      <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
        {autopsy.primarySkill}
      </span>

      <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
        {autopsy.secondarySkill}
      </span>

    </div>
  </div>

</div>

             {!attempt?.selected_answer == null ? (

  <div className="text-slate-400 font-black">
    • Unattempted
  </div>

) : attempt?.is_correct ? (

  <div className="text-emerald-400 font-black">
    ✓ Correct
  </div>

) : (

  <div className="text-red-400 font-black">
    ✗ Incorrect
  </div>

)}

        

          {/* QUESTION */}

          <div className="mt-8">

            <div className="text-cyan-300 font-bold">

              Actual Question

            </div>

            <p className="mt-3 text-white">

              {question.question_text}

            </p>

            <div className="mt-6 space-y-3">

  {(question.options || []).map((option, index) => {

    const letter =
      ["A", "B", "C", "D"][index];

    const correctLetter =
  ["A", "B", "C", "D"][
    Number(question.correct_answer) - 1
  ];

const isCorrect =
  letter === correctLetter;

  const selectedLetter =
  ["A","B","C","D"][
    Number(attempt?.selected_answer)
  ];
const isSelected =
  letter === selectedLetter;

    return (

      <div
        key={index}
        className={`
          p-4 rounded-xl border text-white

          ${isCorrect
            ? "border-emerald-500 bg-emerald-500/20"
            : isSelected
            ? "border-red-500 bg-red-500/20"
            : "border-slate-700 bg-slate-900/50"}
        `}
      >

        <div className="font-black text-cyan-300">
          {letter}
        </div>

        <div className="mt-2 text-white">
          {option.text}
        </div>

      </div>

    );

  })}

</div>
</div>

          {/* USER ANSWER */}

          <div className="grid md:grid-cols-2 gap-4 mt-8">

            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">

              <div className="text-red-300 font-bold">

                Your Answer

              </div>

              <div className="mt-3 text-slate-400">
Time Taken: {attempt?.time_taken_s ?? 0}s
</div>

             <div className="text-2xl mt-2 text-white font-black">

{!attempt?.selected_answer == null
  ? "Not Attempted"
  : (() => {

    const selectedIndex =
  Number(attempt.selected_answer);
      return question.options?.[selectedIndex]?.text;

    })()}

</div>

            </div>

            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">

              <div className="text-emerald-300 font-bold">

                Correct Answer

              </div>

            <div className="text-2xl mt-2 text-emerald-300 font-black">

{
  question.options?.[
    Number(question.correct_answer) - 1
  ]?.text
}

</div>

            </div>

          </div>

          {/* CAT TESTING */}

          <div className="mt-8 rounded-2xl border border-cyan-500/20 p-6">

            <h3 className="text-cyan-300 font-black">

              What CAT Was Testing

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.stemAnalysis}

            </p>

          </div>

          {/* WHY FAIL */}

          <div className="mt-6 rounded-2xl border border-red-500/20 p-6">

            <h3 className="text-red-300 font-black">

              Why Students Fail

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.whyStudentsFail}

            </p>

            <p className="mt-4 text-slate-400">

              {autopsy.panicMistake}

            </p>

          </div>

          {/* TRAP */}

          <div className="mt-6 rounded-2xl border border-amber-500/20 p-6">

            <h3 className="text-amber-300 font-black">

              Trap Breakdown

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.authorTrapMechanism}

            </p>

          </div>

          <div className="mt-6 rounded-2xl border border-blue-500/20 p-6">

  <h3 className="text-blue-300 font-black">
    Source Paragraphs
  </h3>

  <p className="mt-3 text-slate-300">
    Paragraphs:
    {" "}
    {
      autopsy.questionSource
        ?.primaryParagraphs
        ?.join(", ")
    }
  </p>

</div>

<Card className="mt-6 bg-red-500/10 border-red-500/20">
<CardContent className="p-6">

<h3 className="text-red-300 font-black">
Why This Trap Works
</h3>

<p className="mt-4 text-slate-300">
{autopsy.whyThisTrapWorks}
</p>

<p className="mt-4 text-slate-400">
{autopsy.trapExplanation}
</p>

</CardContent>
</Card>

{type.includes("odd") && (

<Card className="mt-6 bg-cyan-500/10 border-cyan-500/20">

<CardContent className="p-6">

<h3 className="text-cyan-300 font-black">
Theme Autopsy
</h3>

<div className="mt-6">

<div className="text-cyan-300 font-bold">
Main Theme
</div>

<p className="mt-2 text-slate-300">
{autopsy.mainTheme}
</p>

</div>

<div className="mt-6">

<div className="text-purple-300 font-bold">
Core Thread
</div>

<p className="mt-2 text-slate-300">
{autopsy.coreThread}
</p>

</div>

<div className="mt-6">

<div className="text-red-300 font-bold">
Why This Is The Odd Sentence
</div>

<p className="mt-2 text-slate-300">
{autopsy.oddSentenceReason}
</p>

</div>

<div className="mt-6">

<div className="text-emerald-300 font-bold">
Why Remaining Sentences Fit
</div>

<p className="mt-2 text-slate-300">
{autopsy.whyRemainingSentencesFit}
</p>

</div>

</CardContent>

</Card>

)}

{type.includes("placement") && (

<Card className="mt-6 bg-cyan-500/10 border-cyan-500/20">

<CardContent className="p-6">

<h3 className="text-cyan-300 font-black">
Logical Flow
</h3>

<p className="mt-4 text-slate-300">
{autopsy.flowExplanation}
</p>

<div className="mt-6">

<div className="text-purple-300 font-bold">
Anchor Before
</div>

<p className="mt-2 text-slate-300">
{autopsy.anchorBefore}
</p>

</div>

<div className="mt-6">

<div className="text-emerald-300 font-bold">
Anchor After
</div>

<p className="mt-2 text-slate-300">
{autopsy.anchorAfter}
</p>

</div>

</CardContent>

</Card>

)}

          {/* EVIDENCE */}

         <div className="mt-6 rounded-2xl border border-purple-500/20 p-6">

  <h3 className="text-purple-300 font-black">
    Evidence Line
  </h3>

  <p className="mt-4 text-slate-300 italic">
    "{autopsy.evidenceSupport?.quotedText}"
  </p>

  <p className="mt-4 text-slate-400">
    {autopsy.evidenceSupport?.whyThisProvesTheAnswer}
  </p>

</div>

          {/* TOPPER */}

          <div className="mt-6 rounded-2xl border border-emerald-500/20 p-6">

            <h3 className="text-emerald-300 font-black">

              Topper Thinking

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.idealThinkingProcess}

            </p>

          </div>

          <Card className="mt-6 bg-cyan-500/10 border-cyan-500/20">
<CardContent className="p-6">

<h3 className="text-cyan-300 font-black">
Topper Shortcut
</h3>

<p className="mt-4 text-slate-300">
{autopsy.topperShortcut}
</p>

</CardContent>
</Card>

{type.includes("jumble") && (

<Card className="mt-6 bg-cyan-500/10 border-cyan-500/20">

<CardContent className="p-6">

<h3 className="text-cyan-300 font-black">
Mandatory Pairs
</h3>

{(autopsy.mandatoryPairs || []).map(
(pair,index)=>(
<div key={index} className="mt-5">

<div className="text-cyan-300 font-bold">
{pair.pair}
</div>

<p className="mt-2 text-slate-300">
{pair.reason}
</p>

</div>
)
)}

</CardContent>

</Card>

)}

{type.includes("jumble") && (

<Card className="mt-6 bg-purple-500/10 border-purple-500/20">

<CardContent className="p-6">

<h3 className="text-purple-300 font-black">
Sentence Role Map
</h3>

<div className="space-y-4 mt-6">

{(autopsy.sentenceRoleMap || []).map(
(item,index)=>(
<div key={index}>

<div className="text-cyan-300 font-bold">
Sentence {item.sentence}
</div>

<div className="text-slate-300">
{item.role}
</div>

</div>
)
)}

</div>

</CardContent>

</Card>

)}

          {/* CORRECT OPTION */}

          <div className="mt-6 rounded-2xl border border-cyan-500/20 p-6">

            <h3 className="text-cyan-300 font-black">

              Why Correct Option Wins

            </h3>

            <div className="mt-6 rounded-2xl border border-emerald-500/20 p-6">

  <h3
  className="
    text-emerald-300
    font-black
    text-lg
    leading-tight
  "
>
    One Sentence To Remember
  </h3>

           <div className="space-y-4">

  <p className="text-slate-300">
    {autopsy.correctOptionAnalysis?.whyCorrect}
  </p>

  <p className="text-cyan-300">
    {autopsy.correctOptionAnalysis?.whyTopperChoosesIt}
  </p>

  <p className="text-red-300">
    {autopsy.correctOptionAnalysis?.whyMostStudentsAvoidIt}
  </p>

</div>
</div>

          </div>

          <Card className="mt-6 bg-red-500/10 border-red-500/20">
<CardContent className="p-6">

<h3 className="text-red-300 font-black">
Instant Elimination Signal
</h3>

<p className="mt-4 text-slate-300">
{autopsy.instantEliminationSignal}
</p>

</CardContent>
</Card>

        <div className="mt-6">

  <h3 className="text-2xl font-black text-amber-300">
    Option Autopsy
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

    {["A", "B", "C", "D"].map((letter) => {

      const correctLetter =
  ["A", "B", "C", "D"][
    Number(question.correct_answer) - 1
  ];

const isCorrect =
  letter === correctLetter;
     const explanation =
  autopsy.optionAnalysis?.[
    `option${letter}`
  ];

      return (
        <Card
          key={letter}
          className={`
            bg-slate-900/60 border
            ${
              isCorrect
                ? "border-emerald-500"
                : "border-slate-700"
            }
          `}
        >
          <CardContent className="p-5">

            <div
              className={`
                font-black
                ${
                  isCorrect
                    ? "text-emerald-300"
                    : "text-cyan-300"
                }
              `}
            >
              Option {letter}
              {isCorrect ? " ✓" : ""}
            </div>

           <div className="mt-3 space-y-3">

  <div>
    <div className="text-red-300 font-bold">
      Trap Type
    </div>

    <p className="text-slate-300">
      {explanation?.trapType}
    </p>
  </div>

  <div>
    <div className="text-cyan-300 font-bold">
      Why It Fails
    </div>

    <p className="text-slate-300">
      {explanation?.actualProblem}
    </p>
  </div>

  <div>
    <div className="text-amber-300 font-bold">
      Why Students Pick It
    </div>

    <div>

<div className="text-purple-300 font-bold">
What This Option Is Actually Saying
</div>

<p className="text-slate-300">
{explanation?.whatTheOptionIsActuallySaying}
</p>

</div>

<div>

<div className="text-red-300 font-bold">
Why A Topper Rejects It
</div>

<p className="text-slate-300">
{explanation?.whyATopperRejectsIt}
</p>

</div>

    <p className="text-slate-300">
      {explanation?.looksCorrectBecause}
    </p>
  </div>

</div>

          </CardContent>
        </Card>

        
      );

    })}

  </div>

</div>
<div className="mt-8">

<h3 className="text-cyan-300 font-black text-2xl">
Distractor Ranking
</h3>

<div className="mt-6 space-y-4">

{(autopsy.distractorRanking || []).map(
(item,index)=>(
<Card
key={index}
className="bg-slate-900/60 border-red-500/20"
>

<CardContent className="p-5">

<div className="text-red-300 font-black">
Option {item.option}
</div>

<div className="mt-2 text-amber-300">
Danger Level: {item.dangerLevel}
</div>

<p className="mt-3 text-slate-300">
{item.whyDangerous}
</p>

</CardContent>

</Card>
)
)}

</div>

</div>

        </CardContent>
        </AccordionContent>

      </Card>
      </AccordionItem>
      </Accordion>

    );

  })}

</div>

      </CardContent>

    </Card>

  </div>

</>
  )}

</div>
</div>


  );
}