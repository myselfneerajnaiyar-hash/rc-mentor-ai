import test from "node:test";
import assert from "node:assert/strict";
import {
  diagnosticQuestionForClient,
  FIRST_SESSION_DIAGNOSTIC_SET_ID,
  FIRST_SESSION_TIME_LIMIT_SECONDS,
  buildFirstSessionInsight,
  diagnosticQuestionTypeLabel,
  formatParagraphGroup,
  scoreDiagnostic,
  studentOptionText,
  summarizeReadingReplay,
} from "../lib/firstSession/diagnostic.mjs";
import { buildBirbalAnalysis, calculateAccuracyPercentage, displayQuestionType, passageEvidenceMap, summarizeAuthoredTraps, summarizeQuestionTypes } from "../lib/firstSession/reportPresentation.mjs";
import { diagnosticCompletionProperties, diagnosticReportProperties } from "../lib/firstSession/analyticsProperties.mjs";

const questions = [
  { id: "q1", order_no: 1, question_text: "Which option is supported?", options: ["A", "B", "C", "D"], correct_answer: "2", question_enrichment: { questionType: "Inference", primarySkill: "Scope control", evidenceLine: "The passage says so.", eliminationLogic: { optionB: "Supported by the passage." } } },
  { id: "q2", order_no: 2, question_text: "Which is the main point?", options: ["A", "B", "C", "D"], correct_answer: "4", question_enrichment: { questionType: "Main idea" } },
];

test("pins the Keyssar Daily RC set and an eight-minute server limit", () => {
  assert.equal(FIRST_SESSION_DIAGNOSTIC_SET_ID, "43869308-c311-4c07-851d-25383c8ca37d");
  assert.equal(FIRST_SESSION_TIME_LIMIT_SECONDS, 480);
});

test("diagnostic analytics summarize attempted accuracy and question types without question text", () => {
  const report = {
    set_id: "keyssar-v1",
    score: 2,
    total_questions: 4,
    time_taken_seconds: 38,
    questions: [
      { question_type: "Inference", selected_option: 1, is_correct: true },
      { question_type: "Main idea", selected_option: 0, is_correct: false },
      { question_type: "Inference", selected_option: 2, is_correct: true },
      { question_type: "Author purpose", selected_option: null, is_correct: false },
    ],
  };
  assert.deepEqual(diagnosticCompletionProperties(report, true), {
    total_questions: 4,
    correct_count: 2,
    attempted_count: 3,
    unanswered_count: 1,
    accuracy: 66.67,
    time_taken_seconds: 38,
    question_type_performance: [
      { question_type: "Inference", total: 2, attempted: 2, correct: 2, unanswered: 0 },
      { question_type: "Main idea", total: 1, attempted: 1, correct: 0, unanswered: 0 },
      { question_type: "Author purpose", total: 1, attempted: 0, correct: 0, unanswered: 1 },
    ],
    submitted_by_timer: true,
  });
  assert.deepEqual(diagnosticReportProperties(report), {
    set_id: "keyssar-v1",
    diagnostic_version: "keyssar-v1",
    score: 2,
    accuracy: 66.67,
    attempted_count: 3,
    total_questions: 4,
    time_taken_seconds: 38,
  });
  assert.equal(JSON.stringify(diagnosticCompletionProperties(report)).includes("question_text"), false);
});

test("question payload sent before submission excludes answer keys and answer enrichment", () => {
  const payload = diagnosticQuestionForClient(questions[0]);
  assert.deepEqual(payload, {
    id: "q1",
    order_no: 1,
    question_text: "Which option is supported?",
    options: ["A", "B", "C", "D"],
    question_type: "Inference",
    authored_question_type: "Inference",
  });
  assert.equal(Object.hasOwn(payload, "correct_answer"), false);
  assert.equal(Object.hasOwn(payload, "question_enrichment"), false);
});

test("generic MCQ metadata is presented using the authored semantic skill", () => {
  assert.equal(diagnosticQuestionTypeLabel({ questionType: "MCQ", primarySkill: "Inference calibration" }), "Inference");
  assert.equal(diagnosticQuestionTypeLabel({ questionType: "MCQ", primarySkill: "Application logic", secondarySkill: "Counterexample reasoning" }), "Strengthen/Weaken");
  assert.equal(diagnosticQuestionTypeLabel({ questionType: "MCQ", primarySkill: "Author attitude detection", secondarySkill: "Main idea synthesis" }), "Author attitude");
  assert.equal(diagnosticQuestionTypeLabel({ questionType: "Author purpose", primarySkill: "Inference" }), "Author purpose");
});

test("accuracy uses attempted questions as its denominator", () => {
  assert.equal(calculateAccuracyPercentage(2, 3), 66.66);
  assert.equal(calculateAccuracyPercentage(2, 4), 50);
  assert.equal(calculateAccuracyPercentage(0, 0), 0);
});

