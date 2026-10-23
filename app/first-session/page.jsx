"use client";

import "./first-session.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TenantLogo from "@/components/tenant/TenantLogo";
import { useTenant } from "@/components/providers/TenantProvider";
import { captureFirstSessionEvent } from "@/lib/firstSession/analytics";
import { buildFirstSessionInsight, formatParagraphGroup } from "@/lib/firstSession/diagnostic.mjs";
import { passageEvidenceMap, summarizeAuthoredTraps, summarizeQuestionTypes } from "@/lib/firstSession/reportPresentation.mjs";

const apiPath = "/api/first-session";

function durationLabel(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function visibleTimeLabel(milliseconds) {
  const seconds = Math.max(1, Math.round((Number(milliseconds) || 0) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function FirstSessionPage() {
  const router = useRouter();
  const { branding } = useTenant();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [savingQuestion, setSavingQuestion] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(480);
  const [reviewQuestionId, setReviewQuestionId] = useState(null);
  const [reportTab, setReportTab] = useState("report");
  const passageScrollRef = useRef(null);
  const paragraphRefs = useRef([]);
  const activeParagraphRef = useRef(null);
  const paragraphEnteredAt = useRef(0);
  const readingQueueRef = useRef(Promise.resolve());
  const submitStarted = useRef(false);
  const submitDiagnosticRef = useRef(null);
  const serverOffset = useRef(0);

  useLayoutEffect(() => {
    if (session?.report) {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [reportTab, session?.report]);

  const attemptId = session?.journey?.id;
  const userId = session?.journey?.user_id;
  const phase = session?.journey?.phase;
  const setId = session?.diagnostic?.set?.id || session?.report?.set_id || session?.journey?.diagnostic_set_id;
  const commonProperties = useMemo(() => ({
    user_id: userId,
    attempt_id: attemptId,
    set_id: setId,
    day_number: 1,
    journey_step: phase,
  }), [userId, attemptId, setId, phase]);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }, []);

  const post = useCallback(async (action, payload = {}) => {
    const token = await getToken();
    if (!token) throw new Error("Your session expired. Sign in to resume your first session.");
    const response = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "That step could not be saved. Please retry.");
    return data;
  }, [getToken]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/login?next=%2Ffirst-session");
        return;
      }
      const response = await fetch(apiPath, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Your first-session progress could not be loaded.");
      if (!data.required) {
        router.replace("/");
        return;
      }
      if (data.server_now) serverOffset.current = new Date(data.server_now).getTime() - Date.now();
      setSession(data);
      if (data.journey?.user_id) {
        captureFirstSessionEvent("profile_completed", data.journey.user_id, { user_id: data.journey.user_id, attempt_id: data.journey.id, day_number: 1 }, "profile_completed");
      }
      if (data.journey?.phase === "DIAGNOSTIC_IN_PROGRESS") {
        captureFirstSessionEvent("diagnostic_started", data.journey.id, { user_id: data.journey.user_id, attempt_id: data.journey.id, set_id: data.journey.diagnostic_set_id, day_number: 1, time_limit_seconds: 480 }, "diagnostic_started");
      }
      if (data.answers?.length) {
        const firstUnanswered = data.diagnostic?.questions?.findIndex((question) => !data.answers.some((answer) => answer.question_id === question.id));
        setCurrentQuestion(firstUnanswered >= 0 ? firstUnanswered : 0);
        for (const answer of data.answers) {
          const question = data.diagnostic?.questions?.find((item) => item.id === answer.question_id);
          const history = answer.history?.length ? answer.history : [{ selected_option: answer.selected_option, at: answer.answered_at }];
          history.forEach((entry, index) => {
            const properties = {
              user_id: data.journey.user_id,
              attempt_id: data.journey.id,
              set_id: data.journey.diagnostic_set_id,
              question_id: answer.question_id,
              question_number: question?.order_no,
              question_type: question?.question_type,
              selected_option: entry.selected_option,
              answer_version: index + 1,
              time_since_start_seconds: Math.max(0, Math.round((new Date(entry.at).getTime() - new Date(data.journey.diagnostic_started_at).getTime()) / 1000)),
              day_number: 1,
            };
            if (index === 0) captureFirstSessionEvent("diagnostic_question_answered", data.journey.id, properties, `answer:${answer.question_id}`);
            else captureFirstSessionEvent("diagnostic_answer_changed", data.journey.id, properties, `answer-change:${answer.question_id}:${index + 1}`);
          });
        }
      }
      if (data.journey?.phase === "DAILY_RC_MISSION") {
        captureFirstSessionEvent("daily_rc_mission_started", data.journey.id, { user_id: data.journey.user_id, attempt_id: data.journey.id, set_id: data.mission?.id || data.journey.mission_daily_set_id, diagnostic_set_id: data.journey.diagnostic_set_id, mission_type: "daily_rc_challenge", mission_challenge_date: data.journey.mission_challenge_date, day_number: 1 }, "daily_rc_mission_started");
      }
      if (data.journey?.phase === "DIAGNOSTIC_NOT_STARTED") {
        captureFirstSessionEvent("diagnostic_viewed", data.journey.id, { user_id: data.journey.user_id, attempt_id: data.journey.id, set_id: data.diagnostic?.set?.id, day_number: 1 }, "diagnostic_viewed");
      }
      if (["DIAGNOSTIC_COMPLETED", "DIAGNOSIS_VIEWED", "DAILY_RC_MISSION"].includes(data.journey?.phase)) {
        captureFirstSessionEvent("diagnostic_completed", data.journey.id, { user_id: data.journey.user_id, attempt_id: data.journey.id, set_id: data.report?.set_id, day_number: 1, score: data.report?.score, time_taken_seconds: data.report?.time_taken_seconds }, "diagnostic_completed");
        captureFirstSessionEvent("diagnostic_report_viewed", data.journey.id, { user_id: data.journey.user_id, attempt_id: data.journey.id, set_id: data.report?.set_id, day_number: 1 }, "diagnostic_report_viewed");
      }
        if (data.journey?.phase === "DIAGNOSTIC_COMPLETED") {
        const viewed = await post("report_viewed").catch(() => null);
        if (viewed) {
          setSession(viewed);
        }
      }
    } catch (loadError) {
      setError(loadError.message || "Your first session could not load.");
    } finally {
      setLoading(false);
    }
  }, [getToken, post, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (phase !== "DIAGNOSTIC_IN_PROGRESS" || !session?.journey?.diagnostic_deadline_at) return;
    const deadline = new Date(session.journey.diagnostic_deadline_at).getTime();
    const update = () => {
      const next = Math.max(0, Math.ceil((deadline - (Date.now() + serverOffset.current)) / 1000));
      setRemainingSeconds(next);
      if (next === 0 && !submitStarted.current) void submitDiagnosticRef.current?.(true);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [phase, session?.journey?.diagnostic_deadline_at]);

  const diagnostic = session?.diagnostic;
  const questions = diagnostic?.questions || [];
  const answers = session?.answers || [];
  const current = questions[currentQuestion];
  const selected = answers.find((answer) => answer.question_id === current?.id)?.selected_option;
  const reportInsight = buildFirstSessionInsight(session?.report);
  const reportQuestions = session?.report?.questions || [];
  const questionTypeStats = summarizeQuestionTypes(reportQuestions);
  const authoredTrapStats = summarizeAuthoredTraps(reportQuestions);
  const selectedReviewQuestion = reportQuestions.find((question) => question.id === reviewQuestionId) || reportQuestions[0] || null;
  const passageParagraphs = session?.report?.passage || [];
  const passageEnrichment = session?.report?.passage_enrichment || {};
  const paragraphFlow = Array.isArray(passageEnrichment.passageFlow) ? passageEnrichment.passageFlow : [];
  const vocabularyWords = Array.isArray(passageEnrichment.vocabulary) ? passageEnrichment.vocabulary : [];
  const readingAreas = useMemo(() => {
    const replay = session?.report?.replay || {};
    const sourceGroups = Array.isArray(replay.groups) ? replay.groups : [];
    const groups = sourceGroups.length || replay.grouping_available
      ? sourceGroups
      : (Array.isArray(replay.paragraphs) ? replay.paragraphs : []).map((item) => ({
        paragraph_indexes: [item.paragraph_index],
        visible_ms: item.visible_ms,
      }));
    return groups
      .filter((group) => Number(group.visible_ms) > 0 && Array.isArray(group.paragraph_indexes))
      .map((group) => ({
        ...group,
        paragraph_indexes: [...new Set(group.paragraph_indexes.map(Number).filter((index) => Number.isInteger(index) && index >= 0 && index < passageParagraphs.length))].sort((a, b) => a - b),
      }))
      .filter((group) => group.paragraph_indexes.length > 0)
      .sort((a, b) => Number(b.visible_ms) - Number(a.visible_ms))
      .slice(0, 2);
  }, [session?.report?.replay, passageParagraphs.length]);
  const passageEvidence = passageEvidenceMap(passageParagraphs, reportQuestions);
  const selectedEvidenceParagraph = useMemo(() => {
    const evidence = String(selectedReviewQuestion?.evidence_line || "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!evidence) return -1;
    const evidenceWords = evidence.split(/\s+/).filter(Boolean);
    const excerpt = evidenceWords.slice(0, Math.min(8, evidenceWords.length)).join(" ");
    return passageParagraphs.findIndex((paragraph) => {
      const normalized = String(paragraph).toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      return normalized.includes(evidence) || (excerpt.length >= 12 && normalized.includes(excerpt));
    });
  }, [selectedReviewQuestion?.evidence_line, passageParagraphs]);

  async function startDiagnostic() {
    setBusy(true); setError("");
    try {
      const next = await post("start_diagnostic");
      setSession(next);
      serverOffset.current = new Date(next.server_now).getTime() - Date.now();
      captureFirstSessionEvent("diagnostic_started", next.journey.id, { user_id: next.journey.user_id, attempt_id: next.journey.id, set_id: next.diagnostic?.set?.id, day_number: 1, time_limit_seconds: 480 }, "diagnostic_started");
    } catch (startError) { setError(startError.message); }
    finally { setBusy(false); }
  }

  async function chooseAnswer(question, optionIndex) {
    if (savingQuestion || remainingSeconds <= 0) return;
    setSavingQuestion(question.id); setError("");
    try {
      const result = await post("answer", { question_id: question.id, selected_option: optionIndex });
      const token = await getToken();
      const response = await fetch(apiPath, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const latest = await response.json();
      if (!response.ok) throw new Error(latest.error || "Your answer could not be loaded.");
      setSession(latest);
      const properties = { ...commonProperties, question_id: question.id, question_number: question.order_no, question_type: question.question_type, selected_option: optionIndex, answer_version: (latest.answers?.find((answer) => answer.question_id === question.id)?.history?.length || 1), time_since_start_seconds: Math.max(0, 480 - remainingSeconds) };
      if (result.is_change) captureFirstSessionEvent("diagnostic_answer_changed", attemptId, properties, `answer-change:${question.id}:${properties.answer_version}`);
      else captureFirstSessionEvent("diagnostic_question_answered", attemptId, properties, `answer:${question.id}`);
    } catch (answerError) { setError(answerError.message); }
    finally { setSavingQuestion(null); }
  }

  async function submitDiagnostic(fromTimer = false) {
    if (submitStarted.current) return;
    submitStarted.current = true;
    setBusy(true); setError("");
    try {
      const next = await post("submit_diagnostic");
      setSession(next);
      const report = next.report;
      captureFirstSessionEvent("diagnostic_completed", next.journey.id, { user_id: next.journey.user_id, attempt_id: next.journey.id, set_id: report?.set_id, day_number: 1, score: report?.score, time_taken_seconds: report?.time_taken_seconds, submitted_by_timer: fromTimer }, "diagnostic_completed");
      captureFirstSessionEvent("diagnostic_report_viewed", next.journey.id, { user_id: next.journey.user_id, attempt_id: next.journey.id, set_id: report?.set_id, day_number: 1 }, "diagnostic_report_viewed");
      if (next.journey?.phase === "DIAGNOSTIC_COMPLETED") {
        const viewed = await post("report_viewed");
        setSession(viewed);
      }
    } catch (submitError) {
      submitStarted.current = false;
      setError(submitError.message);
    } finally { setBusy(false); }
  }
  submitDiagnosticRef.current = submitDiagnostic;

  const sendReadingEvent = useCallback(async (event) => {
    if (!attemptId) return;
    readingQueueRef.current = readingQueueRef.current.then(async () => {
      try { await post("reading_event", { event }); }
      catch { /* A missed observation does not interrupt the diagnostic. */ }
    });
    await readingQueueRef.current;
  }, [attemptId, post]);

  useEffect(() => {
    if (phase !== "DIAGNOSTIC_IN_PROGRESS" || !diagnostic?.set?.passage?.length || !passageScrollRef.current) return;
    const root = passageScrollRef.current;
    const ratios = new Map();
    const flushActive = () => {
      if (activeParagraphRef.current === null) return;
      const visibleMs = Math.max(0, Math.min(120000, performance.now() - paragraphEnteredAt.current));
      void sendReadingEvent({ event_type: "viewport_interval", visible_paragraph_indexes: activeParagraphRef.current.indexes, interval_id: activeParagraphRef.current.intervalId, visible_ms: visibleMs });
      activeParagraphRef.current = null;
      paragraphEnteredAt.current = 0;
    };
    const persistVisibleInterval = () => {
      if (document.visibilityState !== "visible" || activeParagraphRef.current === null) return;
      const now = performance.now();
      const visibleMs = Math.max(0, Math.min(120000, now - paragraphEnteredAt.current));
      paragraphEnteredAt.current = now;
      void sendReadingEvent({ event_type: "viewport_interval", visible_paragraph_indexes: activeParagraphRef.current.indexes, interval_id: activeParagraphRef.current.intervalId, visible_ms: visibleMs });
    };
    const observer = new IntersectionObserver((entries) => {
      if (document.visibilityState !== "visible") return;
      for (const entry of entries) ratios.set(Number(entry.target.dataset.paragraphIndex), entry.isIntersecting ? entry.intersectionRatio : 0);
      const nextIndexes = [...ratios.entries()].filter(([, ratio]) => ratio >= 0.55).map(([index]) => index).sort((a, b) => a - b);
      const nextKey = nextIndexes.join(",");
      if (nextKey === activeParagraphRef.current?.key) return;
      flushActive();
      if (nextIndexes.length) {
        const intervalId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        activeParagraphRef.current = { indexes: nextIndexes, key: nextKey, intervalId };
        paragraphEnteredAt.current = performance.now();
      }
    }, { root, threshold: [0.55, 0.75] });
    paragraphRefs.current.forEach((element) => element && observer.observe(element));
    const persistTimer = window.setInterval(persistVisibleInterval, 5000);
    const visibility = () => {
      if (document.visibilityState === "hidden") { flushActive(); ratios.clear(); }
      else paragraphRefs.current.forEach((element) => element && observer.observe(element));
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", flushActive);
    return () => {
      flushActive(); window.clearInterval(persistTimer); observer.disconnect(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", flushActive);
    };
  }, [phase, diagnostic?.set?.passage?.length, sendReadingEvent]);

  async function startMission() {
    setBusy(true); setError("");
    try {
      if (session?.journey?.phase === "DIAGNOSTIC_COMPLETED") {
        const viewed = await post("report_viewed");
        setSession(viewed);
      }
      const mission = await post("start_mission");
      captureFirstSessionEvent("daily_rc_mission_started", attemptId, { ...commonProperties, set_id: mission.mission?.id, diagnostic_set_id: setId, mission_type: "daily_rc_challenge", mission_challenge_date: mission.challenge_date }, "daily_rc_mission_started");
      router.push("/daily-challenge/test?firstSession=1");
    } catch (missionError) { setError(missionError.message); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="fs-screen"><div className="fs-loader">Restoring your first session…</div></main>;

  return <main className="fs-screen">
    <div className="fs-shell">
      <header className="fs-header"><div className="fs-brand"><TenantLogo className="fs-brand-logo" /><span>{branding.brandName}</span></div><span className="fs-private-label">YOUR FIRST SESSION</span></header>
      {error && <div className="fs-error" role="alert">{error}<button type="button" onClick={load}>Retry</button></div>}
      {phase === "DIAGNOSTIC_NOT_STARTED" && <section className="fs-intro">
        <p className="fs-eyebrow">STEP 1 OF 2 · YOUR BASELINE</p>
        <h1>Let&apos;s see how you read.</h1>
        <p className="fs-lede">Work through one reading passage and four questions. Your report will show your results and what to practise next.</p>
        <div className="fs-meta-row"><span>4 questions</span><span>8 minutes · timed</span><span>One attempt · your report is private</span></div>
        <button className="fs-primary" disabled={busy} onClick={startDiagnostic}>{busy ? "Starting…" : "Start my diagnostic →"}</button>
      </section>}

      {phase === "DIAGNOSTIC_IN_PROGRESS" && diagnostic && <section className="fs-test">
        <div className="fs-test-heading"><div><p className="fs-eyebrow">YOUR READING DIAGNOSTIC</p><h1>Reading Diagnostic</h1></div><div className={`fs-timer ${remainingSeconds <= 60 ? "urgent" : ""}`} aria-live="polite"><span>TIME LEFT</span><b>{durationLabel(remainingSeconds)}</b></div></div>
        <div className="fs-test-grid">
          <section className="fs-passage-panel" aria-label="Reading passage">
            <div className="fs-panel-label"><span>PASSAGE</span><span>{diagnostic.set.passage.length} paragraphs</span></div>
            <div className="fs-passage-scroll" ref={passageScrollRef}>
              {diagnostic.set.passage.map((paragraph, index) => <p key={index} ref={(element) => { paragraphRefs.current[index] = element; }} data-paragraph-index={index} className="fs-passage-paragraph">{paragraph}</p>)}
            </div>
          </section>
          <section className="fs-question-panel" aria-label="Diagnostic question">
            <div className="fs-panel-label"><span>QUESTION {currentQuestion + 1} OF {questions.length}</span><span>Reading comprehension</span></div>
            <nav className="fs-question-nav" aria-label="Question navigation">{questions.map((question, index) => <button type="button" key={question.id} className={`${index === currentQuestion ? "active" : ""} ${answers.some((answer) => answer.question_id === question.id) ? "answered" : ""}`} onClick={() => setCurrentQuestion(index)} aria-label={`Question ${index + 1}${answers.some((answer) => answer.question_id === question.id) ? ", answered" : ", unanswered"}`} aria-current={index === currentQuestion ? "step" : undefined}>{index + 1}</button>)}</nav>
            {current && <><h2>{current.question_text}</h2><div className="fs-options">{current.options.map((option, index) => <button type="button" key={`${current.id}-${index}`} disabled={Boolean(savingQuestion) || remainingSeconds <= 0} className={`fs-option ${selected === index ? "selected" : ""}`} onClick={() => chooseAnswer(current, index)}><span className="fs-option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span>{selected === index && <span className="fs-option-check" aria-hidden="true">✓</span>}</button>)}</div></>}
            <div className="fs-question-footer"><span>{answers.length} of {questions.length} answered</span><div><button type="button" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion((value) => Math.max(0, value - 1))}>← Previous</button><button type="button" disabled={currentQuestion === questions.length - 1} onClick={() => setCurrentQuestion((value) => Math.min(questions.length - 1, value + 1))}>Next →</button></div></div>
            <button className="fs-submit" disabled={busy || Boolean(savingQuestion)} onClick={() => submitDiagnostic(false)}>{busy ? "Saving your report…" : "Finish diagnostic →"}</button>
          </section>
        </div>
      </section>}

      {session?.report && ["DIAGNOSTIC_COMPLETED", "DIAGNOSIS_VIEWED", "DAILY_RC_MISSION"].includes(phase) && <section className="fs-report">
        <header className="fs-report-heading">
          <div className="fs-report-heading-copy">
            <p className="fs-eyebrow">YOUR FIRST SESSION</p>
            <h1>Your Reading Report</h1>
            <p>See what happened, explore the passage evidence, and choose your next practice.</p>
          </div>
          <button type="button" className="fs-primary fs-report-cta-top" disabled={busy || !session.mission} onClick={startMission}>{busy ? "Opening mission…" : phase === "DAILY_RC_MISSION" ? "Continue today's RC →" : "Start today's RC →"}</button>
        </header>

        <nav className="fs-report-tabs" role="tablist" aria-label="Reading report sections">
          <button id="fs-tab-report" type="button" role="tab" aria-selected={reportTab === "report"} aria-controls="fs-panel-report" className={reportTab === "report" ? "active" : ""} onClick={() => setReportTab("report")}>Reading Report</button>
          <button id="fs-tab-review" type="button" role="tab" aria-selected={reportTab === "review"} aria-controls="fs-panel-review" className={reportTab === "review" ? "active" : ""} onClick={() => setReportTab("review")}>Detailed Review <span>{reportQuestions.length}</span></button>
        </nav>

        {reportTab === "report" && <div id="fs-panel-report" role="tabpanel" aria-labelledby="fs-tab-report">
        <section className="fs-report-hero" aria-label="Your results and next steps">
          <div className="fs-hero-score">
            <p className="fs-eyebrow">HOW YOU DID</p>
            <div className="fs-score-display"><strong>{session.report.score}</strong><span>/{session.report.total_questions}</span></div>
            <p>{Math.round((session.report.score / Math.max(1, session.report.total_questions)) * 100)}% accuracy</p>
            <div className="fs-hero-facts"><div><b>{durationLabel(session.report.time_taken_seconds)}</b><span>Total time</span></div><div><b>{session.report.questions.filter((question) => question.selected_option !== null).length}<small> / {session.report.total_questions}</small></b><span>Answered</span></div></div>
          </div>
          <div className="fs-hero-journey">
            <p className="fs-eyebrow">WHAT YOUR READING TELLS US</p>
            <h2>{reportInsight.headline}</h2>
            <p className="fs-summary-evidence">{reportInsight.evidence}</p>
            <p className="fs-summary-meaning">{reportInsight.meaning}</p>
          </div>
          <div className="fs-hero-action"><b>ONE THING TO TRY</b><span>{reportInsight.next_step}</span></div>
        </section>

        <section className="fs-reading-analysis" aria-label="How you read this passage">
          <div className="fs-section-heading"><div><p className="fs-eyebrow">HOW YOU READ</p><h2>Your reading journey</h2></div><span>{passageParagraphs.length} paragraphs</span></div>
          <p className="fs-reading-analysis-intro">The passage moves from its opening idea to its conclusion. The notes below show where more of your screen time appeared in this session.</p>
          {passageParagraphs.length > 0 && <ol className="fs-reading-sequence" aria-label="Passage paragraph order">{passageParagraphs.map((_, index) => <li key={index}><span>P{index + 1}</span>{index < passageParagraphs.length - 1 && <i aria-hidden="true" />}</li>)}</ol>}
          {readingAreas.length > 0 ? <>
            <div className="fs-reading-areas">
              {readingAreas.map((area, index) => <article className="fs-reading-area" key={`${area.paragraph_indexes.join("-")}-${index}`}>
                <p className="fs-eyebrow">{index === 0 ? "MOST TIME ON SCREEN" : "ANOTHER NOTABLE AREA"}</p>
                <h3>{formatParagraphGroup(area.paragraph_indexes)}</h3>
                <p className="fs-reading-area-time">{visibleTimeLabel(area.visible_ms)} {area.paragraph_indexes.length > 1 ? "visible together" : "visible on screen"}</p>
              </article>)}
            </div>
            <div className="fs-reading-takeaway"><b>What this tells us</b><p>Your screen position suggests more visible time around {formatParagraphGroup(readingAreas[0].paragraph_indexes)}. This does not prove where your attention was, but it gives us a useful early signal. As you complete more passages, Auctor can compare whether similar parts repeatedly take more time and how that relates to the questions you answer.</p></div>
          </> : <p className="fs-reading-analysis-empty">Reading-position details were not available for this session. Your passage and answer review are still available in Detailed Review.</p>}
        </section>

        <section className="fs-analytics-grid" aria-label="Question performance patterns">
          <article className="fs-analytics-block">
            <div className="fs-section-heading"><div><p className="fs-eyebrow">QUESTION TYPES</p><h2>What kinds of questions appeared?</h2></div><span>{reportQuestions.length} total</span></div>
            <p className="fs-analytics-intro">Each bar shows your correct, incorrect, and unanswered questions for that type.</p>
            <div className="fs-chart-legend" aria-label="Question result legend"><span><i className="correct" />Correct</span><span><i className="incorrect" />Incorrect</span><span><i className="unanswered" />Unanswered</span></div>
            {questionTypeStats.length ? (
              <div className="fs-type-chart">
                {questionTypeStats.map((row) => (
                  <div className="fs-type-row" key={row.label}>
                    <div className="fs-type-label">
                      <b>{row.label}</b>
                      <span>{row.total} total · {row.correct} correct · {row.incorrect} incorrect · {row.unanswered} unanswered{row.total > row.unanswered ? ` · ${Math.round(row.correct / (row.total - row.unanswered) * 100)}% accuracy` : " · accuracy unavailable"}</span>
                    </div>
                    <div className="fs-stacked-bar" role="img" aria-label={`${row.label}: ${row.correct} correct, ${row.incorrect} incorrect, ${row.unanswered} unanswered`}>
                      {row.correct > 0 && <i className="correct" style={{ width: `${row.correct / row.total * 100}%` }} />}
                      {row.incorrect > 0 && <i className="incorrect" style={{ width: `${row.incorrect / row.total * 100}%` }} />}
                      {row.unanswered > 0 && <i className="unanswered" style={{ width: `${row.unanswered / row.total * 100}%` }} />}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="fs-data-empty">Question types will appear here when available.</p>}
          </article>
          <article className="fs-analytics-block fs-trap-block">
            <div className="fs-section-heading"><div><p className="fs-eyebrow">ERROR TRAPS</p><h2>Patterns in missed answers</h2></div><span>{authoredTrapStats.reduce((sum, row) => sum + row.count, 0)} {authoredTrapStats.length === 1 ? "answer" : "answers"}</span></div>
            <p className="fs-analytics-intro">Each identified trap appears separately with the question where it occurred.</p>
            {authoredTrapStats.length ? <ol className="fs-trap-ranked-list">{authoredTrapStats.map((row) => {
              const trapQuestions = row.questions.map((number) => reportQuestions.find((question) => question.order_no === number)).filter(Boolean);
              const exampleQuestion = trapQuestions.find((question) => question.selected_option_explanation || question.why_students_fail);
              return <li className="fs-trap-ranked-item" key={row.label}>
                <div className="fs-trap-ranked-heading"><b>{row.label}</b><span>Seen in {row.questions.map((number) => `Q${number}`).join(", ")}</span></div>
                <p><strong>What it means:</strong> {row.explanation}</p>
                {exampleQuestion && <p><strong>What happened:</strong> {exampleQuestion.selected_option_explanation || exampleQuestion.why_students_fail}</p>}
                <p><strong>Next time:</strong> {row.lesson || reportInsight.next_step}</p>
              </li>;
            })}</ol> : <p className="fs-data-empty">No specific error trap was identified in this session.</p>}
          </article>
        </section>

        {phase === "DIAGNOSTIC_COMPLETED" || phase === "DIAGNOSIS_VIEWED" || phase === "DAILY_RC_MISSION" ? <section className="fs-mission fs-next-move"><p className="fs-eyebrow">YOUR NEXT MOVE</p><h2>Today&apos;s RC</h2><p>{reportInsight.next_step} One more passage gives you another chance to practise this.</p><div className="fs-mission-meta">Today&apos;s challenge · {session.mission?.questions_count || 4} questions · {session.mission?.timer_minutes || 8} minutes</div><button className="fs-primary" disabled={busy || !session.mission} onClick={startMission}>{busy ? "Opening mission…" : phase === "DAILY_RC_MISSION" ? "Continue today's RC →" : "Start today's RC →"}</button>{!session.mission && <p className="fs-mission-unavailable">Today&apos;s Daily RC is not published yet. Your diagnostic is saved; refresh this page to check for the mission.</p>}</section> : <div className="fs-next-loading">Preparing your report…</div>}
        </div>}

        {reportTab === "review" && <div id="fs-panel-review" role="tabpanel" aria-labelledby="fs-tab-review" className="fs-review-tab">
          <section className="fs-passage-journey" aria-label="Passage journey">
            <div className="fs-section-heading"><div><p className="fs-eyebrow">PASSAGE JOURNEY</p><h2>Follow the passage, paragraph by paragraph</h2></div><span>{passageParagraphs.length} paragraphs</span></div>
            <p className="fs-journey-intro">Open a paragraph to revisit its wording, see the author's move where notes are available, and connect saved question evidence to the passage.</p>
            {paragraphFlow.length > 0 && <section className="fs-author-flow" aria-label="Author's flow"><h3>Author&apos;s Flow</h3><ol>{paragraphFlow.map((note, index) => {
              const paragraphNumber = Number(note.paragraph || note.paragraphNumber) || index + 1;
              const move = note.transitionType || note.authorMove || note.role;
              const explanation = note.actualMeaning || note.simpleExplanation || note.whyThisParagraphExists;
              if (!move && !explanation) return null;
              return <li key={`${paragraphNumber}-${index}`}><b>P{paragraphNumber} · {move || "Paragraph"}</b>{explanation && <span>{explanation}</span>}</li>;
            })}</ol></section>}
            <ol className="fs-paragraph-map">{passageParagraphs.map((paragraph, index) => {
              const excerpt = String(paragraph).trim();
              const matches = passageEvidence[index] || [];
              const note = paragraphFlow.find((item) => Number(item.paragraph || item.paragraphNumber) === index + 1) || paragraphFlow[index] || {};
              const paragraphWords = vocabularyWords.filter((word) => Number(word.paragraph || word.paragraphNumber) === index + 1);
              return <li key={index}><details><summary><span className="fs-paragraph-number">P{index + 1}</span><span className="fs-paragraph-summary"><span>{excerpt.length > 165 ? `${excerpt.slice(0, 165).trimEnd()}…` : excerpt}</span>{note.transitionType && <small>{note.transitionType}</small>}</span><span className="fs-paragraph-open">Open</span></summary><div className="fs-paragraph-detail"><p className="fs-paragraph-source">{paragraph}</p>{note.transitionType && <section className="fs-paragraph-role"><small>AUTHOR&apos;S MOVE</small><p>{note.transitionType}</p></section>}{(note.actualMeaning || note.simpleExplanation || note.whyThisParagraphExists) && <div className="fs-paragraph-notes">{note.actualMeaning && <section><small>WHAT THIS PARAGRAPH SAYS</small><p>{note.actualMeaning}</p></section>}{note.simpleExplanation && <section><small>IN SIMPLE TERMS</small><p>{note.simpleExplanation}</p></section>}{note.whyThisParagraphExists && <section><small>WHY IT MATTERS IN THE PASSAGE</small><p>{note.whyThisParagraphExists}</p></section>}</div>}{paragraphWords.length > 0 && <section className="fs-paragraph-vocabulary"><small>USEFUL WORDS</small><ul>{paragraphWords.map((word, wordIndex) => <li key={`${word.word || "word"}-${wordIndex}`}><b>{word.word}</b><span>{word.contextualMeaning || word.simpleMeaning || word.meaning}</span></li>)}</ul></section>}{matches.length ? <div className="fs-paragraph-evidence"><b>Saved question evidence</b>{matches.map((item) => <div key={`${item.question_number}-${item.text}`}><blockquote>“{item.text}”</blockquote><button type="button" onClick={() => { setReviewQuestionId(reportQuestions.find((question) => question.order_no === item.question_number)?.id || null); document.getElementById("fs-question-review")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Review Q{item.question_number} →</button></div>)}</div> : <small>No saved question excerpt matched this paragraph.</small>}</div></details></li>;
            })}</ol>
            {vocabularyWords.some((word) => !Number(word.paragraph || word.paragraphNumber)) && <section className="fs-vocabulary"><div className="fs-section-heading"><div><p className="fs-eyebrow">WORDS IN CONTEXT</p><h3>Useful vocabulary</h3></div><span>Passage notes</span></div><ul>{vocabularyWords.filter((word) => !Number(word.paragraph || word.paragraphNumber)).map((word, index) => { const meaning = word.contextualMeaning || word.simpleMeaning || word.meaning; return <li key={`${word.word || "word"}-${index}`}><div><b>{word.word}</b></div>{meaning && <p>{meaning}</p>}{word.whyAuthorUsedIt && <details><summary>Why the author used it</summary><p>{word.whyAuthorUsedIt}</p></details>}</li>; })}</ul></section>}
          </section>
          <section className="fs-question-performance" aria-label="Question selector">
            <div className="fs-section-heading"><div><p className="fs-eyebrow">QUESTION REVIEW</p><h2>Choose a question</h2></div><span>Answers and evidence stay together below</span></div>
            <div className="fs-question-grid" role="group" aria-label="Choose question to review">{reportQuestions.map((question) => <button type="button" key={question.id} aria-pressed={reviewQuestionId === question.id || (!reviewQuestionId && question.order_no === 1)} onClick={() => setReviewQuestionId(question.id)} className={`fs-question-tile ${question.is_correct ? "correct" : question.selected_option === null ? "unanswered" : "incorrect"} ${reviewQuestionId === question.id || (!reviewQuestionId && question.order_no === 1) ? "active" : ""}`}><span className="fs-question-tile-top"><b>Q{question.order_no}</b><strong aria-label={question.is_correct ? "Correct" : question.selected_option === null ? "Unanswered" : "Incorrect"}>{question.is_correct ? "✓" : question.selected_option === null ? "—" : "×"}</strong></span><span className="fs-question-tile-type">{question.question_type}</span><span className="fs-question-tile-time">{question.time_to_answer_seconds === null ? "No answer" : `First answer · ${durationLabel(question.time_to_answer_seconds)}`}</span></button>)}</div>
          </section>
          {reportQuestions.length > 0 && <div className="fs-review-columns">
            <section className="fs-review-passage" aria-label="Passage evidence">
              <header><p className="fs-eyebrow">PASSAGE</p><p>Relevant evidence is highlighted when it matches the saved explanation.</p></header>
              <div className="fs-review-passage-scroll">{passageParagraphs.map((paragraph, index) => <p key={index} className={selectedEvidenceParagraph === index ? "evidence-active" : ""}><span>P{index + 1}</span>{paragraph}</p>)}</div>
              {selectedReviewQuestion?.evidence_line && <blockquote className="fs-review-evidence"><b>Evidence used for this question</b><span>“{selectedReviewQuestion.evidence_line}”</span>{selectedEvidenceParagraph < 0 && <small>This excerpt is shown from the saved review; no matching passage location was found.</small>}</blockquote>}
            </section>
            <article className="fs-question-review" id="fs-question-review">
              {selectedReviewQuestion ? <>
                <div className="fs-question-review-heading"><div><p className="fs-eyebrow">Q{selectedReviewQuestion.order_no} · {selectedReviewQuestion.question_type}</p><h3>{selectedReviewQuestion.question_text}</h3></div><strong className={`fs-review-status ${selectedReviewQuestion.is_correct ? "correct" : selectedReviewQuestion.selected_option === null ? "unanswered" : "incorrect"}`}>{selectedReviewQuestion.is_correct ? "Correct" : selectedReviewQuestion.selected_option === null ? "Unanswered" : "Incorrect"}</strong></div>
                <section className="fs-teaching-step"><p className="fs-eyebrow">WHAT WAS THIS TESTING?</p><p>{selectedReviewQuestion.primary_skill || selectedReviewQuestion.question_type}{selectedReviewQuestion.cognitive_error_tested ? ` · ${selectedReviewQuestion.cognitive_error_tested}` : ""}</p></section>
                <div className="fs-answer-comparison"><section className={selectedReviewQuestion.selected_option === null ? "unanswered" : selectedReviewQuestion.is_correct ? "correct" : "incorrect"}><small>YOUR ANSWER</small><b>{selectedReviewQuestion.selected_option === null ? "No answer recorded" : `${String.fromCharCode(65 + selectedReviewQuestion.selected_option)} · ${selectedReviewQuestion.options[selectedReviewQuestion.selected_option]}`}</b></section><section className="correct"><small>CORRECT ANSWER</small><b>{String.fromCharCode(65 + selectedReviewQuestion.correct_option)} · {selectedReviewQuestion.options[selectedReviewQuestion.correct_option]}</b></section></div>
                <p className="fs-answer-timing">Answer changed: <strong>{selectedReviewQuestion.answer_changes > 0 ? `Yes${selectedReviewQuestion.answer_history?.length > 1 ? ` · ${selectedReviewQuestion.answer_history.map((answer) => String.fromCharCode(65 + answer.selected_option)).join(" → ")}` : ""}` : "No"}</strong> · First answer at <strong>{selectedReviewQuestion.time_to_answer_seconds === null ? "timing unavailable" : durationLabel(selectedReviewQuestion.time_to_answer_seconds)}</strong></p>
                <section className="fs-teaching-step fs-evidence-step"><p className="fs-eyebrow">WHERE IS THE EVIDENCE?</p>{selectedReviewQuestion.evidence_line ? <p>“{selectedReviewQuestion.evidence_line}”</p> : <p>No authored evidence excerpt was supplied for this question.</p>}{selectedEvidenceParagraph >= 0 && <small>Highlighted in paragraph {selectedEvidenceParagraph + 1} beside this review.</small>}</section>
                {!selectedReviewQuestion.is_correct && selectedReviewQuestion.selected_option !== null && <section className="fs-teaching-step fs-error-step"><p className="fs-eyebrow">{selectedReviewQuestion.selected_option_explanation ? "WHY YOUR ANSWER FAILED" : selectedReviewQuestion.why_students_fail ? "COMMON DIFFICULTY ON THIS QUESTION" : "ANSWER STATUS"}</p>{selectedReviewQuestion.selected_option_explanation ? <p>{selectedReviewQuestion.selected_option_explanation}</p> : selectedReviewQuestion.why_students_fail ? <p>{selectedReviewQuestion.why_students_fail}</p> : <p>The saved answer is incorrect, but this question has no authored explanation for that specific option.</p>}</section>}
                <section className="fs-teaching-step fs-correct-step"><p className="fs-eyebrow">WHY THE CORRECT ANSWER WORKS</p><p>{selectedReviewQuestion.why_correct || "No authored explanation was supplied for the keyed answer."}</p></section>
                {selectedReviewQuestion.trap_type && selectedReviewQuestion.trap_explanation && <section className="fs-trap-note"><small>TRAP TO WATCH FOR</small><b>{selectedReviewQuestion.trap_type}</b><p>{selectedReviewQuestion.trap_explanation}</p></section>}
                <footer className="fs-review-pagination"><button type="button" disabled={selectedReviewQuestion.order_no <= 1} onClick={() => setReviewQuestionId(reportQuestions.find((question) => question.order_no === selectedReviewQuestion.order_no - 1)?.id || selectedReviewQuestion.id)}>← Previous</button><span>Q{selectedReviewQuestion.order_no} / {reportQuestions.length}</span><button type="button" disabled={selectedReviewQuestion.order_no >= reportQuestions.length} onClick={() => setReviewQuestionId(reportQuestions.find((question) => question.order_no === selectedReviewQuestion.order_no + 1)?.id || selectedReviewQuestion.id)}>Next →</button></footer>
              </> : <p>No diagnostic questions are available to review.</p>}
            </article>
          </div>}
        </div>}
      </section>}
    </div>
  </main>;
}
