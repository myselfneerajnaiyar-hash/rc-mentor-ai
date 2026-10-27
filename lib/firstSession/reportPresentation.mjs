import { normalizeTrapType, trapDescription, trapLesson } from "../bootcamp/traps.mjs";

const FALLBACK_QUESTION_TYPE = "Reading comprehension";

export function displayQuestionType(value) {
  return String(value || FALLBACK_QUESTION_TYPE).trim().replace(/^([a-z])/, (letter) => letter.toLocaleUpperCase());
}

export function calculateAccuracyPercentage(correct, attempted) {
  const denominator = Math.max(0, Number(attempted) || 0);
  if (denominator === 0) return 0;
  const numerator = Math.max(0, Number(correct) || 0);
  return Math.floor((numerator / denominator) * 10000) / 100;
}

export function summarizeQuestionTypes(questions = []) {
  const groups = new Map();
  for (const question of questions) {
    const rawLabel = question.question_type === FALLBACK_QUESTION_TYPE
      ? question.primary_skill
      : question.question_type || question.primary_skill;
    const label = displayQuestionType(rawLabel || "Type not tagged");
    const row = groups.get(label) || { label, correct: 0, incorrect: 0, unanswered: 0, total: 0 };
    row.total += 1;
    if (question.selected_option === null || question.selected_option === undefined) row.unanswered += 1;
    else if (question.is_correct) row.correct += 1;
    else row.incorrect += 1;
    groups.set(label, row);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function summarizeAuthoredTraps(questions = []) {
  const groups = new Map();
  for (const question of questions) {
    if (question.selected_option === null || question.selected_option === undefined || question.is_correct) continue;
    const label = String(question.trap_type || "").trim();
    if (!label) continue;
    const canonical = normalizeTrapType(label);
    const explanation = question.trap_explanation || (canonical && canonical !== "Other" ? trapDescription(canonical) : null);
    if (!explanation) continue;
    const row = groups.get(label) || { label, count: 0, questions: [], explanation, lesson: question.trap_next_step || trapLesson(canonical) || null };
    row.count += 1;
    row.questions.push(question.order_no);
    groups.set(label, row);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function passageEvidenceMap(passage = [], questions = []) {
  return passage.map((paragraph) => {
    const normalizedParagraph = String(paragraph).toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const evidence = questions.flatMap((question) => {
      const source = String(question.evidence_line || "").trim();
      if (!source) return [];
      const normalizedEvidence = source.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const excerpt = normalizedEvidence.split(/\s+/).slice(0, 8).join(" ");
      if (!normalizedParagraph.includes(normalizedEvidence) && !(excerpt.length >= 12 && normalizedParagraph.includes(excerpt))) return [];
      return [{ question_number: question.order_no, text: source }];
    });
    return evidence;
  });
}

export function buildBirbalAnalysis(report) {
  const questions = Array.isArray(report?.questions) ? report.questions : [];
  const incorrect = questions.filter((question) => question.selected_option !== null && question.selected_option !== undefined && !question.is_correct);
  const unanswered = questions.filter((question) => question.selected_option === null || question.selected_option === undefined);
  const correct = questions.filter((question) => question.is_correct);
  const attempted = questions.length - unanswered.length;
  const total = questions.length || Number(report?.total_questions) || 0;
  const seconds = Number(report?.time_taken_seconds);
  const passageWordCount = Number(report?.passage_word_count);
  const veryFast = total > 0 && Number.isFinite(seconds) && seconds > 0 && seconds / total <= 8;
  const elapsed = seconds < 60
    ? `${seconds} seconds`
    : `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) === 1 ? "" : "s"}${seconds % 60 ? ` ${seconds % 60} seconds` : ""}`;
  const missedTypes = [...new Set(incorrect.map((question) => question.question_type || question.primary_skill).filter(Boolean))];
  let headline;
  let diagnosis;
  if (veryFast) {
    headline = "Slow down before you solve.";
    diagnosis = Number.isFinite(passageWordCount) && passageWordCount > 0
      ? `You finished a ${passageWordCount}-word, ${total}-question diagnostic in ${elapsed}. That is too fast to reliably read and process the passage and questions. Give the text and each question more time next round; treat this as a pacing signal, not a judgment about your ability.`
      : `You finished a ${total}-question diagnostic in ${elapsed}. That is very fast for a passage-based session, so you may not have had enough time to read and process the questions fully. Give the passage and each question more time next round; this is an early signal, not a conclusion about your ability.`;
  } else if (unanswered.length) {
    headline = "Make room to come back.";
    diagnosis = "A question was left unanswered. Try marking a difficult one and returning to it before you finish; one short session is only an early pacing signal.";
  } else if (incorrect.length && missedTypes.length === 1) {
    headline = "Check the passage before choosing.";
    diagnosis = `Your missed answer touched ${displayQuestionType(missedTypes[0])}. Use Detailed Review to check the passage evidence, then see whether that skill feels easier next time. One short diagnostic cannot confirm a pattern.`;
  } else if (incorrect.length) {
    headline = "Build a steadier answer check.";
    diagnosis = "A few choices did not hold up against the passage. In Detailed Review, compare each choice with the text; one short diagnostic is not enough to call this a pattern.";
  } else {
    headline = "Build on this start.";
    diagnosis = "You completed the passage without a missed answer. Keep the same deliberate pace in today’s RC and see how it holds across another passage.";
  }
  return {
    headline,
    what_happened: `You got ${correct.length}/${questions.length} correct, answered ${attempted}/${questions.length}, and left ${unanswered.length} unanswered.`,
    diagnosis,
  };
}