test("server scoring uses the one-based stored answer key and preserves unanswered questions", () => {
  const report = scoreDiagnostic(questions, [
    { question_id: "q1", selected_option: 1, answered_at: "2026-10-21T10:00:20Z", history: [{ selected_option: 0, at: "2026-10-21T10:00:10Z" }, { selected_option: 1, at: "2026-10-21T10:00:20Z" }] },
  ], "2026-10-21T10:00:00Z");
  assert.equal(report.correct, 1);
  assert.equal(report.reviewedQuestions[0].is_correct, true);
  assert.equal(report.reviewedQuestions[0].correct_option, 1);
  assert.equal(report.reviewedQuestions[0].answer_changes, 1);
  assert.equal(report.reviewedQuestions[0].time_to_answer_seconds, 10);
  assert.equal(report.reviewedQuestions[1].is_correct, false);
  assert.equal(report.reviewedQuestions[1].selected_option, null);
});

test("reading replay reports observed intervals and revisits without claiming attention", () => {
  const replay = summarizeReadingReplay([
    { event_type: "paragraph_entered", paragraph_index: 0, visible_ms: 0 },
    { event_type: "paragraph_left", paragraph_index: 0, visible_ms: 18000 },
    { event_type: "paragraph_entered", paragraph_index: 1, visible_ms: 0 },
    { event_type: "paragraph_left", paragraph_index: 1, visible_ms: 9000 },
    { event_type: "paragraph_entered", paragraph_index: 0, visible_ms: 0 },
    { event_type: "paragraph_left", paragraph_index: 0, visible_ms: 4000 },
  ]);
  assert.equal(replay.observed_visible_ms, 31000);
  assert.equal(replay.revisit_count, 1);
  assert.deepEqual(replay.paragraphs, [
    { paragraph_index: 0, visible_ms: 22000, visits: 2 },
    { paragraph_index: 1, visible_ms: 9000, visits: 1 },
  ]);
});

test("report insight distinguishes a recorded answer change from a possible explanation", () => {
  const insight = buildFirstSessionInsight({
    questions: [{
      order_no: 3,
      is_correct: false,
      selected_option: 3,
      answer_history: [
        { selected_option: 1, is_correct: true },
        { selected_option: 3, is_correct: false },
      ],
    }],
  });
  assert.match(insight.headline, /You answered 0 of 1 questions correctly/);
  assert.match(insight.evidence, /first choice \(B\) was correct\. Changing it to D made it incorrect/);
  assert.match(insight.meaning, /one useful moment from your first session/);
  assert.match(insight.next_step, /clear support in the passage/);
});

test("report does not claim a profile from a perfect four-question baseline", () => {
  const insight = buildFirstSessionInsight({
    questions: Array.from({ length: 4 }, (_, index) => ({ order_no: index + 1, is_correct: true })),
    replay: { paragraphs: [], observed_visible_ms: 0 },
  });
  assert.match(insight.headline, /You answered 4 of 4 questions correctly/);
  assert.match(insight.meaning, /useful starting point/);
});

test("student insight stays focused on answers even when viewport data is present", () => {
  const insight = buildFirstSessionInsight({
    questions: Array.from({ length: 4 }, (_, index) => ({ order_no: index + 1, is_correct: true })),
    replay: {
      observed_visible_ms: 38000,
      groups: [{ paragraph_indexes: [0, 1], visible_ms: 30000, intervals: 2 }],
    },
  });
  assert.match(insight.headline, /You answered 4 of 4 questions correctly/);
  assert.doesNotMatch(`${insight.headline} ${insight.evidence} ${insight.meaning} ${insight.next_step}`, /viewport|interval|visible|replay/i);
});

test("grouped replay counts each mutually exclusive viewport interval once and keeps co-visible paragraphs together", () => {
  const replay = summarizeReadingReplay([
    { event_type: "viewport_interval", visible_paragraph_indexes: [0, 1], interval_id: "a", visible_ms: 12000 },
    { event_type: "viewport_interval", visible_paragraph_indexes: [1, 0], interval_id: "a", visible_ms: 8000 },
    { event_type: "viewport_interval", visible_paragraph_indexes: [2], interval_id: "b", visible_ms: 5000 },
  ]);
  assert.equal(replay.observed_visible_ms, 25000);
  assert.equal(replay.grouping_available, true);
  assert.deepEqual(replay.groups, [
    { paragraph_indexes: [0, 1], visible_ms: 20000, intervals: 1 },
    { paragraph_indexes: [2], visible_ms: 5000, intervals: 1 },
  ]);
  assert.equal(formatParagraphGroup([0, 1]), "Paragraphs 1–2");
});

test("invalid answer keys fail closed rather than producing a fabricated score", () => {
  assert.throws(() => scoreDiagnostic([{ ...questions[0], correct_answer: "0" }], []), /answer key is invalid/);
});

