import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const base = process.env.FIRST_SESSION_TEST_BASE_URL || "http://localhost:3212";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "first-session browser check must use a local app");
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL is available to seed a local browser session");
const executablePath = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean).find(existsSync);
assert.ok(executablePath, "Set CHROME_PATH to a local Chrome or Edge executable");

const userId = "11111111-1111-4111-8111-111111111111";
const attemptId = "22222222-2222-4222-8222-222222222222";
const setId = "33333333-3333-4333-8333-333333333333";
const user = { id: userId, email: "first-session-browser@example.test", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {} };
const authSession = { access_token: "local-first-session-browser-token", refresh_token: "local-first-session-refresh", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
const passage = ["P1: The first paragraph establishes a careful distinction between what readers can observe and what they may infer. ".repeat(10), "P2: The second paragraph develops that distinction with a historical example. ".repeat(10), "P3: The third paragraph introduces a competing explanation and tests its limits. ".repeat(10), "P4: The fourth paragraph considers what the evidence can support. ".repeat(10), "P5: The final paragraph states the author's qualified conclusion. ".repeat(10)];
const questions = Array.from({ length: 4 }, (_, index) => ({
  id: `q${index + 1}`,
  order_no: index + 1,
  question_text: `Browser fixture question ${index + 1}: which statement is supported?`,
  options: ["A supported claim", "A broader unsupported claim", "An unrelated claim", "A claim that reverses the passage"],
  question_type: ["Inference", "Main idea", "Evidence application", "Inference"][index],
  primary_skill: ["Scope control", "Central idea", "Evidence matching", "Qualified inference"][index],
}));
const answers = [];
const seenActions = [];
let profile = { user_id: userId, profile_completed: true };
let phase = "DIAGNOSTIC_NOT_STARTED";
let journeyRequired = true;
const diagnosticStartedAt = Date.now();

function makeReport() {
  const reviewedQuestions = questions.map((question, index) => {
    const answer = answers.find((row) => row.question_id === question.id);
    return {
      ...question,
      selected_option: answer?.selected_option ?? null,
      correct_option: 0,
      is_correct: answer?.selected_option === 0,
      time_to_answer_seconds: answer ? 22 + index * 7 : null,
      answer_changes: 0,
      answer_history: answer ? [{ selected_option: answer.selected_option, is_correct: answer.selected_option === 0 }] : [],
      evidence_line: [
        "careful distinction between what readers can observe",
        "develops that distinction with a historical example",
        "introduces a competing explanation and tests its limits",
        "considers what the evidence can support",
      ][index],
      why_correct: "The correct option stays within the passage's stated scope.",
      primary_skill: question.primary_skill,
      trap_type: index === 1 ? "overreach" : index === 2 ? "partial truth" : null,
      trap_explanation: index === 1 ? "This option extends the claim beyond the passage." : index === 2 ? "This option uses only part of the stated evidence." : null,
      selected_option_explanation: answer && answer.selected_option !== 0 ? "This selected option adds a claim the cited paragraph does not support." : null,
      why_students_fail: "A plausible option can sound related while adding a claim the passage does not establish.",
    };
  });
  return {
    set_id: setId,
    source_year: "2024",
    score: reviewedQuestions.filter((question) => question.is_correct).length,
    total_questions: questions.length,
    time_taken_seconds: 104,
    passage,
    passage_enrichment: {
      passageFlow: passage.map((_, index) => ({ paragraph: index + 1, transitionType: ["Introduces a distinction", "Adds an example", "Tests an explanation", "Limits the evidence", "States a qualified conclusion"][index], actualMeaning: ["Readers can observe something without knowing what it proves.", "A historical example develops that distinction.", "An alternative explanation is tested against evidence.", "The limits of the evidence are made explicit.", "The conclusion stays qualified by the evidence."][index], whyThisParagraphExists: `It develops the passage's argument at step ${index + 1}.`, simpleExplanation: `The author uses this paragraph to move the argument forward at step ${index + 1}.` })),
      vocabulary: [{ word: "distinction", contextualMeaning: "A difference between two ideas.", whyAuthorUsedIt: "It names the contrast the passage examines.", paragraph: 1 }, { word: "qualified", contextualMeaning: "Limited or cautious in scope.", whyAuthorUsedIt: "It describes the careful conclusion.", paragraph: 5 }],
    },
    replay: {
      observed_visible_ms: 91000,
      revisit_count: 2,
      grouping_available: true,
      groups: [
        { paragraph_indexes: [0, 1], visible_ms: 20000, intervals: 1 },
        { paragraph_indexes: [2], visible_ms: 29000, intervals: 2 },
        { paragraph_indexes: [3], visible_ms: 14000, intervals: 1 },
        { paragraph_indexes: [4], visible_ms: 28000, intervals: 2 },
      ],
      paragraphs: [
        { paragraph_index: 0, visible_ms: 11000, visits: 1 },
        { paragraph_index: 1, visible_ms: 16000, visits: 1 },
        { paragraph_index: 2, visible_ms: 29000, visits: 2 },
        { paragraph_index: 3, visible_ms: 14000, visits: 1 },
        { paragraph_index: 4, visible_ms: 21000, visits: 2 },
      ],
    },
    questions: reviewedQuestions,
  };
}

function responseForSession() {
  const journey = {
    id: attemptId,
    user_id: userId,
    phase,
    diagnostic_set_id: setId,
    diagnostic_started_at: new Date(diagnosticStartedAt).toISOString(),
    diagnostic_deadline_at: new Date(diagnosticStartedAt + 8 * 60 * 1000).toISOString(),
  };
  const diagnostic = {
    set: { id: setId, title: "CAT 2024 Slot 1 RC", source_year: "2024", passage, passage_enrichment: makeReport().passage_enrichment },
    questions,
  };
  const report = ["DIAGNOSTIC_COMPLETED", "DIAGNOSIS_VIEWED", "DAILY_RC_MISSION"].includes(phase) ? makeReport() : null;
  return {
    required: true,
    server_now: new Date().toISOString(),
    journey,
    diagnostic,
    answers: answers.map((answer) => ({ ...answer, history: [{ selected_option: answer.selected_option, at: "2026-10-21T10:00:22.000Z" }] })),
    report,
    mission: phase === "DIAGNOSTIC_NOT_STARTED" || phase === "DIAGNOSTIC_IN_PROGRESS" ? null : { id: "44444444-4444-4444-8444-444444444444", timer_minutes: 8 },
  };
}

function json(route, body, status = 200) {
  return route.fulfill({ status, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
}

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
await context.addInitScript(({ ref, session }) => localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session)), { ref: projectRef, session: authSession });
let signupRequested = false;
await context.route("**/api/first-session", async (route) => {
  const request = route.request();
  if (request.method() === "GET") return json(route, { ...responseForSession(), required: journeyRequired });
  const { action } = request.postDataJSON();
  seenActions.push(action);
  if (action === "start_diagnostic") phase = "DIAGNOSTIC_IN_PROGRESS";
  if (action === "answer") {
    const body = request.postDataJSON();
    const prior = answers.find((answer) => answer.question_id === body.question_id);
    if (prior) prior.selected_option = body.selected_option;
    else answers.push({ question_id: body.question_id, selected_option: body.selected_option });
  }
  if (action === "submit_diagnostic") phase = "DIAGNOSTIC_COMPLETED";
  if (action === "report_viewed") phase = "DIAGNOSIS_VIEWED";
  if (action === "start_mission") phase = "DAILY_RC_MISSION";
  return json(route, {
    ...responseForSession(),
    mission: phase === "DIAGNOSIS_VIEWED" || phase === "DAILY_RC_MISSION" ? { id: "44444444-4444-4444-8444-444444444444", timer_minutes: 8 } : null,
    challenge_date: "2026-10-21",
  });
});
await context.route("**/api/tenant-context", (route) => json(route, {
  tenant: { kind: "b2c", hostname: "localhost" },
  branding: { brandName: "Auctor", logoUrl: "/logo.png", faviconUrl: "/icon-192.png", primaryColor: "#4f46e5", secondaryColor: "#0ea5e9", isInstitute: false },
}));
await context.route("**/api/session-context", (route) => json(route, {
  user,
  profile: profile || { user_id: userId, profile_completed: false },
  tenant: { kind: "b2c", hostname: "localhost" },
  branding: { brandName: "Auctor", logoUrl: "/logo.png", faviconUrl: "/icon-192.png", primaryColor: "#4f46e5", secondaryColor: "#0ea5e9", isInstitute: false },
  exam: "CAT",
  capabilities: { exam: "CAT", isCAT: true, showDailyRC: true, showCATSectionals: true },
  entitlement: { kind: "none", hasAccess: false, isPremium: false, isInstituteStudent: false, hasCATSectionalAccess: false },
}));
await context.route("**/rest/v1/profiles*", async (route) => {
  const request = route.request();
  if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": request.headers().origin || new URL(base).origin, "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS", "access-control-allow-headers": "*" } });
  if (request.method() === "GET") return json(route, profile ? [profile] : []);
  const data = request.postDataJSON();
  const row = Array.isArray(data) ? data[0] : data;
  profile = { ...(profile || {}), ...row, profile_completed: true };
  return route.fulfill({ status: request.method() === "POST" ? 201 : 204, headers: { "content-type": "application/json", "access-control-allow-origin": request.headers().origin || new URL(base).origin }, body: request.method() === "POST" ? "[]" : "" });
});
await context.route("**/api/send-welcome-email", (route) => json(route, { ok: true }));
await context.route("**/api/conversions/signup", (route) => json(route, { ok: true }));
await context.route("**/auth/v1/**", (route) => {
  if (new URL(route.request().url()).pathname.endsWith("/auth/v1/signup")) {
    signupRequested = true;
    return json(route, { ...user, ...authSession });
  }
  return json(route, user);
});
await context.route("**/e/**", (route) => route.fulfill({ status: 200, body: "{}" }));

const page = await context.newPage();
const runtimeErrors = [];
const screenshotDir = process.env.FIRST_SESSION_SCREENSHOT_DIR;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });
const capture = async (name, locator = page.locator(".fs-screen")) => {
  if (!screenshotDir) return;
  if (locator) await locator.screenshot({ path: join(screenshotDir, name) });
  else await page.screenshot({ path: join(screenshotDir, name) });
};
page.on("pageerror", (error) => runtimeErrors.push(error.message));
try {
  // Recreate the completed-profile welcome state with a stale first-session
  // response. The Start CTA's fresh authorization-aware check must take the
  // user straight into the diagnostic rather than opening the dashboard/tour.
  journeyRequired = false;
  await page.goto(`${base}/welcome`);
  await page.getByRole("button", { name: "Start Your RC Journey" }).waitFor({ timeout: 10000 }).catch(async () => {
    throw new Error(`Welcome CTA did not render; url=${page.url()}, errors=${JSON.stringify(runtimeErrors)}, text=${(await page.locator("body").innerText()).slice(0, 900)}`);
  });
  assert.match(await page.locator("body").innerText(), /Auctor/i, "welcome uses configured Auctor branding");
  journeyRequired = true;
  await page.getByRole("button", { name: "Start Your RC Journey" }).click({ force: true });
  await page.waitForURL("**/first-session");
  assert.equal(new URL(page.url()).pathname, "/first-session", "welcome CTA routes directly to required first session");
  assert.equal(await page.locator(".product-tour-active").count(), 0, "product tour never opens during first-session handoff");

  await page.getByRole("heading", { name: "Let's see how you read." }).waitFor();
  assert.match(await page.locator(".fs-brand").innerText(), /Auctor/i, "diagnostic header uses the same configured brand");
  assert.doesNotMatch(await page.locator(".fs-screen").innerText(), /\bCAT\b/i, "intro does not show exam branding");
  await page.getByRole("button", { name: "Start my diagnostic" }).click();
  await page.getByRole("heading", { name: "Reading Diagnostic" }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll(".fs-option").length === 4, null, { timeout: 8000 }).catch(async () => {
    throw new Error(`Diagnostic question UI did not render; phase=${phase}, actions=${JSON.stringify(seenActions)}, errors=${JSON.stringify(runtimeErrors)}, report=${Boolean(responseForSession().report)}, text=${(await page.locator(".fs-screen").innerText()).slice(0, 1200)}`);
  });
  assert.doesNotMatch(await page.locator(".fs-screen").innerText(), /\bCAT\b/i, "diagnostic does not show exam branding");
  assert.equal(await page.getByText("CAT 2024 Slot 1 RC", { exact: true }).count(), 0, "source year and slot stay hidden from students");
  assert.equal(await page.getByText("2024", { exact: true }).count(), 0, "source year does not appear elsewhere in diagnostic UI");
  await page.locator(".fs-option").nth(0).click();
  await page.getByText("1 of 4 answered").waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Reading Diagnostic" }).waitFor();
  await page.getByRole("button", { name: "Question 1, answered" }).click();
  assert.equal(await page.locator(".fs-option.selected").count(), 1, `saved answer is restored after reload (fixture answers: ${JSON.stringify(answers)}, actions: ${JSON.stringify(seenActions)})`);
  for (let index = 1; index < questions.length; index += 1) {
    await page.getByRole("button", { name: `Question ${index + 1}, unanswered` }).click();
    await page.locator(".fs-option").nth(index % 4).click();
  }
  await page.getByRole("button", { name: "Finish diagnostic" }).click();
  await page.getByRole("heading", { name: "Your Reading Report" }).waitFor();
  await page.getByRole("tab", { name: "Reading Report" }).waitFor();
  assert.equal(await page.locator("[role=tab]").count(), 2, "the report has exactly two top-level tabs");
  const reportText = await page.locator(".fs-report").innerText();
  assert.doesNotMatch(reportText, /\bCAT\b/i, "report does not show exam branding");
  assert.doesNotMatch(reportText, /\bviewport\b|\bintervals?\b|recorded viewport|tracking event|raw tracking/i, "student report hides internal reading measurements");
  assert.match(await page.locator(".fs-brand").innerText(), /Auctor/i, "report header keeps the configured brand");
  assert.equal(await page.locator(".fs-type-row").count(), 3, "question-type chart groups the supplied metadata");
  assert.equal(await page.locator(".fs-trap-ranked-item").count(), 2, "trap list counts authored labels on incorrect answers");
  await page.getByText("WHAT YOUR READING TELLS US", { exact: true }).waitFor();
  await page.getByText("ONE THING TO TRY", { exact: true }).waitFor();
  await page.getByRole("region", { name: "How you read this passage" }).waitFor();
  await page.getByRole("heading", { name: "Your reading journey" }).waitFor();
  assert.equal(await page.locator(".fs-reading-sequence li").count(), 5, "the reading journey shows the passage paragraph order");
  await page.getByText("Paragraph 3", { exact: true }).waitFor();
  await page.getByText("29s visible on screen", { exact: true }).waitFor();
  await page.getByText(/does not prove where your attention was/i).waitFor();
  await page.getByText("What it means:", { exact: false }).first().waitFor();
  await page.getByText("What happened:", { exact: false }).first().waitFor();
  await page.getByText("Next time:", { exact: false }).first().waitFor();
  await page.getByText("Seen in Q2", { exact: true }).waitFor();
  await page.getByText("Seen in Q3", { exact: true }).waitFor();
  const desktopHeadingLayout = await page.evaluate(() => {
    const copy = document.querySelector(".fs-report-heading-copy").getBoundingClientRect();
    const button = document.querySelector(".fs-report-cta-top").getBoundingClientRect();
    return { copyRight: copy.right, buttonLeft: button.left, buttonTop: button.top, buttonBottom: button.bottom };
  });
  assert.ok(desktopHeadingLayout.buttonLeft > desktopHeadingLayout.copyRight, `desktop CTA sits to the right of the title: ${JSON.stringify(desktopHeadingLayout)}`);
  assert.ok(await page.locator(".fs-analytics-block").first().evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft) >= 12), "analytics cards have comfortable inner padding");
  await capture("desktop-reading-report.png", null);
  await capture("desktop-report-analytics.png", page.locator(".fs-analytics-grid"));
  assert.equal(await page.getByText("CAT 2024", { exact: true }).count(), 0, "report does not expose source year");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("tab", { name: /Detailed Review/ }).click();
  await page.waitForTimeout(250);
  const reviewHeadingTop = await page.locator(".fs-report-heading").evaluate((element) => element.getBoundingClientRect().top);
  const reviewScrollState = await page.evaluate(() => ({ y: window.scrollY, html: document.documentElement.scrollTop, body: document.body.scrollTop, height: document.documentElement.scrollHeight, client: document.documentElement.clientHeight }));
  assert.ok(reviewHeadingTop >= -1 && reviewHeadingTop < 160, `Detailed Review tab returns to report heading: ${reviewHeadingTop}px (${JSON.stringify(reviewScrollState)})`);
  await page.getByRole("region", { name: "Passage journey" }).waitFor();
  await page.locator(".fs-paragraph-map details").nth(0).locator("summary").click();
  await page.getByText("Saved question evidence", { exact: true }).first().waitFor();
  await page.getByText("WHY IT MATTERS IN THE PASSAGE", { exact: true }).first().waitFor();
  await page.getByText("It develops the passage's argument at step 1.", { exact: true }).waitFor();
  await page.locator(".fs-paragraph-map details").nth(4).locator("summary").click();
  await page.getByText("qualified", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Review Q1" }).waitFor();
  for (let index = 0; index < 4; index += 1) {
    const questionButton = page.locator(".fs-review-tab .fs-question-tile").nth(index);
    await questionButton.click();
    await page.locator(".fs-question-review-heading .fs-eyebrow").filter({ hasText: `Q${index + 1} ·` }).waitFor();
    assert.equal(await page.locator(".fs-review-passage").isVisible(), true, `passage stays alongside Q${index + 1}`);
    assert.equal(await page.locator(".fs-review-passage-scroll > p.evidence-active").count(), 1, `Q${index + 1} evidence highlights its matching paragraph`);
  }
  await page.getByText("The correct option stays within the passage's stated scope.").waitFor();
  await page.locator(".fs-question-tile").nth(1).click();
  await page.getByText("WHY YOUR ANSWER FAILED", { exact: true }).waitFor();
  await page.getByText("This selected option adds a claim the cited paragraph does not support.", { exact: true }).waitFor();
  await page.getByText("TRAP TO WATCH FOR", { exact: true }).waitFor();
  const reviewLayout = await page.locator(".fs-review-columns").evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  assert.ok(reviewLayout.split(" ").length >= 2, `desktop detailed review uses two columns: ${reviewLayout}`);
  await capture("desktop-detailed-review.png", page.locator(".fs-question-review"));

  await page.setViewportSize({ width: 768, height: 900 });
  const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const tabletLayout = await page.locator(".fs-review-columns").evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  assert.equal(tabletLayout.split(" ").length, 1, `768px review uses readable stacked layout: ${tabletLayout}`);
  assert.ok(tabletOverflow <= 1, `768px report has no horizontal overflow: ${tabletOverflow}px`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("tab", { name: "Reading Report" }).click();
  await page.waitForTimeout(250);
  const mobileHeadingTop = await page.locator(".fs-report-heading").evaluate((element) => element.getBoundingClientRect().top);
  assert.ok(mobileHeadingTop >= -1 && mobileHeadingTop < 160, `mobile Reading Report tab returns to top: ${mobileHeadingTop}px`);
  const mobileTitleLayout = await page.evaluate(() => {
    const copy = document.querySelector(".fs-report-heading-copy").getBoundingClientRect();
    const button = document.querySelector(".fs-report-cta-top").getBoundingClientRect();
    return { copyBottom: copy.bottom, buttonTop: button.top, buttonRight: button.right, viewport: document.documentElement.clientWidth };
  });
  assert.ok(mobileTitleLayout.buttonTop >= mobileTitleLayout.copyBottom - 1, `390px CTA stacks below the report title: ${JSON.stringify(mobileTitleLayout)}`);
  assert.ok(mobileTitleLayout.buttonRight <= mobileTitleLayout.viewport, `390px CTA stays inside the viewport: ${JSON.stringify(mobileTitleLayout)}`);
  assert.equal(await page.locator(".fs-type-row").count(), 3, "question analytics remain available at mobile width");
  await capture("mobile-reading-report.png", null);
  await capture("mobile-report-analytics.png", page.locator(".fs-analytics-grid"));
  await page.evaluate(() => { document.body.scrollTop = document.body.scrollHeight; document.documentElement.scrollTop = document.documentElement.scrollHeight; window.scrollTo(0, document.body.scrollHeight); });
  await page.getByRole("tab", { name: "Detailed Review" }).click();
  await page.waitForTimeout(100);
  const mobileReviewHeadingTop = await page.locator(".fs-report-heading").evaluate((element) => element.getBoundingClientRect().top);
  assert.ok(mobileReviewHeadingTop >= -1 && mobileReviewHeadingTop < 160, `mobile Detailed Review tab returns to top: ${mobileReviewHeadingTop}px`);
  await page.locator(".fs-review-tab .fs-question-tile").nth(2).click();
  const mobileLayout = await page.locator(".fs-review-columns").evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.equal(mobileLayout.split(" ").length, 1, `mobile passage and question stack: ${mobileLayout}`);
  assert.ok(mobileOverflow <= 1, `390px report has no horizontal overflow: ${mobileOverflow}px`);
  assert.equal(await page.locator(".fs-review-passage").isVisible(), true, "passage remains available on mobile review");
  await capture("mobile-detailed-review.png", page.locator(".fs-question-review"));
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByRole("tab", { name: "Reading Report" }).click();
  assert.equal(await page.getByRole("tabpanel", { name: "Reading Report" }).getByRole("button", { name: "Start today's RC" }).count(), 1, "the bottom Today's RC CTA remains available");
  await page.locator(".fs-report-cta-top").click();
  try {
    await page.waitForURL("**/daily-challenge/test?firstSession=1", { waitUntil: "commit", timeout: 30000 });
  } catch {
    throw new Error(`Today's RC CTA did not navigate; url=${page.url()}, actions=${JSON.stringify(seenActions)}, alert=${await page.locator('[role="alert"]').allTextContents()}`);
  }
  assert.ok(seenActions.includes("start_mission"), "Today's RC CTA calls the existing mission action");
  assert.deepEqual(runtimeErrors, [], "first-session browser flow has no uncaught runtime exceptions");
  console.log("First-session fixture browser smoke passed: seeded session and answer persistence, student-facing reading journey, grouped reading insights, separate trap explanations, question-type accuracy, paragraph replay and author flow, question evidence links, tab-to-top behavior, desktop/768px/390px layouts, and Today's RC handoff.");
} finally {
  await browser.close();
}
