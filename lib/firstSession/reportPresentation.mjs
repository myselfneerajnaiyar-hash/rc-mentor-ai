import { normalizeTrapType, trapDescription, trapLesson } from "../bootcamp/traps.mjs";

const FALLBACK_QUESTION_TYPE = "Reading comprehension";

export function summarizeQuestionTypes(questions = []) {
  const groups = new Map();
  for (const question of questions) {
    const rawLabel = question.question_type === FALLBACK_QUESTION_TYPE
      ? question.primary_skill
      : question.question_type || question.primary_skill;
    const label = String(rawLabel || "Type not tagged").trim();
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
