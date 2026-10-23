import test from "node:test";
import assert from "node:assert/strict";
import {
  diagnosticQuestionForClient,
  FIRST_SESSION_DIAGNOSTIC_SET_ID,
  FIRST_SESSION_TIME_LIMIT_SECONDS,
  buildFirstSessionInsight,
  formatParagraphGroup,
  scoreDiagnostic,
  summarizeReadingReplay,
} from "../lib/firstSession/diagnostic.mjs";
import { passageEvidenceMap, summarizeAuthoredTraps, summarizeQuestionTypes } from "../lib/firstSession/reportPresentation.mjs";

const questions = [
  { id: "q1", order_no: 1, question_text: "Which option is supported?", options: ["A", "B", "C", "D"], correct_answer: "2", question_enrichment: { questionType: "Inference", primarySkill: "Scope control", evidenceLine: "The passage says so.", eliminationLogic: { optionB: "Supported by the passage." } } },
  { id: "q2", order_no: 2, question_text: "Which is the main point?", options: ["A", "B", "C", "D"], correct_answer: "4", question_enrichment: { questionType: "Main idea" } },
];

test("pins one CAT PYQ set and an eight-minute server limit", () => {
  assert.equal(FIRST_SESSION_DIAGNOSTIC_SET_ID, "5785e51d-1431-445e-8491-f5f6a2492568");
  assert.equal(FIRST_SESSION_TIME_LIMIT_SECONDS, 480);
});

test("question payload sent before submission excludes answer keys and answer enrichment", () => {
  const payload = diagnosticQuestionForClient(questions[0]);
  assert.deepEqual(payload, {
    id: "q1",
    order_no: 1,
    question_text: "Which option is supported?",
    options: ["A", "B", "C", "D"],
    question_type: "Inference",
  });
  assert.equal(Object.hasOwn(payload, "correct_answer"), false);
  assert.equal(Object.hasOwn(payload, "question_enrichment"), false);
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
  assert.match(insight.meaning, /does not show a recurring habit/);
  assert.match(insight.next_step, /clear support in the passage/);
});

test("report does not claim a profile from a perfect four-question baseline", () => {
  const insight = buildFirstSessionInsight({
    questions: Array.from({ length: 4 }, (_, index) => ({ order_no: index + 1, is_correct: true })),
    replay: { paragraphs: [], observed_visible_ms: 0 },
  });
  assert.match(insight.headline, /You answered 4 of 4 questions correctly/);
  assert.match(insight.meaning, /one passage cannot show whether this result will hold/);
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
      eliminationLogic: { optionA: "This choice overstates the evidence.", optionB: "This choice is supported by the passage." },
    },
  };
  const { reviewedQuestions: [review] } = scoreDiagnostic([question], [{ question_id: "q1", selected_option: 0 }]);
  assert.equal(review.selected_option_explanation, "This choice overstates the evidence.");
  assert.equal(review.why_correct, "This choice is supported by the passage.");
  assert.equal(review.trap_type, "overreach");
  assert.equal(review.trap_explanation, "The distractor expands a limited claim.");
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
