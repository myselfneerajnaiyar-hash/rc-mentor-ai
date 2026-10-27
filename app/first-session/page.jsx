"use client";

import "./first-session.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TenantLogo from "@/components/tenant/TenantLogo";
import { useTenant } from "@/components/providers/TenantProvider";
import { captureFirstSessionEvent } from "@/lib/firstSession/analytics";
import { diagnosticCompletionProperties, diagnosticReportProperties } from "@/lib/firstSession/analyticsProperties.mjs";
import { buildFirstSessionInsight, formatParagraphGroup, studentOptionText } from "@/lib/firstSession/diagnostic.mjs";
import { buildBirbalAnalysis, calculateAccuracyPercentage, displayQuestionType, summarizeAuthoredTraps, summarizeQuestionTypes } from "@/lib/firstSession/reportPresentation.mjs";
import { normalizeTrapType, trapLesson } from "@/lib/bootcamp/traps.mjs";

const apiPath = "/api/first-session";

function durationLabel(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function visibleTimeLabel(milliseconds) {
  const seconds = Math.max(1, Math.round((Number(milliseconds) || 0) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function simpleTrapMeaning(label) {
  const text = String(label || "").toLocaleLowerCase();
  if (text.includes("partial truth") || text.includes("half truth")) return "It is partly right, but the extra part makes the whole option wrong.";
  if (text.includes("superficial similarity") || text.includes("similarity")) return "It uses familiar words or ideas, but it does not answer what the question asks.";
  if (text.includes("extreme")) return "The option sounds more certain than the passage does.";
  if (text.includes("outside scope") || text.includes("irrelevant")) return "The option may be related, but it does not answer this question.";
  if (text.includes("unsupported inference") || text.includes("attractive but unanswerable")) return "The option sounds possible, but the passage does not prove it.";
  if (text.includes("reversal") || text.includes("opposite")) return "The option says the opposite of what the passage says.";
  if (text.includes("too broad")) return "The option applies the passage’s point to more people or situations than it mentions.";
  if (text.includes("too narrow")) return "The option uses one small detail and misses the passage’s full point.";
  if (text.includes("causal")) return "The option says one thing caused another, but the passage does not show that.";
  if (text.includes("scope shift") || text.includes("distorted claim")) return "The option changes who or what the passage’s point is about.";
  if (text.includes("quantifier")) return "The option changes words like “some,” “most,” or “all.”";
  if (text.includes("comparison")) return "The option compares things that the passage does not compare in the same way.";
  return "The option misses what the passage actually supports. The Detailed Review shows how it happened in that question.";
}

function studentTrapLabel(label) {
  const canonical = normalizeTrapType(label);
  return ({
    "Half Truth / Partial Truth": "Partial truth",
    "Extreme Wording": "Too absolute",
    "Outside Scope": "Outside the question",
    "Distorted Claim": "Changed claim",
    "Causal Leap": "Cause-and-effect leap",
    "Unsupported Inference": "Not supported by the passage",
    "Reversal / Opposite Meaning": "Reversed meaning",
    "Scope Shift": "Scope creep",
    "Too Broad": "Too broad",
    "Too Narrow": "Too narrow",
    "Irrelevant Detail": "Irrelevant detail",
    "Premise–Conclusion Confusion": "Evidence mistaken for a conclusion",
    "Comparison Mismatch": "Mismatched comparison",
    "Misread Quantifier": "Quantity word misread",
    "Author Attitude Misread": "Author's tone misread",
    "Chronology / Sequence Error": "Order mistaken for cause",
    "Logical Connector Misread": "Linking word misread",
    "Attractive but Unanswerable": "Plausible, but not answered",
  })[canonical] || null;
}

function renderEvidenceParagraph(paragraph, evidenceLine) {
  const source = String(paragraph || "");
  const evidence = String(evidenceLine || "").trim().replace(/^[“”"']+|[“”"']+$/g, "");
  if (!source || !evidence) return source;
  const fragments = evidence.split(/(?:\.{2,}|…|\s—\s)/).map((part) => part.trim().replace(/^[“”"']+|[“”"']+$/g, "")).filter((part) => part.length >= 12);
  const candidates = fragments.length ? fragments.sort((a, b) => b.length - a.length) : [evidence];
  const lowerSource = source.toLocaleLowerCase();
  const match = candidates.map((candidate) => ({ candidate, index: lowerSource.indexOf(candidate.toLocaleLowerCase()) })).find((item) => item.index >= 0);
  if (!match) return source;
  return <>{source.slice(0, match.index)}<mark className="fs-evidence-mark">{source.slice(match.index, match.index + match.candidate.length)}</mark>{source.slice(match.index + match.candidate.length)}</>;
}

export default function FirstSessionPage() {
  const router = useRouter();
  const { branding } = useTenant();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testPane, setTestPane] = useState("passage");
  const [answerSaveStatus, setAnswerSaveStatus] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(480);
  const [reviewQuestionId, setReviewQuestionId] = useState(null);
  const [expandedTrap, setExpandedTrap] = useState(null);
  const [reportTab, setReportTab] = useState("report");
  const [reviewView, setReviewView] = useState("passage");
  const [mobileAutopsyPane, setMobileAutopsyPane] = useState("questions");
  const [homeNavigationPending, setHomeNavigationPending] = useState(false);
  const [birbalChatOpen, setBirbalChatOpen] = useState(false);
  const [birbalChatMessages, setBirbalChatMessages] = useState([]);
  const [birbalChatInput, setBirbalChatInput] = useState("");
  const [birbalChatSending, setBirbalChatSending] = useState(false);
  const [birbalChatError, setBirbalChatError] = useState("");
  const passageScrollRef = useRef(null);
  const paragraphRefs = useRef([]);
  const activeParagraphRef = useRef(null);
  const paragraphEnteredAt = useRef(0);
  const readingQueueRef = useRef(Promise.resolve());
  const answersRef = useRef([]);
  const confirmedAnswersRef = useRef(new Map());
  const answerSaveQueueRef = useRef(new Map());
  const answerSaveInFlightRef = useRef(false);
  const answerSaveDrainRef = useRef(Promise.resolve());
  const retryAnswerRef = useRef(new Map());
  const submitStarted = useRef(false);
  const submitDiagnosticRef = useRef(null);
  const serverOffset = useRef(0);
  const homeNavigationStarted = useRef(false);
  const questionEnteredAtRef = useRef(Date.now());

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
      answersRef.current = data.answers || [];
      confirmedAnswersRef.current = new Map((data.answers || []).map((answer) => [answer.question_id, answer]));
      answerSaveQueueRef.current.clear();
      answerSaveInFlightRef.current = false;
      retryAnswerRef.current.clear();
      setAnswerSaveStatus({});
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
        captureFirstSessionEvent("diagnostic_started", data.journey.id, { user_id: data.journey.user_id, attempt_id: data.journey.id, set_id: data.journey.diagnostic_set_id, diagnostic_version: data.journey.diagnostic_set_id, day_number: 1, time_limit_seconds: 480 }, "diagnostic_started");
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
              selected_answer: Number.isInteger(Number(entry.selected_option)) ? String.fromCharCode(65 + Number(entry.selected_option)) : undefined,
              answer_status: "selected",
              answer_version: index + 1,
              time_since_start_seconds: Math.max(0, Math.round((new Date(entry.at).getTime() - new Date(data.journey.diagnostic_started_at).getTime()) / 1000)),
              diagnostic_version: data.journey.diagnostic_set_id,
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
      if (["DIAGNOSIS_VIEWED", "DAILY_RC_MISSION"].includes(data.journey?.phase)) {
        const reportContext = { user_id: data.journey.user_id, attempt_id: data.journey.id, day_number: 1, journey_step: data.journey.phase };
        captureFirstSessionEvent("diagnostic_completed", data.journey.id, { ...reportContext, set_id: data.report?.set_id, diagnostic_version: data.report?.set_id, score: data.report?.score, ...diagnosticCompletionProperties(data.report) }, "diagnostic_completed");
        captureFirstSessionEvent("diagnostic_report_viewed", data.journey.id, { ...reportContext, ...diagnosticReportProperties(data.report) }, "diagnostic_report_viewed");
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
  useEffect(() => {
    questionEnteredAtRef.current = Date.now();
  }, [current?.id]);
  const selected = answers.find((answer) => answer.question_id === current?.id)?.selected_option;
  const reportInsight = buildFirstSessionInsight(session?.report);
  const reportQuestions = session?.report?.questions || [];
  const reportTotal = Number(session?.report?.total_questions) || reportQuestions.length;
  const reportCorrect = Number.isFinite(Number(session?.report?.score))
    ? Number(session.report.score)
    : reportQuestions.filter((question) => question.is_correct).length;
  const reportAttempted = reportQuestions.filter((question) => question.selected_option !== null && question.selected_option !== undefined).length;
  const reportAccuracy = calculateAccuracyPercentage(reportCorrect, reportAttempted);
  const authoredTrapStats = summarizeAuthoredTraps(reportQuestions);
  const questionTypeStats = summarizeQuestionTypes(reportQuestions);
  const birbalAnalysis = buildBirbalAnalysis(session?.report);
  const selectedReviewQuestion = reportQuestions.find((question) => question.id === reviewQuestionId) || reportQuestions[0] || null;
  const selectedCanonicalTrap = normalizeTrapType(selectedReviewQuestion?.trap_type);
  const selectedTrapLabel = selectedCanonicalTrap !== "Other"
    ? studentTrapLabel(selectedReviewQuestion?.trap_type)
    : selectedReviewQuestion?.trap_type || null;
  const nextTimeTakeaway = selectedReviewQuestion?.next_time_takeaway
    || (selectedCanonicalTrap !== "Other" ? trapLesson(selectedCanonicalTrap) : null)
    || "Before choosing, match the option’s full claim to the question and passage evidence.";
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
      .slice(0, 5)
      .sort((a, b) => a.paragraph_indexes[0] - b.paragraph_indexes[0]);
  }, [session?.report?.replay, passageParagraphs.length]);
  const maxReadingAreaMs = Math.max(1, ...readingAreas.map((area) => Number(area.visible_ms) || 0));
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

  useEffect(() => {
    setBirbalChatOpen(false);
    setBirbalChatMessages([]);
    setBirbalChatInput("");
    setBirbalChatError("");
  }, [selectedReviewQuestion?.id]);

  function openBirbalForQuestion() {
    if (!selectedReviewQuestion) return;
    setBirbalChatMessages([{
      role: "assistant",
      content: `I have the full passage and Question ${selectedReviewQuestion.order_no} in context. What would you like to discuss?`,
    }]);
    setBirbalChatInput("");
    setBirbalChatError("");
    setBirbalChatOpen(true);
  }

  async function sendBirbalQuestion(event) {
    event.preventDefault();
    const message = birbalChatInput.trim();
    if (!message || !selectedReviewQuestion || birbalChatSending) return;
    const nextMessages = [...birbalChatMessages, { role: "user", content: message }];
    setBirbalChatMessages(nextMessages);
    setBirbalChatInput("");
    setBirbalChatError("");
    setBirbalChatSending(true);
    try {
      const response = await fetch("/api/birbal-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: passageParagraphs.join("\n\n"),
          question: {
            prompt: selectedReviewQuestion.question_text,
            options: selectedReviewQuestion.options,
            correctIndex: selectedReviewQuestion.correct_option,
            selectedIndex: selectedReviewQuestion.selected_option,
            selectedIsCorrect: selectedReviewQuestion.selected_option === null ? null : selectedReviewQuestion.is_correct,
            questionType: selectedReviewQuestion.question_type,
            evidence: selectedReviewQuestion.evidence_line,
            whyCorrect: selectedReviewQuestion.why_correct,
            selectedOptionExplanation: selectedReviewQuestion.selected_option_explanation,
            trapType: selectedReviewQuestion.trap_type,
            trapExplanation: selectedReviewQuestion.trap_explanation,
          },
          chat: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.reply) throw new Error(data.error || "Birbal could not answer just now.");
      setBirbalChatMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (chatError) {
      setBirbalChatError(chatError.message || "Birbal could not answer just now. Please retry.");
    } finally {
      setBirbalChatSending(false);
    }
  }

  async function startDiagnostic() {
    setBusy(true); setError("");
    try {
      try { window.sessionStorage.removeItem(`auctor:first-session:home:${userId}`); } catch { /* Storage may be unavailable. */ }
      const next = await post("start_diagnostic");
      setSession(next);
      answersRef.current = next.answers || [];
      confirmedAnswersRef.current = new Map((next.answers || []).map((answer) => [answer.question_id, answer]));
      serverOffset.current = new Date(next.server_now).getTime() - Date.now();
      captureFirstSessionEvent("diagnostic_started", next.journey.id, { ...commonProperties, set_id: next.diagnostic?.set?.id, diagnostic_version: next.diagnostic?.set?.id, time_limit_seconds: 480 }, "diagnostic_started");
    } catch (startError) { setError(startError.message); }
    finally { setBusy(false); }
  }

  function setQuestionSaveStatus(questionId, status) {
    setAnswerSaveStatus((current) => {
      if (!status) {
        const next = { ...current };
        delete next[questionId];
        return next;
      }
      return { ...current, [questionId]: status };
    });
  }

  function drainAnswerSaveQueue() {
    if (answerSaveInFlightRef.current) return answerSaveDrainRef.current;
    answerSaveInFlightRef.current = true;
    answerSaveDrainRef.current = (async () => {
      try {
        while (answerSaveQueueRef.current.size > 0) {
          const [questionId, intent] = answerSaveQueueRef.current.entries().next().value;
          answerSaveQueueRef.current.delete(questionId);
          try {
            const result = await post("answer", { question_id: questionId, selected_option: intent.optionIndex });
            const confirmed = confirmedAnswersRef.current.get(questionId) || null;
            const history = result.is_repeat
              ? (confirmed?.history || [{ selected_option: intent.optionIndex, at: result.answered_at || intent.answeredAt }])
              : [...(confirmed?.history || []), { selected_option: intent.optionIndex, at: result.answered_at || intent.answeredAt }];
            const savedAnswer = { question_id: questionId, selected_option: intent.optionIndex, answered_at: result.answered_at || intent.answeredAt, history };
            confirmedAnswersRef.current.set(questionId, savedAnswer);
            retryAnswerRef.current.delete(questionId);
            const properties = { ...commonProperties, diagnostic_version: setId, question_id: intent.question.id, question_number: intent.question.order_no, question_type: intent.question.question_type, selected_option: intent.optionIndex, selected_answer: String.fromCharCode(65 + intent.optionIndex), answer_status: "selected", answer_version: history.length, time_since_start_seconds: Math.max(0, 480 - remainingSeconds), time_spent_seconds: intent.timeSpentSeconds };
            if (result.is_change) captureFirstSessionEvent("diagnostic_answer_changed", attemptId, properties, `answer-change:${questionId}:${history.length}`);
            else captureFirstSessionEvent("diagnostic_question_answered", attemptId, properties, `answer:${questionId}`);
            if (answerSaveQueueRef.current.has(questionId)) setQuestionSaveStatus(questionId, "saving");
            else setQuestionSaveStatus(questionId, null);
          } catch {
            if (answerSaveQueueRef.current.has(questionId)) continue;
            const confirmed = confirmedAnswersRef.current.get(questionId) || null;
            answersRef.current = [...answersRef.current.filter((answer) => answer.question_id !== questionId), ...(confirmed ? [confirmed] : [])];
            setSession((previous) => ({ ...previous, answers: [...(previous?.answers || []).filter((answer) => answer.question_id !== questionId), ...(confirmed ? [confirmed] : [])] }));
            retryAnswerRef.current.set(questionId, intent);
            setQuestionSaveStatus(questionId, "error");
          }
        }
      } finally {
        answerSaveInFlightRef.current = false;
      }
    })();
    return answerSaveDrainRef.current;
  }

  async function chooseAnswer(question, optionIndex) {
    if (remainingSeconds <= 0) return;
    const previousAnswer = answersRef.current.find((answer) => answer.question_id === question.id) || null;
    if (previousAnswer?.selected_option === optionIndex) return;
    const answeredAt = new Date().toISOString();
    const optimisticAnswer = {
      question_id: question.id,
      selected_option: optionIndex,
      answered_at: answeredAt,
      history: [...(previousAnswer?.history || []), { selected_option: optionIndex, at: answeredAt }],
    };
    answersRef.current = [...answersRef.current.filter((answer) => answer.question_id !== question.id), optimisticAnswer];
    const timeSpentSeconds = Math.max(0, Math.round((Date.now() - questionEnteredAtRef.current) / 1000));
    answerSaveQueueRef.current.set(question.id, { question, optionIndex, answeredAt, timeSpentSeconds });
    retryAnswerRef.current.delete(question.id);
    setQuestionSaveStatus(question.id, "saving");
    setError("");
    setSession((previous) => ({ ...previous, answers: [...(previous?.answers || []).filter((answer) => answer.question_id !== question.id), optimisticAnswer] }));
    drainAnswerSaveQueue();
  }

  function retryAnswer(questionId) {
    const intent = retryAnswerRef.current.get(questionId);
    if (!intent || remainingSeconds <= 0) return;
    const answer = { question_id: questionId, selected_option: intent.optionIndex, answered_at: intent.answeredAt, history: [...(confirmedAnswersRef.current.get(questionId)?.history || []), { selected_option: intent.optionIndex, at: intent.answeredAt }] };
    answersRef.current = [...answersRef.current.filter((item) => item.question_id !== questionId), answer];
    setSession((previous) => ({ ...previous, answers: [...(previous?.answers || []).filter((item) => item.question_id !== questionId), answer] }));
    answerSaveQueueRef.current.set(questionId, intent);
    retryAnswerRef.current.delete(questionId);
    setQuestionSaveStatus(questionId, "saving");
    setError("");
    drainAnswerSaveQueue();
  }

  async function submitDiagnostic(fromTimer = false) {
    if (submitStarted.current) return;
    if (!fromTimer && (answerSaveQueueRef.current.size > 0 || answerSaveInFlightRef.current)) return;
    if (fromTimer && (answerSaveQueueRef.current.size > 0 || answerSaveInFlightRef.current)) await drainAnswerSaveQueue();
    submitStarted.current = true;
    setBusy(true); setError("");
    try {
      const next = await post("submit_diagnostic");
      setSession(next);
      const report = next.report;
      captureFirstSessionEvent("diagnostic_completed", next.journey.id, { ...commonProperties, set_id: report?.set_id, diagnostic_version: report?.set_id, score: report?.score, ...diagnosticCompletionProperties(report, fromTimer) }, "diagnostic_completed");
    } catch (submitError) {
      submitStarted.current = false;
      setError(submitError.message);
    } finally { setBusy(false); }
  }
  submitDiagnosticRef.current = submitDiagnostic;

  async function openReadingReport() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const viewed = await post("report_viewed");
      setSession(viewed);
      setReportTab("report");
      captureFirstSessionEvent("diagnostic_report_viewed", viewed.journey.id, { ...commonProperties, ...diagnosticReportProperties(viewed.report) }, "diagnostic_report_viewed");
    } catch (reportError) { setError(reportError.message); }
    finally { setBusy(false); }
  }

  function goToHome() {
    if (homeNavigationStarted.current) return;
    homeNavigationStarted.current = true;
    setHomeNavigationPending(true);
    captureFirstSessionEvent("keep_practising_clicked", attemptId, { ...commonProperties, source_screen: reportTab === "review" ? "detailed_review" : "reading_report" }, "keep_practising_clicked");
    try { window.sessionStorage.setItem(`auctor:first-session:home:${userId}`, "1"); } catch { /* Storage may be unavailable. */ }
    router.push("/");
  }

  function openDetailedReview() {
    if (reportTab !== "review") {
      const reviewArea = reviewView === "passage" ? "passage_flow" : "question_autopsy";
      captureFirstSessionEvent("detailed_review_opened", attemptId, { ...commonProperties, review_area: reviewArea }, "detailed_review_opened");
      captureFirstSessionEvent(reviewArea === "passage_flow" ? "passage_flow_viewed" : "question_autopsy_viewed", attemptId, { ...commonProperties, review_area: reviewArea }, reviewArea + "_viewed");
    }
    setReportTab("review");
  }

  function openReviewArea(reviewArea) {
    const changedArea = reviewArea === "passage_flow" ? reviewView !== "passage" : reviewView !== "questions";
    if (changedArea) captureFirstSessionEvent(reviewArea === "passage_flow" ? "passage_flow_viewed" : "question_autopsy_viewed", attemptId, { ...commonProperties, review_area: reviewArea }, reviewArea + "_viewed");
    setReviewView(reviewArea === "passage_flow" ? "passage" : "questions");
  }

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
        <div className="fs-intro-actions"><button className="fs-primary" disabled={busy} onClick={startDiagnostic}>{busy ? "Starting…" : "Start your diagnostic →"}</button><button type="button" className="fs-secondary" onClick={goToHome}>Take me to Home</button></div>
      </section>}

      {phase === "DIAGNOSTIC_IN_PROGRESS" && diagnostic && <section className="fs-test">
        <div className="fs-test-heading"><div><p className="fs-eyebrow">YOUR READING DIAGNOSTIC</p><h1>Reading Diagnostic</h1></div><div className={`fs-timer ${remainingSeconds <= 60 ? "urgent" : ""}`} aria-live="polite"><span>TIME LEFT</span><b>{durationLabel(remainingSeconds)}</b></div></div>
        <div className="fs-test-pane-tabs" role="tablist" aria-label="Diagnostic sections">
          <button type="button" role="tab" id="fs-test-tab-passage" aria-controls="fs-test-panel-passage" aria-selected={testPane === "passage"} className={testPane === "passage" ? "active" : ""} onClick={() => setTestPane("passage")}>Passage</button>
          <button type="button" role="tab" id="fs-test-tab-questions" aria-controls="fs-test-panel-questions" aria-selected={testPane === "questions"} className={testPane === "questions" ? "active" : ""} onClick={() => setTestPane("questions")}>Questions <span>{answers.length}/{questions.length}</span></button>
        </div>
        <div className="fs-test-grid" data-mobile-pane={testPane}>
          <section className="fs-passage-panel" id="fs-test-panel-passage" aria-label="Reading passage" role="tabpanel" aria-labelledby="fs-test-tab-passage" data-pane="passage">
            <div className="fs-panel-label"><span>PASSAGE</span><span>{diagnostic.set.passage.length} paragraphs</span></div>
            <div className="fs-passage-scroll" ref={passageScrollRef}>
              {diagnostic.set.passage.map((paragraph, index) => <p key={index} ref={(element) => { paragraphRefs.current[index] = element; }} data-paragraph-index={index} className="fs-passage-paragraph">{paragraph}</p>)}
            </div>
          </section>
          <section className="fs-question-panel" id="fs-test-panel-questions" aria-label="Diagnostic question" role="tabpanel" aria-labelledby="fs-test-tab-questions" data-pane="questions">
            <div className="fs-panel-label"><span>QUESTION {currentQuestion + 1} OF {questions.length}</span><span>Reading comprehension</span></div>
            <nav className="fs-question-nav" aria-label="Question navigation">{questions.map((question, index) => <button type="button" key={question.id} className={`${index === currentQuestion ? "active" : ""} ${answers.some((answer) => answer.question_id === question.id) ? "answered" : ""}`} onClick={() => setCurrentQuestion(index)} aria-label={`Question ${index + 1}${answers.some((answer) => answer.question_id === question.id) ? ", answered" : ", unanswered"}`} aria-current={index === currentQuestion ? "step" : undefined}>{index + 1}</button>)}</nav>
            {current && <><h2>{current.question_text}</h2><div className="fs-options">{current.options.map((option, index) => <button type="button" key={`${current.id}-${index}`} disabled={remainingSeconds <= 0} aria-pressed={selected === index} className={`fs-option ${selected === index ? "selected" : ""}`} onClick={() => chooseAnswer(current, index)}><span className="fs-option-key">{String.fromCharCode(65 + index)}</span><span>{studentOptionText(option)}</span>{selected === index && <span className="fs-option-check" aria-hidden="true">✓</span>}</button>)}</div>{answerSaveStatus[current.id] === "saving" && <p className="fs-save-status" role="status">Answer selected · saving in the background…</p>}{answerSaveStatus[current.id] === "error" && <p className="fs-save-status error" role="status">We couldn&apos;t save that answer. <button type="button" onClick={() => retryAnswer(current.id)}>Retry</button></p>}</>}
            <div className="fs-question-footer"><span>{answers.length} of {questions.length} answered</span><div><button type="button" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion((value) => Math.max(0, value - 1))}>← Previous</button><button type="button" disabled={currentQuestion === questions.length - 1} onClick={() => setCurrentQuestion((value) => Math.min(questions.length - 1, value + 1))}>Next →</button></div></div>
            <button className="fs-submit" disabled={busy || Object.values(answerSaveStatus).includes("saving")} onClick={() => submitDiagnostic(false)}>{busy ? "Saving your report…" : "Finish diagnostic →"}</button>
          </section>
        </div>
      </section>}

      {phase === "DIAGNOSTIC_COMPLETED" && session?.report && <section className="fs-completion" aria-labelledby="fs-completion-title">
        <img src="/Birbal avatar.jpeg" alt="Birbal" />
        <p className="fs-eyebrow">A NOTE FROM BIRBAL</p>
        <h1 id="fs-completion-title">Well done!</h1>
        <p className="fs-completion-lede">You&apos;ve completed your first reading diagnostic.</p>
        <p className="fs-completion-note">Your personal report is ready, with your answers and passage evidence.</p>
        <button type="button" className="fs-primary" disabled={busy} onClick={openReadingReport}>{busy ? "Preparing your report…" : "See What I Can Improve →"}</button>
      </section>}

      {session?.report && ["DIAGNOSIS_VIEWED", "DAILY_RC_MISSION"].includes(phase) && <section className="fs-report">
        <header className="fs-report-heading">
          <div className="fs-report-heading-copy">
            <p className="fs-eyebrow">YOUR FIRST SESSION</p>
            <h1>Your Reading Report</h1>
            <p>A quick read on your first passage—and what to try next.</p>
          </div>
          <button type="button" className={`fs-primary fs-report-cta-top${homeNavigationPending ? " is-loading" : ""}`} onClick={goToHome} disabled={homeNavigationPending} aria-busy={homeNavigationPending}><span>{homeNavigationPending ? "Taking you to Home…" : "Keep Practising →"}</span>{homeNavigationPending && <i className="fs-home-spinner" aria-hidden="true" />}</button>
        </header>

        <nav className="fs-report-tabs" role="tablist" aria-label="Reading report sections">
          <button id="fs-tab-report" type="button" role="tab" aria-selected={reportTab === "report"} aria-controls="fs-panel-report" className={reportTab === "report" ? "active" : ""} onClick={() => setReportTab("report")}>Reading Report</button>
          <button id="fs-tab-review" type="button" role="tab" aria-selected={reportTab === "review"} aria-controls="fs-panel-review" className={reportTab === "review" ? "active" : ""} onClick={openDetailedReview}>Detailed Review <span>{reportQuestions.length}</span></button>
        </nav>

        {reportTab === "report" && <div id="fs-panel-report" role="tabpanel" aria-labelledby="fs-tab-report">
        <section className="fs-report-hero" aria-label="Your performance">
          <article className="fs-metric-tile correct"><span aria-hidden="true">✓</span><b>{reportCorrect}/{reportTotal}</b><small>Correct</small></article>
          <article className="fs-metric-tile accuracy"><span aria-hidden="true">%</span><b>{reportAccuracy}%</b><small>Accuracy</small></article>
          <article className="fs-metric-tile time"><span aria-hidden="true">◷</span><b>{durationLabel(session.report.time_taken_seconds)}</b><small>Time</small></article>
          <article className="fs-metric-tile attempted"><span aria-hidden="true">↗</span><b>{reportAttempted}/{reportTotal}</b><small>Attempted</small></article>
        </section>

        <section className="fs-birbal-analysis" aria-labelledby="fs-birbal-title">
          <div className="fs-birbal-avatar"><img src="/Birbal avatar.jpeg" alt="Birbal" /></div>
          <div className="fs-birbal-content">
            <p className="fs-eyebrow">BIRBAL&apos;S DIAGNOSIS</p>
            <h2 id="fs-birbal-title">{birbalAnalysis.headline}</h2>
            <p className="fs-birbal-diagnosis">{birbalAnalysis.diagnosis}</p>
          </div>
        </section>

        <section className="fs-reading-analysis" aria-label="How you read this passage">
          <div className="fs-section-heading"><div><p className="fs-eyebrow">HOW YOU MOVED THROUGH THE PASSAGE</p><h2>Reading Replay</h2></div></div>
          <p className="fs-reading-analysis-intro">A visual trace of paragraph movement; screen time cannot confirm attention.</p>
          {passageParagraphs.length > 0 && <ol className="fs-reading-sequence" aria-label="Passage paragraph order">{passageParagraphs.map((_, index) => <li key={index}><span>P{index + 1}</span>{index < passageParagraphs.length - 1 && <i aria-hidden="true" />}</li>)}</ol>}
          {readingAreas.length > 0 ? <>
            <div className="fs-reading-areas">
              {readingAreas.map((area, index) => <article className="fs-reading-area" key={`${area.paragraph_indexes.join("-")}-${index}`}>
                <h3>{formatParagraphGroup(area.paragraph_indexes)}</h3>
                <i className="fs-reading-area-meter" aria-hidden="true"><b style={{ width: `${Math.max(8, (Number(area.visible_ms) / maxReadingAreaMs) * 100)}%` }} /></i>
                <p className="fs-reading-area-time">{visibleTimeLabel(area.visible_ms)} {area.paragraph_indexes.length > 1 ? "together" : "in this part"}</p>
              </article>)}
            </div>
          </> : <p className="fs-reading-analysis-empty">No replay was captured for this attempt.</p>}
        </section>

        <div className="fs-report-checkpoint fs-report-checkpoint-middle"><p>Ready to put this insight to work?</p><button type="button" className={`fs-primary${homeNavigationPending ? " is-loading" : ""}`} onClick={goToHome} disabled={homeNavigationPending} aria-busy={homeNavigationPending}><span>{homeNavigationPending ? "Taking you to Home…" : "Keep Practising →"}</span>{homeNavigationPending && <i className="fs-home-spinner" aria-hidden="true" />}</button></div>

        <section className="fs-analytics-grid" aria-label="Question performance patterns">
          <article className="fs-analytics-block">
            <div className="fs-section-heading"><div><p className="fs-eyebrow">QUESTION TYPES</p><h2>Question Types</h2></div></div>
            <p className="fs-question-types-subtitle"><em>What kinds of questions appeared?</em></p>
            {questionTypeStats.length ? <>
              <div className="fs-chart-legend" aria-label="Question outcome legend">
                <span><i className="correct" />Correct</span>
                <span><i className="incorrect" />Wrong</span>
                <span><i className="unanswered" />Unattempted</span>
              </div>
              <div className="fs-type-chart" aria-label="Question outcomes by type">
                {questionTypeStats.map((row) => <div className="fs-type-row" key={row.label}>
                  <div className="fs-type-label"><b>{row.label}</b></div>
                  <div className="fs-stacked-bar" role="img" aria-label={`${row.label}: ${row.correct} correct, ${row.incorrect} wrong, ${row.unanswered} unattempted`}>
                    {row.correct > 0 && <i className="correct" style={{ width: `${row.correct / row.total * 100}%` }} />}
                    {row.incorrect > 0 && <i className="incorrect" style={{ width: `${row.incorrect / row.total * 100}%` }} />}
                    {row.unanswered > 0 && <i className="unanswered" style={{ width: `${row.unanswered / row.total * 100}%` }} />}
                  </div>
                </div>)}
              </div>
            </> : <p className="fs-data-empty">Question types will appear here when available.</p>}
          </article>
          <article className="fs-analytics-block fs-trap-block">
            <div className="fs-section-heading"><div><p className="fs-eyebrow">ERROR TRAPS</p><h2>Patterns Spotted</h2></div></div>
            {authoredTrapStats.length ? <ol className="fs-trap-ranked-list">{authoredTrapStats.map((row) => {
              const isExpanded = expandedTrap === row.label;
              const explanationId = `fs-trap-explanation-${row.label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              return <li className={`fs-trap-ranked-item${isExpanded ? " is-expanded" : ""}`} key={row.label}>
                <button type="button" className="fs-trap-trigger" aria-expanded={isExpanded} aria-controls={explanationId} onClick={() => setExpandedTrap(isExpanded ? null : row.label)}>
                  <span className="fs-trap-ranked-heading"><b>{displayQuestionType(row.label)}</b><span>{row.questions.map((number) => `Q${number}`).join(" · ")}</span></span>
                  <span className="fs-trap-chevron" aria-hidden="true">⌄</span>
                </button>
                <div className="fs-trap-explanation" id={explanationId} aria-hidden={!isExpanded}>
                  <div className="fs-trap-explanation-inner">
                    <p><b>What this means</b>{row.explanation && <> {row.explanation}</>}</p>
                    <p><b>In simple words</b> {simpleTrapMeaning(row.label)}</p>
                  </div>
                </div>
              </li>;
            })}</ol> : <p className="fs-data-empty">No specific trap was identified in this attempt.</p>}
          </article>
        </section>

        {phase === "DIAGNOSTIC_COMPLETED" || phase === "DIAGNOSIS_VIEWED" || phase === "DAILY_RC_MISSION" ? <section className="fs-mission fs-next-move"><p className="fs-eyebrow">YOUR NEXT MOVE</p><h2>Today&apos;s RC</h2>{session.mission && <div className="fs-mission-meta">Today&apos;s challenge · {session.mission.questions_count || 4} questions · {session.mission.timer_minutes || 8} minutes</div>}<div className="fs-student-offer"><div><span>STUDENT BENEFIT</span><b>20% OFF TODAY</b><small>Use code AUCTOR20 at checkout</small></div><a href="/pricing?coupon=AUCTOR20">View offer →</a></div><button className={`fs-primary${homeNavigationPending ? " is-loading" : ""}`} onClick={goToHome} disabled={homeNavigationPending} aria-busy={homeNavigationPending}><span>{homeNavigationPending ? "Taking you to Home…" : "Keep Practising →"}</span>{homeNavigationPending && <i className="fs-home-spinner" aria-hidden="true" />}</button>{!session.mission && <p className="fs-mission-unavailable">Today&apos;s Daily RC is not published yet. Your diagnostic is saved.</p>}</section> : <div className="fs-next-loading">Preparing your report…</div>}
        </div>}

        {reportTab === "review" && <div id="fs-panel-review" role="tabpanel" aria-labelledby="fs-tab-review" className="fs-review-tab">
          <div className="fs-review-subtabs" role="tablist" aria-label="Detailed review views">
            <button id="fs-review-tab-passage" type="button" role="tab" aria-selected={reviewView === "passage"} aria-controls="fs-review-panel-passage" className={reviewView === "passage" ? "active" : ""} onClick={() => openReviewArea("passage_flow")}>Passage Flow</button>
            <button id="fs-review-tab-questions" type="button" role="tab" aria-selected={reviewView === "questions"} aria-controls="fs-review-panel-questions" className={reviewView === "questions" ? "active" : ""} onClick={() => openReviewArea("question_autopsy")}>Question Autopsy <span>{reportQuestions.length}</span></button>
          </div>
          <div id="fs-review-panel-passage" role="tabpanel" tabIndex={0} aria-labelledby="fs-review-tab-passage" hidden={reviewView !== "passage"}>
          <section className="fs-passage-journey" aria-label="Passage journey">
            <div className="fs-section-heading"><div><p className="fs-eyebrow">PASSAGE FLOW</p><h2>Follow the passage, paragraph by paragraph</h2></div><span>{passageParagraphs.length} paragraphs</span></div>
            <p className="fs-journey-intro">Open a paragraph to read its wording, follow the author&apos;s move, and review useful vocabulary and passage insights.</p>
            {paragraphFlow.length > 0 && <section className="fs-author-flow" aria-label="Author's flow"><h3>Author&apos;s Flow</h3><ol>{paragraphFlow.map((note, index) => {
              const paragraphNumber = Number(note.paragraph || note.paragraphNumber) || index + 1;
              const move = note.transitionType || note.authorMove || note.role;
              const explanation = note.actualMeaning || note.simpleExplanation || note.whyThisParagraphExists;
              if (!move && !explanation) return null;
              return <li key={`${paragraphNumber}-${index}`}><b>Paragraph {paragraphNumber} · {move || "The next step"}</b>{explanation && <span>{explanation}</span>}</li>;
            })}</ol></section>}
            <ol className="fs-paragraph-map">{passageParagraphs.map((paragraph, index) => {
              const excerpt = String(paragraph).trim();
              const note = paragraphFlow.find((item) => Number(item.paragraph || item.paragraphNumber) === index + 1) || paragraphFlow[index] || {};
              const paragraphWords = vocabularyWords.filter((word) => Number(word.paragraph || word.paragraphNumber) === index + 1);
              const authorMove = note.transitionType || note.authorMove || note.role;
              const simpleMeaning = note.simpleExplanation || note.actualMeaning;
              const whyItMatters = note.whyThisParagraphExists || note.whyItMatters;
              return <li key={index}><details><summary><span className="fs-paragraph-number">P{index + 1}</span><span className="fs-paragraph-summary"><span>{excerpt.length > 165 ? `${excerpt.slice(0, 165).trimEnd()}…` : excerpt}</span>{authorMove && <small>{authorMove}</small>}</span><span className="fs-paragraph-open">Open</span></summary><div className="fs-paragraph-detail"><p className="fs-paragraph-source">{paragraph}</p><section className="fs-paragraph-notes"><section><small>WHAT IT SAYS</small><p>{simpleMeaning || excerpt}</p></section>{authorMove && <section className="fs-paragraph-role"><small>AUTHOR&apos;S MOVE</small><p>{authorMove}</p></section>}{whyItMatters && <section><small>WHY IT MATTERS</small><p>{whyItMatters}</p></section>}</section>{paragraphWords.length > 0 && <section className="fs-paragraph-vocabulary"><small>WORDS TO KNOW</small><ul>{paragraphWords.map((word, wordIndex) => <li key={`${word.word || "word"}-${wordIndex}`}><b>{word.word}</b><span>{word.contextualMeaning || word.simpleMeaning || word.meaning}</span></li>)}</ul></section>}</div></details></li>;
            })}</ol>
            {vocabularyWords.some((word) => !Number(word.paragraph || word.paragraphNumber)) && <section className="fs-vocabulary"><div className="fs-section-heading"><div><p className="fs-eyebrow">WORDS IN CONTEXT</p><h3>Useful vocabulary</h3></div><span>Passage notes</span></div><ul>{vocabularyWords.filter((word) => !Number(word.paragraph || word.paragraphNumber)).map((word, index) => { const meaning = word.contextualMeaning || word.simpleMeaning || word.meaning; return <li key={`${word.word || "word"}-${index}`}><div><b>{word.word}</b></div>{meaning && <p>{meaning}</p>}{word.whyAuthorUsedIt && <details><summary>Why the author used it</summary><p>{word.whyAuthorUsedIt}</p></details>}</li>; })}</ul></section>}
          </section>
          </div>

          <div id="fs-review-panel-questions" role="tabpanel" tabIndex={0} aria-labelledby="fs-review-tab-questions" hidden={reviewView !== "questions"}>
          <section className="fs-question-performance" aria-label="Question selector">
            <div className="fs-section-heading"><div><p className="fs-eyebrow">QUESTION AUTOPSY</p><h2>Choose a question</h2></div></div>
            <div className="fs-question-grid" role="group" aria-label="Choose question to review">{reportQuestions.map((question) => <button type="button" key={question.id} aria-pressed={reviewQuestionId === question.id || (!reviewQuestionId && question.order_no === 1)} onClick={() => { setReviewQuestionId(question.id); setMobileAutopsyPane("questions"); }} className={`fs-question-tile ${question.is_correct ? "correct" : question.selected_option === null ? "unanswered" : "incorrect"} ${reviewQuestionId === question.id || (!reviewQuestionId && question.order_no === 1) ? "active" : ""}`}><span className="fs-question-tile-top"><b>Q{question.order_no}</b><strong aria-label={question.is_correct ? "Correct" : question.selected_option === null ? "Unanswered" : "Incorrect"}>{question.is_correct ? "✓" : question.selected_option === null ? "—" : "×"}</strong></span><span className="fs-question-tile-type">{displayQuestionType(question.question_type)}</span></button>)}</div>
          </section>
          <div className="fs-autopsy-mobile-tabs" role="tablist" aria-label="Autopsy content">
            <button type="button" role="tab" aria-selected={mobileAutopsyPane === "passage"} className={mobileAutopsyPane === "passage" ? "active" : ""} onClick={() => setMobileAutopsyPane("passage")}>Passage</button>
            <button type="button" role="tab" aria-selected={mobileAutopsyPane === "questions"} className={mobileAutopsyPane === "questions" ? "active" : ""} onClick={() => setMobileAutopsyPane("questions")}>Questions</button>
          </div>
          {reportQuestions.length > 0 && <div className="fs-autopsy-columns" data-mobile-pane={mobileAutopsyPane}>
            <aside className="fs-review-passage fs-autopsy-passage" aria-label="Passage evidence">
              <header><p className="fs-eyebrow">PASSAGE</p><p>Evidence for Q{selectedReviewQuestion?.order_no || 1}{selectedReviewQuestion?.evidence_line ? " is highlighted in the text." : "."}</p></header>
              <div className="fs-review-passage-scroll">{passageParagraphs.map((paragraph, index) => <p key={index} className={selectedEvidenceParagraph === index ? "evidence-active" : ""}><span className="fs-passage-paragraph-label">P{index + 1}</span><span className="fs-passage-copy">{selectedEvidenceParagraph === index ? renderEvidenceParagraph(paragraph, selectedReviewQuestion?.evidence_line) : paragraph}</span></p>)}</div>
              {selectedEvidenceParagraph < 0 && selectedReviewQuestion?.evidence_line && <blockquote className="fs-review-evidence"><b>Evidence excerpt</b><span>“{selectedReviewQuestion.evidence_line}”</span></blockquote>}
            </aside>
            <article className="fs-question-review fs-autopsy-question" id="fs-question-review">
              {selectedReviewQuestion ? <>
                <div className="fs-question-review-heading"><div><p className="fs-eyebrow">Q{selectedReviewQuestion.order_no} · {displayQuestionType(selectedReviewQuestion.question_type)}</p><h3>{selectedReviewQuestion.question_text}</h3></div><strong className={`fs-review-status ${selectedReviewQuestion.is_correct ? "correct" : selectedReviewQuestion.selected_option === null ? "unanswered" : "incorrect"}`}>{selectedReviewQuestion.is_correct ? "Correct" : selectedReviewQuestion.selected_option === null ? "Unanswered" : "Incorrect"}</strong></div>
                {(selectedReviewQuestion.primary_skill || selectedReviewQuestion.cognitive_error_tested) && <section className="fs-autopsy-tested"><p className="fs-eyebrow">WHAT THIS QUESTION TESTED</p><p>{selectedReviewQuestion.primary_skill || selectedReviewQuestion.question_type}{selectedReviewQuestion.cognitive_error_tested ? ` · ${selectedReviewQuestion.cognitive_error_tested}` : ""}</p></section>}
                <section className="fs-autopsy-outcome" aria-label="What happened">
                  <p className="fs-eyebrow">WHAT HAPPENED</p>
                  <div className="fs-autopsy-answer-line"><span className={selectedReviewQuestion.selected_option === null ? "unanswered" : selectedReviewQuestion.is_correct ? "correct" : "incorrect"}>Your answer</span><span className="correct">Correct answer</span></div>
                  <p className="fs-autopsy-choice"><b>{selectedReviewQuestion.selected_option === null ? "Unanswered" : `${String.fromCharCode(65 + selectedReviewQuestion.selected_option)} · ${selectedReviewQuestion.options[selectedReviewQuestion.selected_option]}`}</b><b>{String.fromCharCode(65 + selectedReviewQuestion.correct_option)} · {selectedReviewQuestion.options[selectedReviewQuestion.correct_option]}</b></p>
                </section>
                <p className="fs-answer-timing">Answer changed: <strong>{selectedReviewQuestion.answer_changes > 0 ? `Yes${selectedReviewQuestion.answer_history?.length > 1 ? ` · ${selectedReviewQuestion.answer_history.map((answer) => String.fromCharCode(65 + answer.selected_option)).join(" → ")}` : ""}` : "No"}</strong> · First answer at <strong>{selectedReviewQuestion.time_to_answer_seconds === null ? "timing unavailable" : durationLabel(selectedReviewQuestion.time_to_answer_seconds)}</strong></p>
                {!selectedReviewQuestion.is_correct && selectedReviewQuestion.selected_option !== null && (selectedReviewQuestion.why_option_tempting || selectedReviewQuestion.why_students_fail) && <section className="fs-autopsy-insight tempting"><p className="fs-eyebrow">WHY YOUR CHOICE LOOKED TEMPTING</p><p>{selectedReviewQuestion.why_option_tempting || selectedReviewQuestion.why_students_fail}</p></section>}
                {!selectedReviewQuestion.is_correct && selectedReviewQuestion.selected_option !== null && (selectedTrapLabel || selectedReviewQuestion.trap_explanation) && <section className="fs-autopsy-insight trap"><p className="fs-eyebrow">THE TRAP</p><p><b>{selectedTrapLabel || "Reasoning trap"}</b>{selectedReviewQuestion.trap_explanation && <span>{selectedReviewQuestion.trap_explanation}</span>}</p></section>}
                <div className="fs-autopsy-explanation-grid">
                  {selectedReviewQuestion.evidence_line && <section className="fs-autopsy-insight evidence"><p className="fs-eyebrow">PASSAGE EVIDENCE</p><p>“{selectedReviewQuestion.evidence_line}”</p><small>{selectedEvidenceParagraph >= 0 ? `Highlighted in paragraph ${selectedEvidenceParagraph + 1} beside this review.` : "See the cited excerpt beside this question."}</small></section>}
                  <section className="fs-autopsy-insight correct"><p className="fs-eyebrow">WHY THE CORRECT ANSWER WORKS</p><p>{selectedReviewQuestion.why_correct || "The keyed answer is shown above; no separate authored explanation is available for this question."}</p></section>
                  <section className="fs-autopsy-insight takeaway"><p className="fs-eyebrow">WHAT TO NOTICE NEXT TIME</p><p>{nextTimeTakeaway}</p></section>
                </div>
                <section className="fs-option-review"><header><p className="fs-eyebrow">OPTION-BY-OPTION REVIEW</p><p>Read the explanation under each choice to see the distinction.</p></header><ol>{selectedReviewQuestion.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isCorrect = index === selectedReviewQuestion.correct_option;
                  const isSelected = index === selectedReviewQuestion.selected_option;
                  const optionExplanation = isCorrect ? null : selectedReviewQuestion.option_explanations?.[index] || (isSelected ? selectedReviewQuestion.selected_option_explanation : null);
                  const optionTrap = isSelected && !isCorrect ? selectedReviewQuestion.trap_type : null;
                  const optionTrapKind = optionTrap ? normalizeTrapType(optionTrap) : null;
                  const trapLabel = optionTrapKind && optionTrapKind !== "Other" ? studentTrapLabel(optionTrap) : optionTrap || null;
                  const optionHeader = <><span className="fs-option-review-heading"><b>{letter}</b><strong>{isCorrect ? "Correct" : "Incorrect"}{isSelected ? " · Your answer" : ""}</strong>{trapLabel && <em>{trapLabel}</em>}</span><span className="fs-option-review-text">{option}</span></>;
                  return <li key={`${selectedReviewQuestion.id}-${letter}`} className={`${isCorrect ? "correct" : "wrong"}${isSelected ? " selected" : ""}`}>
                    <div className="fs-option-review-static">{optionHeader}{optionExplanation && <p className={`fs-option-inline-explanation ${isCorrect ? "correct" : "wrong"}`}><b>{isCorrect ? "Why it works" : "Why it falls short"}</b>{optionExplanation}</p>}{!isCorrect && !optionExplanation && <p className="fs-option-inline-explanation unavailable">No option-specific explanation was saved for this choice.</p>}</div>
                  </li>;
                })}</ol></section>
                <section className="fs-birbal-review"><button type="button" className="fs-ask-birbal" onClick={openBirbalForQuestion}>Ask Birbal about this question <span aria-hidden="true">→</span></button>
                  {birbalChatOpen && <div className="fs-birbal-chat"><header><div><p className="fs-eyebrow">BIRBAL · Q{selectedReviewQuestion.order_no}</p><h4>Discuss this question</h4></div><button type="button" onClick={() => setBirbalChatOpen(false)} aria-label="Close Birbal chat">×</button></header><div className="fs-birbal-chat-messages" aria-live="polite">{birbalChatMessages.map((message, index) => <p key={`${message.role}-${index}`} className={message.role === "user" ? "user" : "assistant"}>{message.content}</p>)}{birbalChatSending && <p className="assistant">Birbal is thinking…</p>}</div>{birbalChatError && <p className="fs-birbal-chat-error" role="alert">{birbalChatError}</p>}<form onSubmit={sendBirbalQuestion}><label className="sr-only" htmlFor="first-session-birbal-input">Ask Birbal about this question</label><textarea id="first-session-birbal-input" rows={2} value={birbalChatInput} onChange={(event) => setBirbalChatInput(event.target.value)} placeholder="Ask about the passage, an option, or the reasoning…"/><button type="submit" disabled={birbalChatSending || !birbalChatInput.trim()}>{birbalChatSending ? "Sending…" : "Ask Birbal"}</button></form></div>}
                </section>
                <footer className="fs-review-pagination"><button type="button" disabled={selectedReviewQuestion.order_no <= 1} onClick={() => setReviewQuestionId(reportQuestions.find((question) => question.order_no === selectedReviewQuestion.order_no - 1)?.id || selectedReviewQuestion.id)}>← Previous</button><span>Q{selectedReviewQuestion.order_no} / {reportQuestions.length}</span><button type="button" disabled={selectedReviewQuestion.order_no >= reportQuestions.length} onClick={() => setReviewQuestionId(reportQuestions.find((question) => question.order_no === selectedReviewQuestion.order_no + 1)?.id || selectedReviewQuestion.id)}>Next →</button></footer>
              </> : <p>No diagnostic questions are available to review.</p>}
            </article>
          </div>}
          </div>
        </div>}
      </section>}
    </div>
  </main>;
}