test("report presentation charts preserve outcome counts and use only authored trap labels", () => {
  const reviewed = [
    { order_no: 1, question_type: "Inference", selected_option: 0, is_correct: true, trap_type: "overreach" },
    { order_no: 2, question_type: "Inference", primary_skill: "Scope control", selected_option: 1, is_correct: false, trap_type: "scope shift" },
    { order_no: 3, question_type: "Main idea", selected_option: null, is_correct: false, trap_type: "partial truth" },
    { order_no: 4, question_type: "Reading comprehension", selected_option: 2, is_correct: false, trap_type: null },
  ];
  assert.deepEqual(summarizeQuestionTypes(reviewed), [
    { label: "Inference", correct: 1, incorrect: 1, unanswered: 0, total: 2 },
    { label: "Main idea", correct: 0, incorrect: 0, unanswered: 1, total: 1 },
    { label: "Type not tagged", correct: 0, incorrect: 1, unanswered: 0, total: 1 },
  ]);
  assert.deepEqual(summarizeAuthoredTraps(reviewed), [{ label: "scope shift", count: 1, questions: [2], explanation: "You move the claim to a different subject, condition, or level of scope.", lesson: "Match the option’s subject and scope to the question and the passage’s claim." }]);
});

test("question review exposes only the saved selected-option and authored trap explanations", () => {
  const question = {
    ...questions[0],
    question_enrichment: {
      ...questions[0].question_enrichment,
      trapType: "overreach",
      authorTrapMechanism: "The distractor expands a limited claim.",
      whyOptionWasTempting: "It repeats a familiar phrase from the passage.",
      nextTimeTakeaway: "Check the option against the complete claim, not one familiar phrase.",
      eliminationLogic: { optionA: "This choice overstates the evidence.", optionB: "This choice is supported by the passage." },
    },
  };
  const { reviewedQuestions: [review] } = scoreDiagnostic([question], [{ question_id: "q1", selected_option: 0 }]);
  assert.equal(review.selected_option_explanation, "This choice overstates the evidence.");
  assert.equal(review.why_correct, "This choice is supported by the passage.");
  assert.equal(review.trap_type, "overreach");
  assert.equal(review.trap_explanation, "The distractor expands a limited claim.");
  assert.equal(review.why_option_tempting, "It repeats a familiar phrase from the passage.");
  assert.equal(review.next_time_takeaway, "Check the option against the complete claim, not one familiar phrase.");
  assert.deepEqual(review.option_explanations, [
    "This choice overstates the evidence.",
    "This choice is supported by the passage.",
    null,
    null,
  ]);
});

test("student-facing options preserve the authored wording and casing", () => {
  assert.equal(studentOptionText("  owing to migrations, the pattern changed."), "  owing to migrations, the pattern changed.");
  assert.equal(studentOptionText("NASA changed its approach."), "NASA changed its approach.");
  assert.equal(studentOptionText({ text: "the calls have changed." }), "the calls have changed.");
});

test("passage map links only saved evidence excerpts that occur in source paragraphs", () => {
  const map = passageEvidenceMap(
    ["The author distinguishes visible evidence from attention.", "A second paragraph adds another example."],
    [
      { order_no: 1, evidence_line: "visible evidence from attention" },
      { order_no: 2, evidence_line: "missing phrase that is not present" },
      { order_no: 3, evidence_line: null },
    ],
  );
  assert.deepEqual(map, [[{ question_number: 1, text: "visible evidence from attention" }], []]);
});

test("Birbal turns a very fast first session into a cautious pacing insight", () => {
  const analysis = buildBirbalAnalysis({
    total_questions: 4,
    time_taken_seconds: 15,
    passage_word_count: 338,
    questions: [
      { order_no: 1, question_type: "Application", selected_option: 0, is_correct: true },
      { order_no: 2, question_type: "Inference", selected_option: 1, is_correct: false, trap_type: "overreach", trap_explanation: "The choice extends the claim beyond the passage." },
      { order_no: 3, question_type: "Inference", selected_option: 2, is_correct: false },
      { order_no: 4, question_type: "Summary", selected_option: null, is_correct: false },
    ],
  });
  assert.equal(analysis.headline, "Slow down before you solve.");
  assert.match(analysis.diagnosis, /4-question diagnostic in 15 seconds/);
  assert.match(analysis.diagnosis, /338-word, 4-question diagnostic in 15 seconds/);
  assert.match(analysis.diagnosis, /too fast to reliably read and process the passage and questions/);
  assert.match(analysis.diagnosis, /pacing signal, not a judgment about your ability/);
  assert.doesNotMatch(analysis.diagnosis, /Q\d|overreach|selected option|correct option|evidence line/i);
  assert.ok(analysis.diagnosis.match(/[.!?](?:\s|$)/g).length <= 4);
  assert.equal(displayQuestionType("inference"), "Inference");
});
