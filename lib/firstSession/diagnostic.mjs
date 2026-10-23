export const FIRST_SESSION_DIAGNOSTIC_SET_ID = "5785e51d-1431-445e-8491-f5f6a2492568";
export const FIRST_SESSION_TIME_LIMIT_SECONDS = 480;
import { normalizeTrapType, trapDescription } from "../bootcamp/traps.mjs";

export function diagnosticQuestionForClient(question) {
  return {
    id: question.id,
    order_no: question.order_no,
    question_text: question.question_text,
    options: Array.isArray(question.options) ? question.options : [],
    question_type: question.question_enrichment?.questionType || null,
  };
}

export function scoreDiagnostic(questions, answers, startedAt = null) {
  const byId = new Map((answers || []).map((answer) => [answer.question_id, answer]));
  let correct = 0;
  const reviewedQuestions = questions.map((question) => {
    const answer = byId.get(question.id);
    const selected = Number(answer?.selected_option);
    const selectedIndex = Number.isInteger(selected) && selected >= 0 && selected < 4 ? selected : null;
    const keyedAnswer = Number(question.correct_answer);
    if (!Number.isInteger(keyedAnswer) || keyedAnswer < 1 || keyedAnswer > 4) throw new Error("Diagnostic answer key is invalid.");
    const correctIndex = keyedAnswer - 1;
    const isCorrect = selectedIndex !== null && selectedIndex === correctIndex;
    if (isCorrect) correct += 1;
    const enrichment = question.question_enrichment || {};
    const firstAnswerAt = answer?.history?.[0]?.at || answer?.answered_at;
    const timeToAnswerSeconds = startedAt && firstAnswerAt
      ? Math.max(0, Math.round((new Date(firstAnswerAt).getTime() - new Date(startedAt).getTime()) / 1000))
      : null;
    return {
      id: question.id,
      order_no: question.order_no,
      question_text: question.question_text,
      options: question.options,
      selected_option: selectedIndex,
      correct_option: correctIndex,
      is_correct: isCorrect,
      answered_at: answer?.answered_at || null,
      time_to_answer_seconds: timeToAnswerSeconds,
      answer_changes: Math.max(0, (answer?.history?.length || 0) - 1),
      answer_history: (answer?.history || (answer ? [{ selected_option: answer.selected_option, at: answer.answered_at }] : [])).map((entry) => ({
        selected_option: Number(entry.selected_option),
        at: entry.at || null,
        is_correct: Number(entry.selected_option) === correctIndex,
      })),
      question_type: enrichment.questionType || enrichment.primarySkill || "Reading comprehension",
      primary_skill: enrichment.primarySkill || null,
      cognitive_error_tested: enrichment.cognitiveErrorTested || null,
      evidence_line: enrichment.evidenceLine || null,
      why_correct: enrichment.whatCorrectOptionDoesBetter || enrichment.eliminationLogic?.[`option${String.fromCharCode(65 + correctIndex)}`] || null,
      why_students_fail: enrichment.whyStudentsFail || null,
      trap_type: enrichment.trapType || null,
      selected_option_explanation: selectedIndex === null ? null : enrichment.eliminationLogic?.[`option${String.fromCharCode(65 + selectedIndex)}`] || null,
      trap_explanation: enrichment.authorTrapMechanism || enrichment.trapExplanation || trapDescription(normalizeTrapType(enrichment.trapType)) || null,
    };
  });
  return { correct, reviewedQuestions };
}

