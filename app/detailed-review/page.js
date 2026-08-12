"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";

export default function DetailedReviewPage() {
  const [rcSet, setRcSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeSection, setActiveSection] = useState("passageArgument");
  const [openParagraph, setOpenParagraph] = useState(null);
  const [openVocabulary, setOpenVocabulary] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(0);

  useEffect(() => {
    async function loadData() {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("daily_rc_sets").select("*").eq("challenge_date", today).single();
      setRcSet(data);

      const { data: questionData } = await supabase.from("daily_rc_questions").select("*").eq("daily_rc_set_id", data.id).order("order_no");
      setQuestions(questionData || []);

      const user = await supabase.auth.getUser();
      const { data: latestAttempt } = await supabase.from("daily_rc_attempts").select("*").eq("user_id", user.data.user.id).eq("daily_rc_set_id", data.id).order("completed_at", { ascending: false }).limit(1).single();

      if (latestAttempt) {
        const { data: attemptRows } = await supabase.from("daily_rc_question_attempts").select("*").eq("attempt_id", latestAttempt.id);
        setAttempts(attemptRows || []);
      }
    }
    loadData();
  }, []);

  if (!rcSet) return <div className="flex min-h-screen items-center justify-center bg-[#071120] text-white">Loading Review...</div>;

  const enrichment = rcSet.passage_enrichment || {};
  const passageFlow = enrichment.passageFlow || [];
  const psychology = enrichment.readingPsychology || {};

  return (
    <main className="min-h-screen bg-[#071120] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-[1380px]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><Link href="/daily-challenge/result" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft size={15} />Results</Link><h1 className="mt-2 text-3xl font-black leading-tight sm:text-[40px]">Detailed Review</h1><p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-400">Understand the passage, reconstruct the author&apos;s reasoning, and learn from every question.</p></div>
          <div className="flex items-center gap-3"><Link href="/cognition-diagnosis" className="text-sm font-semibold text-purple-300 hover:text-purple-200">Cognitive Diagnosis</Link><Link href="/" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Dashboard</Link></div>
        </header>

        <nav className="sticky top-0 z-30 -mx-2 mt-4 overflow-x-auto border-y border-slate-800 bg-[#071120]/95 px-2 py-1.5 backdrop-blur" aria-label="Detailed review sections">
          <div className="flex min-w-max gap-1">{[["blueprint","Blueprint"],["passageArgument","Passage & Argument"],["paragraphs","Paragraphs"],["vocabulary","Vocabulary"],["questions","Questions"]].map(([id,label]) => <button key={id} type="button" onClick={() => setActiveSection(id)} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${activeSection === id ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25" : "text-slate-500 hover:text-white"}`}>{label}</button>)}</div>
        </nav>

        <div key={activeSection} className="mt-4 animate-[reviewFade_180ms_ease-out]">
          {activeSection === "blueprint" && <Blueprint enrichment={enrichment} psychology={psychology} />}
          {activeSection === "passageArgument" && <PassageArgument rcSet={rcSet} steps={enrichment.passageFlowMap || []} />}
          {activeSection === "paragraphs" && <Paragraphs rcSet={rcSet} items={passageFlow} open={openParagraph} setOpen={setOpenParagraph} />}
          {activeSection === "vocabulary" && <Vocabulary words={enrichment.vocabulary || []} open={openVocabulary} setOpen={setOpenVocabulary} />}
          {activeSection === "questions" && <Questions rcSet={rcSet} questions={questions} attempts={attempts} open={openQuestion} setOpen={setOpenQuestion} />}
        </div>
      </div>
      <style jsx global>{`@keyframes reviewFade { from { opacity: .55; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </main>
  );
}

function Blueprint({ enrichment, psychology }) {
  const cards = [["Central Debate",enrichment.centralDebate],["Core Theme",enrichment.coreTheme],["Author Intent",enrichment.authorIntent],["Supports",enrichment.authorPositioning?.supports],["Critiques",enrichment.authorPositioning?.criticizes],["Hidden Assumption",enrichment.authorPositioning?.hiddenAssumption]].filter(([,value]) => value);
  const groups = [["Author Trap Moments",psychology.authorTrapMoments],["Scope Shift Moments",psychology.scopeShiftMoments],["False Inference Zones",psychology.falseInferenceZones],["Where Weak Students Fail",psychology.whereWeakStudentsFail]].filter(([,values]) => values?.length);
  return <section><SectionHeading label="Passage Blueprint" title="The argument at a glance" /><div className="mt-4 grid gap-3 md:grid-cols-2">{cards.map(([label,value]) => <CompactCard key={label} label={label}>{value}</CompactCard>)}</div>{groups.length > 0 && <div className="mt-5 grid gap-3 md:grid-cols-2">{groups.map(([label,values]) => <CompactCard key={label} label={label} tone="purple"><ul className="space-y-1.5">{values.map((value,index) => <li key={index}>• {value}</li>)}</ul></CompactCard>)}</div>}</section>;
}

function PassageArgument({ rcSet, steps }) {
  const [selectedStep, setSelectedStep] = useState(0);
  const [highlightedParagraph, setHighlightedParagraph] = useState(null);
  const [highlightedAccent, setHighlightedAccent] = useState(0);
  const paragraphRefs = useRef([]);
  const highlightTimer = useRef(null);
  const paragraphs = useMemo(() => rcSet.passage_json?.length ? rcSet.passage_json : String(rcSet.passage || "").split(/\n\s*\n/).filter(Boolean), [rcSet.passage, rcSet.passage_json]);
  const wordCount = paragraphs.join(" ").trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => () => clearTimeout(highlightTimer.current), []);

  function paragraphIndexes(step) {
    const source = step?.paragraphs ?? step?.paragraphNumbers ?? step?.paragraphNumber ?? step?.paragraph;
    if (source == null) return [];
    const values = Array.isArray(source) ? source : String(source).match(/\d+/g) || [];
    return values.map(Number).filter((value) => value >= 1 && value <= paragraphs.length).map((value) => value - 1);
  }

  const accents = [
    { color: "#43d3c7", soft: "rgba(67,211,199,.09)", border: "rgba(67,211,199,.42)" },
    { color: "#a78bfa", soft: "rgba(167,139,250,.09)", border: "rgba(167,139,250,.42)" },
    { color: "#f3b563", soft: "rgba(243,181,99,.09)", border: "rgba(243,181,99,.42)" },
    { color: "#e879a8", soft: "rgba(232,121,168,.09)", border: "rgba(232,121,168,.42)" },
  ];
  function focusParagraph(index, accentIndex=selectedStep) {
    if (index == null) return;
    setHighlightedParagraph(index);
    setHighlightedAccent(accentIndex);
    paragraphRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightedParagraph(null), 1600);
  }

  function selectStep(index) {
    setSelectedStep(index);
    const [paragraphIndex] = paragraphIndexes(steps[index]);
    focusParagraph(paragraphIndex, index);
  }

  function selectParagraph(index) {
    const matchingStep = steps.findIndex((step) => paragraphIndexes(step).includes(index));
    if (matchingStep >= 0) {
      setSelectedStep(matchingStep);
      focusParagraph(index, matchingStep);
    } else {
      focusParagraph(index);
    }
  }

  return <section>
    <div className="mb-3"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">Passage + Argument</p><p className="mt-1 text-sm text-slate-400">Read the passage and see how the author&apos;s reasoning develops.</p></div>
    <div className="passage-argument-workspace min-h-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1424]/70 shadow-[0_18px_50px_rgba(0,0,0,.16)]">
      <section className="passage-pane min-h-0 min-w-0 bg-slate-950/20 md:border-r md:border-slate-800" aria-label="Passage">
        <header className="shrink-0 border-b border-slate-800 bg-[#0a1424]/95 px-5 py-4 sm:px-6"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Passage</p><p className="mt-1 text-xs text-slate-500">{wordCount} words · approximately {Math.max(1, Math.ceil(wordCount / 220))} min reading</p></header>
        <div className="passage-pane-scroll review-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">{paragraphs.map((paragraph,index) => { const active=highlightedParagraph === index; const accent=accents[highlightedAccent % accents.length]; return <button ref={(node) => { paragraphRefs.current[index] = node; }} key={index} type="button" onClick={() => selectParagraph(index)} style={active ? { borderColor: accent.border, backgroundColor: accent.soft } : undefined} className={`block w-full border-l-2 py-1 pl-3 text-left text-[15px] font-normal leading-[1.78] transition-[border-color,background-color] duration-300 sm:text-[16px] ${index > 0 ? "mt-6" : ""} ${active ? "text-slate-100" : "border-slate-800/70 text-slate-300 hover:border-cyan-500/30"}`}>{paragraph}</button>; })}<div className="h-2" aria-hidden="true" /></div>
      </section>

      <section className="reasoning-pane min-h-0 min-w-0" aria-label="Author's argument flow">
        <header className="shrink-0 border-b border-slate-800 bg-[#0a1424]/95 px-5 py-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Author&apos;s Argument</p><p className="mt-1 text-xs text-slate-500">Follow the movement of the author&apos;s reasoning.</p></header>
        <div className="reasoning-pane-scroll review-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6">{steps.length > 0 ? <div className="reasoning-route relative mx-auto w-full max-w-[620px]">{steps.map((step,index) => { const mapping=paragraphIndexes(step); const selected=selectedStep === index; const type=step.type || step.transitionType || step.label; const accent=accents[index % accents.length]; const rightSide=index % 2 === 0; return <button key={step.step || index} type="button" onClick={() => selectStep(index)} className={`reasoning-step group relative w-full text-left ${rightSide ? "step-right" : "step-left"} ${selected ? "is-selected" : ""}`} style={{ "--step-color": accent.color, "--step-soft": accent.soft, "--step-border": accent.border }}><span className="journey-card min-w-0 rounded-2xl border bg-slate-950/70 px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,.13)] backdrop-blur transition-[transform,border-color,background-color] duration-200"><span className="flex items-center gap-2"><span className="h-px w-4 bg-[var(--step-color)]" />{type && <span className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--step-color)]">{type}</span>}<span className="ml-auto text-[8px] font-bold text-slate-600">STEP {String(index + 1).padStart(2,"0")}</span></span><span className="mt-1 block text-sm font-bold leading-5 text-slate-100">{step.title}</span><span className="mt-1.5 block text-xs leading-[1.6] text-slate-400">{step.description}</span>{mapping.length > 0 && <span className="mt-2.5 block text-[9px] font-bold text-[var(--step-color)]">{mapping.length === 1 ? `Paragraph ${mapping[0] + 1}` : `Paragraphs ${mapping.map((value) => value + 1).join(", ")}`}</span>}</span><span className="journey-node relative z-[2] flex h-8 w-8 items-center justify-center rounded-full border bg-[#0a1424] text-[9px] font-black text-[var(--step-color)] shadow-[0_0_0_5px_rgba(7,17,32,.9)]"><span className="absolute inset-[7px] rounded-full bg-[var(--step-color)] opacity-65" /><span className="relative text-[#071120]">{String(index + 1).padStart(2,"0")}</span></span></button>; })}</div> : <p className="text-sm text-slate-500">Argument flow is unavailable for this passage.</p>}<div className="h-2" aria-hidden="true" /></div>
      </section>
    </div>
    <style jsx global>{`.passage-argument-workspace{display:block}.passage-pane,.reasoning-pane{display:flex;min-height:0;flex-direction:column}.reasoning-pane{background:radial-gradient(circle at 50% 18%,rgba(139,92,246,.045),transparent 34%),rgba(15,23,42,.12)}.reasoning-route:before{content:"";position:absolute;top:16px;bottom:16px;left:50%;width:2px;transform:translateX(-50%);background:linear-gradient(to bottom,#43d3c7,#a78bfa 38%,#f3b563 68%,#e879a8);opacity:.48}.reasoning-step{display:grid;grid-template-columns:minmax(0,1fr) 52px minmax(0,1fr);align-items:center;min-height:142px}.reasoning-step .journey-node{grid-column:2;grid-row:1;justify-self:center}.reasoning-step .journey-node:after{content:"";position:absolute;top:50%;width:27px;height:1px;background:var(--step-color);opacity:.5}.reasoning-step.step-right .journey-node:after{left:50%}.reasoning-step.step-left .journey-node:after{right:50%}.reasoning-step.step-right .journey-card{grid-column:3;grid-row:1}.reasoning-step.step-left .journey-card{grid-column:1;grid-row:1}.reasoning-step:not(.is-selected){opacity:.72}.reasoning-step:hover{opacity:1}.reasoning-step.is-selected .journey-card{transform:translateY(-2px);border-color:var(--step-border);background:linear-gradient(135deg,var(--step-soft),rgba(2,6,23,.74));box-shadow:0 14px 34px rgba(0,0,0,.18)}.reasoning-step.is-selected .journey-node{border-color:var(--step-border);box-shadow:0 0 0 5px rgba(7,17,32,.9),0 0 18px var(--step-soft)}@media (min-width:768px){.passage-argument-workspace{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(360px,1fr);height:calc(100dvh - 206px);min-height:0}.passage-argument-workspace>section{min-height:0;overflow:hidden}}@media (max-width:599px){.reasoning-route:before{left:16px}.reasoning-step{grid-template-columns:36px minmax(0,1fr);min-height:0;padding-bottom:22px}.reasoning-step .journey-node{grid-column:1;grid-row:1;align-self:start;justify-self:start}.reasoning-step .journey-node:after{left:50%!important;right:auto!important;width:20px}.reasoning-step .journey-card,.reasoning-step.step-left .journey-card,.reasoning-step.step-right .journey-card{grid-column:2;grid-row:1}.reasoning-step:not(.is-selected){opacity:.86}}`}</style>
  </section>;
}

function Paragraphs({ rcSet, items, open, setOpen }) {
  const passageParagraphs = useMemo(() => rcSet.passage_json?.length ? rcSet.passage_json : String(rcSet.passage || "").split(/\n\s*\n/).filter(Boolean), [rcSet.passage, rcSet.passage_json]);
  const count = Math.max(items.length, passageParagraphs.length);
  return <section><SectionHeading label="Paragraph Flow" title="Read the source, then inspect its job" /><div className="mt-6 divide-y divide-slate-800/80 border-y border-slate-800/80">{Array.from({ length: count }, (_,index) => { const para=items[index] || {}; const original=passageParagraphs[index]; const expanded=open === index; return <article key={para.paragraph || index} className="py-1"><button type="button" onClick={() => setOpen(expanded ? null : index)} aria-expanded={expanded} className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left sm:px-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Paragraph {para.paragraph || index + 1}</p>{para.transitionType && <p className="mt-1.5 text-xs text-slate-500">{para.transitionType}</p>}</div><ChevronDown size={17} className={`shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <div className="px-1 pb-9 pt-2 sm:px-2"><section className="max-w-5xl"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Actual Paragraph</p>{original ? <div className="mt-5"><div className="flex items-center gap-2 text-sm font-bold tracking-[0.08em] text-cyan-300/80"><span>{String(index + 1).padStart(2,"0")}</span><span className="h-px w-7 bg-cyan-400/25" aria-hidden="true" /></div><p className="mt-3 text-[17px] font-normal leading-[1.7] text-slate-200 sm:text-[18px]">{original}</p></div> : <p className="mt-3 text-sm text-slate-500">Original paragraph unavailable.</p>}</section><div className="mt-8 grid gap-3 md:grid-cols-2"><ParagraphInsight label="Actual Meaning" value={para.actualMeaning} /><ParagraphInsight label="Why This Paragraph Exists" value={para.whyThisParagraphExists} /><ParagraphInsight label="What Students Think" value={para.simpleExplanation} /><ParagraphInsight label="CAT Reading Signal" value={para.catReadingDanger} tone="amber" /></div></div>}</article>; })}</div></section>;
}

function ParagraphInsight({ label, value, tone="neutral" }) { if (!value) return null; return <div className="rounded-xl border border-slate-800/85 bg-slate-950/25 p-4"><p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${tone === "amber" ? "text-amber-300" : "text-slate-500"}`}>{label}</p><p className="mt-2 text-sm leading-6 text-slate-400">{value}</p></div>; }

function Vocabulary({ words, open, setOpen }) {
  return <section><SectionHeading label="Vocabulary Intelligence" title="Meaning in the author&apos;s context" /><div className="mt-4 grid gap-3 md:grid-cols-2">{words.map((word,index) => { const expanded = open === index; return <article key={word.word || index} className="rounded-xl border border-slate-800 bg-slate-900/45 p-4"><h3 className="text-lg font-black uppercase text-cyan-200">{word.word}</h3><p className="mt-2 text-sm font-medium">{word.simpleMeaning || word.meaning}</p>{word.meaning && word.simpleMeaning && <p className="mt-1 text-xs leading-5 text-slate-500">{word.meaning}</p>}<button type="button" onClick={() => setOpen(expanded ? null : index)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-300">Why the author used it <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <p className="mt-3 border-l-2 border-amber-400/40 pl-3 text-sm leading-6 text-slate-300">{word.whyAuthorUsedIt}</p>}</article>; })}</div></section>;
}

function Questions({ rcSet, questions, attempts, open, setOpen }) {
  const selectedIndex = Math.min(open ?? 0, Math.max(questions.length - 1, 0));
  const question = questions[selectedIndex];
  const attempt = attempts.find((item) => item.question_id === question?.id);
  const [mobilePassageOpen, setMobilePassageOpen] = useState(false);
  const [focusedParagraph, setFocusedParagraph] = useState(null);
  const desktopParagraphRefs = useRef([]);
  const mobileParagraphRefs = useRef([]);
  const paragraphs = useMemo(() => {
    if (rcSet.passage_json?.length) return rcSet.passage_json;
    return String(rcSet.passage || "").split(/\n\s*\n/).filter(Boolean);
  }, [rcSet.passage, rcSet.passage_json]);
  const wordCount = paragraphs.join(" ").trim().split(/\s+/).filter(Boolean).length;

  function revealEvidence(evidence) {
    if (!evidence) return;
    const needle = String(evidence).toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const fragment = needle.split(" ").slice(0, 8).join(" ");
    const index = paragraphs.findIndex((paragraph) => String(paragraph).toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").includes(fragment));
    if (index < 0) return;
    setFocusedParagraph(index);
    setMobilePassageOpen(true);
    requestAnimationFrame(() => {
      const refs = window.innerWidth >= 1024 ? desktopParagraphRefs : mobileParagraphRefs;
      refs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  if (!question) return <section><SectionHeading label="Question Autopsy" title="Turn every decision into evidence" /><p className="mt-5 text-sm text-slate-500">No questions are available for this review.</p></section>;

  return <section>
    <div className="questions-review-workspace overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1424]/70 shadow-[0_18px_50px_rgba(0,0,0,.16)]">
      <aside className="review-scrollbar hidden border-r border-slate-800 bg-slate-950/25 lg:block lg:overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-slate-800 bg-[#0a1424]/95 p-5 backdrop-blur"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Passage</p><p className="mt-1 text-xs text-slate-500">{wordCount} words · approximately {Math.max(1, Math.ceil(wordCount / 220))} min reading</p></div>
        <div className="px-6 py-6 sm:px-8">{paragraphs.map((paragraph,index) => <article ref={(node) => { desktopParagraphRefs.current[index] = node; }} key={index} className={`passage-paragraph-row gap-3 border-l-2 py-1 pl-3 text-[15px] font-normal leading-[1.78] transition-[border-color,background-color] duration-300 sm:text-[16px] ${index > 0 ? "mt-6" : ""} ${focusedParagraph === index ? "border-cyan-400 bg-cyan-500/[.055] text-slate-100" : "border-slate-800/70 text-slate-300"}`}><span className="pt-0.5 text-[10px] font-black text-cyan-400/55">{String(index + 1).padStart(2,"0")}</span><p className="min-w-0">{paragraph}</p></article>)}</div>
      </aside>

      <div className="review-scrollbar min-w-0 lg:overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-slate-800 bg-[#0a1424]/95 p-3 backdrop-blur">
          <button type="button" onClick={() => setMobilePassageOpen((value) => !value)} className="mb-3 flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-bold text-slate-300 lg:hidden"><span>Passage · {wordCount} words</span><ChevronDown size={15} className={`transition-transform ${mobilePassageOpen ? "rotate-180" : ""}`} /></button>
          <div className="review-scrollbar flex gap-2 overflow-x-auto pb-0.5" aria-label="Question navigator">{questions.map((item,index) => { const itemAttempt=attempts.find((row) => row.question_id === item.id); const status=!itemAttempt?.selected_option ? "Unattempted" : itemAttempt.is_correct ? "Correct" : "Incorrect"; return <button key={item.id} type="button" onClick={() => setOpen(index)} aria-label={`Question ${index + 1}: ${status}`} aria-current={selectedIndex === index ? "true" : undefined} className={`flex h-9 min-w-[68px] shrink-0 items-center justify-center gap-2 rounded-[11px] border px-3 text-sm font-semibold transition-[border-color,background-color,color,box-shadow] ${selectedIndex === index ? "border-cyan-400/70 bg-cyan-500/12 text-slate-100 shadow-[0_0_14px_rgba(34,211,238,.09)]" : status === "Correct" ? "border-emerald-500/25 bg-emerald-500/[.055] text-slate-200 hover:border-emerald-500/40" : status === "Incorrect" ? "border-red-500/25 bg-red-500/[.05] text-slate-200 hover:border-red-500/40" : "border-slate-700 bg-slate-900/75 text-slate-300 hover:border-slate-600"}`}><span>Q{index + 1}</span><span className={`flex h-4 w-4 items-center justify-center text-[11px] font-bold ${status === "Correct" ? "text-emerald-400" : status === "Incorrect" ? "text-red-400" : "text-slate-600"}`} aria-hidden="true">{status === "Correct" ? <Check size={12} strokeWidth={2.25} /> : status === "Incorrect" ? "×" : "·"}</span></button>; })}</div>
        </div>
        {mobilePassageOpen && <div className="border-b border-slate-800 bg-slate-950/25 p-4 lg:hidden"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Passage</p><p className="mt-1 text-xs text-slate-500">{wordCount} words · approximately {Math.max(1, Math.ceil(wordCount / 220))} min reading</p></div><button type="button" onClick={() => setMobilePassageOpen(false)} className="rounded-lg border border-slate-700 p-2 text-slate-400"><ChevronDown size={15} className="rotate-180" /></button></div><div>{paragraphs.map((paragraph,index) => <article ref={(node) => { mobileParagraphRefs.current[index] = node; }} key={index} className={`passage-paragraph-row gap-2 border-l-2 py-1 pl-2.5 text-[15px] font-normal leading-7 transition-colors ${index > 0 ? "mt-5" : ""} ${focusedParagraph === index ? "border-cyan-400 bg-cyan-500/[.055] text-slate-100" : "border-slate-800 text-slate-300"}`}><span className="pt-0.5 text-[10px] font-black text-cyan-400/55">{String(index + 1).padStart(2,"0")}</span><p className="min-w-0">{paragraph}</p></article>)}</div></div>}
        <QuestionAnalysis key={question.id} question={question} attempt={attempt} index={selectedIndex} total={questions.length} onPrevious={() => setOpen(selectedIndex - 1)} onNext={() => setOpen(selectedIndex + 1)} onRevealEvidence={revealEvidence} />
      </div>
    </div>
    <style jsx global>{`.review-scrollbar{scrollbar-width:thin;scrollbar-color:rgba(71,85,105,.65) transparent}.review-scrollbar::-webkit-scrollbar{width:5px;height:5px}.review-scrollbar::-webkit-scrollbar-thumb{background:rgba(71,85,105,.65);border-radius:999px}.passage-paragraph-row{display:grid;grid-template-columns:32px minmax(0,1fr)}.review-option-row{display:grid;grid-template-columns:32px minmax(0,1fr) auto}@media (min-width:1024px){.questions-review-workspace{display:grid;grid-template-columns:minmax(0,3fr) minmax(360px,2fr);height:calc(100vh - 174px);min-height:600px}.passage-paragraph-row{grid-template-columns:36px minmax(0,1fr)}}`}</style>
  </section>;
}

function QuestionAnalysis({ question, attempt, index, total, onPrevious, onNext, onRevealEvidence }) {
  const autopsy = question.question_enrichment || {};
  const status = !attempt?.selected_option ? "Unattempted" : attempt.is_correct ? "Correct" : "Incorrect";
  const correctLetter = ["A","B","C","D"][Number(question.correct_answer)-1];
  const initiallyOpen = [correctLetter, attempt?.selected_option].filter(Boolean);
  const [openOptions, setOpenOptions] = useState(() => new Set(initiallyOpen));
  function toggleOption(letter) { setOpenOptions((current) => { const next=new Set(current); next.has(letter) ? next.delete(letter) : next.add(letter); return next; }); }

  return <article className="animate-[reviewFade_180ms_ease-out] px-4 py-6 sm:px-6">
    <header><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Question {index + 1} of {total}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status === "Correct" ? "bg-emerald-500/10 text-emerald-300" : status === "Incorrect" ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"}`}>{status}</span>{autopsy.trapType && <span className="rounded-full border border-amber-500/15 bg-amber-500/[.055] px-2 py-0.5 text-[10px] text-amber-200/90">{autopsy.trapType}</span>}</div><h3 className="mt-4 max-w-[720px] text-xl font-semibold leading-[1.45] text-slate-100 sm:text-[21px]">{question.question_text}</h3></header>

    <div className="mt-6 grid grid-cols-2 gap-3"><AnswerSummary label="Your answer" value={attempt?.selected_option || "—"} helper={!attempt?.selected_option ? "Not attempted" : null} tone={status === "Correct" ? "green" : status === "Unattempted" ? "muted" : "red"} /><AnswerSummary label="Correct answer" value={correctLetter} tone="green" /></div>

    <div className="mt-5 space-y-2.5">{(question.options || []).map((text,optionIndex) => { const letter=["A","B","C","D"][optionIndex]; const correct=letter===correctLetter; const selected=letter===attempt?.selected_option; return <div key={letter} className={`review-option-row items-start gap-3 rounded-lg border px-3.5 py-3 text-sm leading-6 transition-colors ${correct ? "border-emerald-500/30 bg-emerald-500/[.06] text-emerald-100" : selected ? "border-red-500/30 bg-red-500/[.06] text-red-100" : "border-slate-800 bg-slate-950/25 text-slate-300 hover:border-slate-700"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${correct ? "bg-emerald-500/12 text-emerald-300" : selected ? "bg-red-500/12 text-red-300" : "bg-slate-800 text-slate-400"}`}>{letter}</span><span className="min-w-0 break-words pt-0.5">{text}</span><span className="min-w-0 self-start pt-0.5 text-right">{correct && <span className="block whitespace-nowrap text-[10px] font-semibold uppercase text-emerald-300">✓ Correct</span>}{selected && !correct && <span className="block whitespace-nowrap text-[10px] font-semibold uppercase text-red-300">Your answer</span>}</span></div>; })}</div>

    <section className="mt-5"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Diagnosis</p><div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2"><DiagnosticBlock label="What CAT Was Testing" value={autopsy.stemAnalysis} /><DiagnosticBlock label="Why Students Fail" value={[autopsy.whyStudentsFail,autopsy.panicMistake].filter(Boolean).join(" ")} tone="red" /><DiagnosticBlock label="Trap Breakdown" value={autopsy.authorTrapMechanism} tone="amber" /><DiagnosticBlock label="Topper Thinking" value={autopsy.idealThinkingProcess} tone="green" /></div>{autopsy.evidenceLine && <div className="mt-4 border-t border-slate-800 pt-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">Evidence Line</p><p className="mt-1.5 text-[13px] italic leading-6 text-slate-300">“{autopsy.evidenceLine}”</p><button type="button" onClick={() => onRevealEvidence(autopsy.evidenceLine)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200"><Eye size={13} />View in passage</button></div>}<div className="mt-4 border-t border-slate-800 pt-4"><DiagnosticBlock label="Why Correct Option Wins" value={autopsy.whatCorrectOptionDoesBetter} tone="green" /></div></section>

    {autopsy.eliminationLogic && <section className="mt-5 border-t border-slate-800 pt-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300"><AlertTriangle size={13} />Option Autopsy</div><div className="mt-2 divide-y divide-slate-800 border-y border-slate-800">{["A","B","C","D"].map((letter) => { const explanation=autopsy.eliminationLogic[`option${letter}`]; if (!explanation) return null; const expanded=openOptions.has(letter); return <div key={letter}><button type="button" onClick={() => toggleOption(letter)} className="flex w-full items-center justify-between py-2.5 text-left text-xs font-bold text-slate-300"><span>{letter}{letter === correctLetter ? "  ✓ Correct" : letter === attempt?.selected_option ? "  ✕ Your answer" : "  Distractor"}</span><ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <p className="pb-3 pr-2 text-[13px] leading-6 text-slate-400">{explanation}</p>}</div>; })}</div></section>}

    <footer className="sticky bottom-3 mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#0a1424]/95 p-3 shadow-xl backdrop-blur"><button type="button" disabled={index === 0} onClick={onPrevious} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-slate-500 disabled:opacity-30"><ChevronLeft size={15} />Previous</button><span className="text-xs text-slate-500">{index + 1} / {total}</span><button type="button" disabled={index === total - 1} onClick={onNext} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-slate-500 disabled:opacity-30">Next<ChevronRight size={15} /></button></footer>
  </article>;
}

function SectionHeading({ label, title }) { return <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">{label}</p><h2 className="mt-2 text-2xl font-black">{title}</h2></div>; }
function CompactCard({ label, children, tone="cyan" }) { return <article className="rounded-xl border border-slate-800 bg-slate-900/45 p-4"><p className={`text-[10px] font-black uppercase tracking-wide ${tone === "purple" ? "text-purple-300" : "text-cyan-300"}`}>{label}</p><div className="mt-2 text-sm leading-6 text-slate-300">{children}</div></article>; }
function Evidence({ label, value, tone }) { if (!value) return null; const colors={red:"text-red-300",amber:"text-amber-300",purple:"text-purple-300",green:"text-emerald-300",cyan:"text-cyan-300"}; return <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3"><p className={`text-[10px] font-black uppercase tracking-wide ${colors[tone] || "text-slate-500"}`}>{label}</p><p className="mt-1.5 text-sm leading-6 text-slate-300">{value}</p></div>; }
function AnswerSummary({ label, value, helper, tone }) { const color=tone === "green" ? "text-emerald-300" : tone === "red" ? "text-red-300" : "text-slate-400"; return <div className="flex min-h-[76px] min-w-0 flex-col rounded-lg border border-slate-800/90 bg-slate-950/20 px-3.5 py-3"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span><span className={`mt-2 text-lg font-bold leading-none ${color}`}>{value}</span>{helper && <span className="mt-1 text-[10px] text-slate-500">{helper}</span>}</div>; }
function DiagnosticBlock({ label, value, tone="cyan" }) { if (!value) return null; const colors={red:"text-red-300",amber:"text-amber-300",green:"text-emerald-300",cyan:"text-cyan-300"}; return <div><p className={`text-[10px] font-black uppercase tracking-[0.14em] ${colors[tone]}`}>{label}</p><p className="mt-1 text-[13px] leading-[1.6] text-slate-400">{value}</p></div>; }