export function buildFirstSessionInsight(report) {
  const questions = Array.isArray(report?.questions) ? report.questions : [];
  const correct = questions.filter((question) => question.is_correct).length;
  const attempted = questions.filter((question) => question.selected_option !== null && question.selected_option !== undefined).length;
  const result = questions.length === 0
    ? "No questions were available to score."
    : `You answered ${correct} of ${questions.length} questions correctly.`;
  const changedFromCorrect = questions.find((question) => question.answer_history?.length > 1
    && question.answer_history[0].is_correct
    && question.answer_history.at(-1).is_correct === false);
  if (changedFromCorrect) {
    const first = changedFromCorrect.answer_history[0].selected_option;
    const final = changedFromCorrect.selected_option;
    return {
      headline: result,
      evidence: `On question ${changedFromCorrect.order_no}, your first choice (${String.fromCharCode(65 + first)}) was correct. Changing it to ${String.fromCharCode(65 + final)} made it incorrect.`,
      meaning: "One answer change does not show a recurring habit. As you complete more passages, Auctor can identify repeated reading patterns and common errors more accurately.",
      next_step: "Before changing an answer, check that the new choice has clear support in the passage.",
    };
  }

  const missed = questions.filter((question) => !question.is_correct);
  if (missed.length) {
    return {
      headline: result,
      evidence: `${missed.length} ${missed.length === 1 ? "answer needs" : "answers need"} review: ${missed.map((question) => `Q${question.order_no}${question.selected_option === null ? " unanswered" : " incorrect"}`).join(" · ")}.`,
      meaning: "This first passage shows which answers need review, but it is too small a sample to show whether the same errors happen regularly. More practice will help Auctor identify recurring reading patterns and common errors more accurately.",
      next_step: "Before choosing an option, find the paragraph that supports it and check that the option stays within what the passage says.",
    };
  }

  return {
    headline: result,
    evidence: attempted === questions.length
      ? `You attempted all ${questions.length} questions.`
      : `You attempted ${attempted} of ${questions.length} questions.`,
    meaning: "This is a useful starting point, but one passage cannot show whether this result will hold across other topics and question types. More practice will help Auctor identify recurring reading patterns and common errors more accurately.",
    next_step: "Keep locating the paragraph that supports your answer before choosing an option.",
  };
}

export function summarizeReadingReplay(events = []) {
  const byParagraph = new Map();
  const grouped = new Map();
  const intervalDurations = new Map();
  const hasGroupedTelemetry = events.some((event) => event.event_type === "viewport_interval" && Array.isArray(event.visible_paragraph_indexes));
  for (const event of events) {
    if (event.event_type === "viewport_interval" && Array.isArray(event.visible_paragraph_indexes)) {
      const indexes = [...new Set(event.visible_paragraph_indexes.map(Number).filter((index) => Number.isInteger(index) && index >= 0 && index <= 20))].sort((a, b) => a - b);
      if (!indexes.length) continue;
      const groupKey = indexes.join(",");
      const current = grouped.get(groupKey) || { paragraph_indexes: indexes, visible_ms: 0, intervals: 0 };
      const duration = Math.max(0, Number(event.visible_ms) || 0);
      current.visible_ms += duration;
      grouped.set(groupKey, current);
      const intervalKey = `${groupKey}:${event.interval_id || event.captured_at || "legacy"}`;
      intervalDurations.set(intervalKey, (intervalDurations.get(intervalKey) || 0) + duration);
      continue;
    }
    const current = byParagraph.get(event.paragraph_index) || { paragraph_index: event.paragraph_index, visible_ms: 0, visits: 0 };
    current.visible_ms += Math.max(0, Number(event.visible_ms) || 0);
    if (event.event_type === "paragraph_entered") current.visits += 1;
    byParagraph.set(event.paragraph_index, current);
  }
  const paragraphs = [...byParagraph.values()].sort((a, b) => a.paragraph_index - b.paragraph_index);
  const groups = hasGroupedTelemetry
    ? [...grouped.entries()].map(([key, group]) => ({ ...group, intervals: [...intervalDurations.keys()].filter((interval) => interval.startsWith(`${key}:`)).length })).sort((a, b) => b.visible_ms - a.visible_ms)
    : paragraphs.filter((item) => item.visible_ms > 0).map((item) => ({ paragraph_indexes: [item.paragraph_index], visible_ms: item.visible_ms, intervals: item.visits }));
  return {
    observed_visible_ms: hasGroupedTelemetry ? [...grouped.values()].reduce((sum, item) => sum + item.visible_ms, 0) : paragraphs.reduce((sum, item) => sum + item.visible_ms, 0),
    revisit_count: hasGroupedTelemetry ? groups.reduce((sum, item) => sum + Math.max(0, item.intervals - 1), 0) : paragraphs.reduce((sum, item) => sum + Math.max(0, item.visits - 1), 0),
    paragraphs,
    groups,
    grouping_available: hasGroupedTelemetry,
    events,
  };
}

export function formatParagraphGroup(indexes = []) {
  const sorted = [...new Set(indexes)].sort((a, b) => a - b);
  const numbers = sorted.map((index) => index + 1);
  if (numbers.length === 0) return "No paragraph recorded";
  if (numbers.length === 1) return `Paragraph ${numbers[0]}`;
  const contiguous = numbers.every((number, index) => index === 0 || number === numbers[index - 1] + 1);
  return contiguous ? `Paragraphs ${numbers[0]}–${numbers.at(-1)}` : `Paragraphs ${numbers.join(", ")}`;
}
