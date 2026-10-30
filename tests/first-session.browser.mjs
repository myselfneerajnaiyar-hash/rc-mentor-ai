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
let holdNextAnswer = false;
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
      option_explanations: index === 1 ? [null, "This selected option adds a claim the cited paragraph does not support.", "This choice changes the subject from the workers to employers.", "This choice reverses the direction of the author's claim."] : [],
    };
  });
  return {
    set_id: setId,
    source_year: "2024",
    score: reviewedQuestions.filter((question) => question.is_correct).length,
    total_questions: questions.length,
    time_taken_seconds: 15,
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
  let answerChanged = false;
  if (action === "start_diagnostic") phase = "DIAGNOSTIC_IN_PROGRESS";
  if (action === "answer") {
    const body = request.postDataJSON();
    const prior = answers.find((answer) => answer.question_id === body.question_id);
    answerChanged = Boolean(prior);
    if (prior) prior.selected_option = body.selected_option;
    else answers.push({ question_id: body.question_id, selected_option: body.selected_option });
    if (holdNextAnswer) { holdNextAnswer = false; await new Promise((resolve) => setTimeout(resolve, 900)); }
  }
  if (action === "submit_diagnostic") phase = "DIAGNOSTIC_COMPLETED";
  if (action === "report_viewed") phase = "DIAGNOSIS_VIEWED";
  if (action === "start_mission") phase = "DAILY_RC_MISSION";
  return json(route, {
    ...responseForSession(),
    ...(action === "answer" ? { is_change: answerChanged } : {}),
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
const posthogHost = new URL(process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").hostname;
await context.route(`https://${posthogHost}/**`, (route) => route.fulfill({ status: 200, body: "{}" }));

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
  profile = null;
  journeyRequired = true;
  await page.goto(`${base}/welcome?utm_source=instagram&utm_medium=social&utm_campaign=cat2026&utm_content=story&utm_term=reading`);
  await page.getByRole("heading", { name: "Let’s Set Up Your Profile" }).waitFor();
  await page.getByPlaceholder("Enter your Name").fill("First Session Student");
  await page.getByRole("button", { name: "Next →" }).click();
  await page.getByRole("button", { name: "Next →" }).click();
  await page.getByRole("button", { name: "Next →" }).click();
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByRole("button", { name: "Finish →" }).click();
  await page.waitForURL("**/first-session");
  assert.equal(profile.profile_completed, true, "profile completion persists before first-session handoff");
  const savedAttribution = await page.evaluate(() => JSON.parse(localStorage.getItem("auctor.signup-attribution.v1") || "null"));
  assert.equal(savedAttribution?.firstTouch?.utm_source, "instagram", "first-touch source survives profile completion and diagnostic handoff");
  assert.equal(savedAttribution?.firstTouch?.utm_campaign, "cat2026", "first-touch campaign survives profile completion and diagnostic handoff");
  await page.getByRole("heading", { name: "Let's see how you read." }).waitFor({ timeout: 12000 }).catch(async () => {
    throw new Error(`First-session handoff did not render; url=${page.url()}, errors=${JSON.stringify(runtimeErrors)}, text=${(await page.locator("body").innerText()).slice(0, 900)}`);
  });

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
  await page.getByRole("button", { name: "Take me to Home" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  assert.equal(await page.locator(".fs-screen").count(), 0, "Home choice exits the diagnostic intro");
  assert.equal(seenActions.includes("start_diagnostic"), false, "Home choice does not start the diagnostic");
  await page.goto(`${base}/first-session`);
  await page.getByRole("heading", { name: "Let's see how you read." }).waitFor();
  await page.getByRole("button", { name: "Start your diagnostic" }).click();
  await page.getByRole("heading", { name: "Reading Diagnostic" }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll(".fs-option").length === 4, null, { timeout: 8000 }).catch(async () => {
    throw new Error(`Diagnostic question UI did not render; phase=${phase}, actions=${JSON.stringify(seenActions)}, errors=${JSON.stringify(runtimeErrors)}, report=${Boolean(responseForSession().report)}, text=${(await page.locator(".fs-screen").innerText()).slice(0, 1200)}`);
  });
  assert.doesNotMatch(await page.locator(".fs-screen").innerText(), /\bCAT\b/i, "diagnostic does not show exam branding");
  assert.equal(await page.getByText("CAT 2024 Slot 1 RC", { exact: true }).count(), 0, "source year and slot stay hidden from students");
  assert.equal(await page.getByText("2024", { exact: true }).count(), 0, "source year does not appear elsewhere in diagnostic UI");
  assert.equal(await page.locator("[data-pane=passage]").isVisible(), true, "desktop keeps the passage panel visible");
  assert.equal(await page.locator("[data-pane=questions]").isVisible(), true, "desktop keeps the question panel alongside the passage");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator("[data-pane=passage]").isVisible(), true, "mobile starts with the passage tab");
  assert.equal(await page.locator("[data-pane=questions]").isVisible(), false, "mobile hides questions until selected");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), "390px diagnostic has no horizontal overflow");
  await capture("mobile-diagnostic-passage.png", page.locator(".fs-test"));
  await page.locator(".fs-passage-scroll").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await page.waitForFunction(() => document.querySelector(".fs-passage-scroll")?.scrollTop > 0, null, { timeout: 1500 });
  assert.ok(await page.locator(".fs-passage-scroll").evaluate((element) => element.scrollTop > 0), "passage has independent scrolling");
  await page.getByRole("tab", { name: /Questions/ }).click();
  assert.equal(await page.locator("[data-pane=questions]").isVisible(), true, "the Questions tab opens its panel");
  assert.equal(await page.locator("[data-pane=passage]").isVisible(), false, "the passage panel is hidden while Questions is active");
  assert.equal(await page.locator(".fs-question-nav button").count(), 4, "mobile question navigation remains usable");
  await capture("mobile-diagnostic-questions.png", page.locator(".fs-test"));
  await page.getByRole("tab", { name: "Passage" }).click();
  await page.getByRole("tab", { name: /Questions/ }).click();
  holdNextAnswer = true;
  await page.locator(".fs-option").nth(0).click();
  assert.equal(await page.locator(".fs-option").nth(0).getAttribute("aria-pressed"), "true", "answer selection is visible before the save response");
  await page.getByRole("status").filter({ hasText: "saving in the background" }).waitFor();
  await page.getByRole("button", { name: "Question 2, unanswered" }).click();
  await page.locator(".fs-option").nth(1).click();
  assert.equal(await page.locator(".fs-option").nth(1).getAttribute("aria-pressed"), "true", "student can answer the next question while the prior save is pending");
  await page.getByRole("button", { name: "Question 1, answered" }).click();
  await page.locator(".fs-option").nth(2).click();
  assert.equal(await page.locator(".fs-option").nth(2).getAttribute("aria-pressed"), "true", "rapid answer changes update the visible selection immediately");
  await page.getByRole("status").filter({ hasText: "saving in the background" }).waitFor({ state: "hidden" });
  await page.getByText("2 of 4 answered").waitFor();
  assert.equal(answers.find((answer) => answer.question_id === "q1")?.selected_option, 2, "the final rapid selection is persisted");
  assert.equal(answers.find((answer) => answer.question_id === "q2")?.selected_option, 1, "other question saves are serialized without loss");
  await page.reload();
  await page.getByRole("heading", { name: "Reading Diagnostic" }).waitFor();
  await page.getByRole("tab", { name: /Questions/ }).click();
  await page.getByRole("button", { name: "Question 1, answered" }).click();
  assert.equal(await page.locator(".fs-option.selected").count(), 1, `saved answer is restored after reload (fixture answers: ${JSON.stringify(answers)}, actions: ${JSON.stringify(seenActions)})`);
  assert.equal(await page.locator(".fs-option").nth(2).getAttribute("aria-pressed"), "true", "the final changed selection resumes after refresh");
  await page.setViewportSize({ width: 1280, height: 900 });
  for (let index = 1; index < questions.length - 1; index += 1) {
    await page.locator(".fs-question-nav button").nth(index).click();
    if (await page.locator(".fs-option.selected").count() === 0) await page.locator(".fs-option").nth(0).click();
  }
  await page.getByRole("button", { name: "Finish diagnostic" }).click();
  await page.getByRole("heading", { name: "Well done!" }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Your Reading Report" }).count(), 0, "completion moment appears before the report");
  assert.equal(await page.locator(".fs-completion img").getAttribute("src"), "/Birbal avatar.jpeg", "completion reuses Bootcamp's existing Birbal asset");
  assert.match(await page.locator(".fs-completion img").evaluate((element) => getComputedStyle(element).animationName), /fs-birbal-enter/, "Birbal has a subtle entrance animation");
  await capture("birbal-completion.png");
  await page.getByRole("button", { name: "See What I Can Improve" }).click();
  await page.getByRole("heading", { name: "Your Reading Report" }).waitFor();
  await page.getByRole("tab", { name: "Reading Report" }).waitFor();
  assert.equal(await page.locator("[role=tab]").count(), 2, "the report has exactly two top-level tabs");
  const inactiveReviewStyle = await page.locator("#fs-tab-review").evaluate((element) => ({ selected: element.getAttribute("aria-selected"), color: getComputedStyle(element).color, border: getComputedStyle(element).borderColor, borderStyle: getComputedStyle(element).borderStyle, borderWidth: getComputedStyle(element).borderWidth, background: getComputedStyle(element).backgroundColor, cursor: getComputedStyle(element).cursor, badgeBackground: getComputedStyle(element.querySelector("span")).backgroundColor }));
  assert.equal(inactiveReviewStyle.selected, "false", "Detailed Review is correctly marked inactive while the report is open");
  assert.notEqual(inactiveReviewStyle.border, "rgba(0, 0, 0, 0)", `inactive Detailed Review keeps a visible outline: ${JSON.stringify(inactiveReviewStyle)}`);
  assert.equal(inactiveReviewStyle.borderStyle, "solid", `inactive Detailed Review uses a real border: ${JSON.stringify(inactiveReviewStyle)}`);
  assert.ok(parseFloat(inactiveReviewStyle.borderWidth) >= 1, `inactive Detailed Review border has visible width: ${JSON.stringify(inactiveReviewStyle)}`);
  assert.equal(inactiveReviewStyle.cursor, "pointer", `inactive Detailed Review communicates that it is clickable: ${JSON.stringify(inactiveReviewStyle)}`);
  assert.notEqual(inactiveReviewStyle.badgeBackground, "rgba(0, 0, 0, 0)", `inactive Detailed Review count badge remains visible: ${JSON.stringify(inactiveReviewStyle)}`);
  assert.notEqual(inactiveReviewStyle.background, "rgba(0, 0, 0, 0)", `inactive Detailed Review keeps a visible surface: ${JSON.stringify(inactiveReviewStyle)}`);
  const reportText = await page.locator(".fs-report").innerText();
  assert.doesNotMatch(reportText, /\bCAT\b/i, "report does not show exam branding");
  assert.doesNotMatch(reportText, /\bviewport\b|\bintervals?\b|recorded viewport|tracking event|raw tracking/i, "student report hides internal reading measurements");
  assert.match(await page.locator(".fs-brand").innerText(), /Auctor/i, "report header keeps the configured brand");
  assert.equal(await page.locator(".fs-type-row").count(), 3, "question types are grouped into compact chart rows");
  assert.equal(await page.locator('.fs-stacked-bar[aria-label="Inference: 0 correct, 1 wrong, 1 unattempted"]').count(), 1, "grouped chart shows actual wrong and unattempted Inference outcomes");
  assert.equal(await page.locator('.fs-stacked-bar[aria-label="Main idea: 0 correct, 1 wrong, 0 unattempted"]').count(), 1, "chart uses the actual Main idea outcome");
  assert.equal(await page.locator('.fs-stacked-bar[aria-label="Evidence application: 1 correct, 0 wrong, 0 unattempted"]').count(), 1, "chart uses the actual correct outcome");
  assert.equal(await page.locator(".fs-type-row .fs-stacked-bar").count(), 3, "each question type has a visual status bar");
  assert.equal(await page.locator(".fs-trap-ranked-item").count(), 1, "trap list counts authored labels on incorrect answers");
  const trapButton = page.getByRole("button", { name: /Overreach Q2/ });
  assert.equal(await trapButton.getAttribute("aria-expanded"), "false", "trap explanation starts collapsed");
  await trapButton.click();
  assert.equal(await trapButton.getAttribute("aria-expanded"), "true", "trap card opens accessibly in place");
  const trapExplanation = page.locator(".fs-trap-explanation").first();
  await trapExplanation.waitFor();
  assert.match(await trapExplanation.innerText(), /This option extends the claim beyond the passage\./);
  assert.match(await trapExplanation.innerText(), /The option misses what the passage actually supports\./);
  assert.equal(await page.getByText("What happened", { exact: true }).count(), 0, "trap card does not duplicate Detailed Review");
  await trapButton.click();
  assert.equal(await trapButton.getAttribute("aria-expanded"), "false", "trap explanation collapses on a second click");
  assert.equal(await page.locator(".fs-trap-chart-row").count(), 0, "error traps omit dashboard charts");
  assert.equal(await page.locator(".fs-birbal-analysis").count(), 1, "personalized Birbal analysis is present");
  const birbalText = await page.locator(".fs-birbal-analysis").innerText();
  assert.match(birbalText, /Slow down before you solve/i);
  assert.match(birbalText, /4-question diagnostic in 15 seconds/i);
  assert.match(birbalText, /early signal, not a conclusion about your ability/i);
  assert.doesNotMatch(birbalText, /overreach|historical example/i, "Birbal leaves trap and passage detail to Detailed Review");
  assert.doesNotMatch(birbalText, /\bQ\d\b|A broader unsupported claim|The passage says|Supported choice|Next evidence check/i, "Birbal stays out of question-by-question review");
  assert.ok(birbalText.match(/[.!?](?:\s|$)/g).length <= 5, "Birbal stays within five short sentences");
  assert.equal(await page.locator(".fs-reading-analysis + .fs-report-checkpoint-middle").count(), 1, "middle practice CTA follows Reading Replay");
  assert.equal(await page.getByRole("button", { name: "Keep Practising" }).count(), 3, "report has three practice checkpoints");
  const ctaOrder = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll(".fs-report-cta-top, .fs-report-checkpoint-middle .fs-primary, .fs-next-move > .fs-primary")];
    return buttons.map((button) => button.innerText.trim());
  });
  assert.deepEqual(ctaOrder, ["Keep Practising →", "Keep Practising →", "Keep Practising →"], "top, post-replay, and bottom CTAs are the only practice buttons");
  assert.equal(await page.locator(".fs-next-move > .fs-primary").innerText(), "Keep Practising →", "bottom practice CTA follows report analysis");
  assert.equal(await page.locator(".fs-student-offer a").getAttribute("href"), "/pricing?coupon=AUCTOR30&source=first_session_offer", "offer preserves its coupon and source attribution");
  assert.match(await page.locator(".fs-student-offer").innerText(), /30% OFF TODAY/);
  assert.equal(await page.locator(".fs-metric-tile").count(), 4, "performance summary uses four compact metric tiles");
  const metricValues = await page.locator(".fs-metric-tile").evaluateAll((tiles) => tiles.map((tile) => [tile.querySelector("b").innerText, tile.querySelector("small").innerText]));
  assert.deepEqual(metricValues, [["1/4", "CORRECT"], ["33.33%", "ACCURACY"], ["0:15", "TIME"], ["3/4", "ATTEMPTED"]], "metric tiles surface the four compact report values using attempted answers as the denominator");
  assert.equal(await page.locator(".fs-trap-explanation[aria-hidden='true']").count(), 1, "trap explanations stay collapsed until a student opens one");
  assert.equal(await page.locator(".fs-hero-action").count(), 0, "the redundant One Thing to Try panel is removed");
  await page.getByRole("region", { name: "How you read this passage" }).waitFor();
  await page.getByRole("heading", { name: "Reading Replay" }).waitFor();
  assert.equal(await page.locator(".fs-reading-sequence li").count(), 5, "the reading journey shows the passage paragraph order");
  await page.getByText("Paragraph 3", { exact: true }).waitFor();
  await page.getByText("29s in this part", { exact: true }).waitFor();
  await page.getByText("20s together", { exact: true }).waitFor();
  await page.getByText("Paragraphs 1–2", { exact: true }).waitFor();
  await page.getByText(/screen time cannot confirm attention/i).waitFor();
  assert.equal(await page.getByText("What happened:", { exact: false }).count(), 0, "error traps avoid repeating detailed-review explanation headings");
  await page.getByText("Q2", { exact: true }).waitFor();
  const desktopHeadingLayout = await page.evaluate(() => {
    const copy = document.querySelector(".fs-report-heading-copy").getBoundingClientRect();
    const button = document.querySelector(".fs-report-cta-top").getBoundingClientRect();
    return { copyRight: copy.right, buttonLeft: button.left, buttonTop: button.top, buttonBottom: button.bottom };
  });
  assert.ok(desktopHeadingLayout.buttonLeft > desktopHeadingLayout.copyRight, `desktop CTA sits to the right of the title: ${JSON.stringify(desktopHeadingLayout)}`);
  assert.ok(await page.locator(".fs-analytics-block").first().evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft) >= 12), "analytics cards have comfortable inner padding");
  await capture("desktop-report-tabs.png", page.locator(".fs-report-tabs"));
  await capture("desktop-reading-report.png", null);
  await capture("desktop-report-analytics.png", page.locator(".fs-analytics-grid"));
  assert.equal(await page.getByText("CAT 2024", { exact: true }).count(), 0, "report does not expose source year");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("tab", { name: /Detailed Review/ }).click();
  await page.waitForTimeout(250);
  const reviewHeadingTop = await page.locator(".fs-report-heading").evaluate((element) => element.getBoundingClientRect().top);
  const reviewScrollState = await page.evaluate(() => ({ y: window.scrollY, html: document.documentElement.scrollTop, body: document.body.scrollTop, height: document.documentElement.scrollHeight, client: document.documentElement.clientHeight }));
  assert.ok(reviewHeadingTop >= -1 && reviewHeadingTop < 160, `Detailed Review tab returns to report heading: ${reviewHeadingTop}px (${JSON.stringify(reviewScrollState)})`);
  const detailedTabStyle = await page.locator("#fs-tab-review").evaluate((element) => ({ selected: element.getAttribute("aria-selected"), color: getComputedStyle(element).color, shadow: getComputedStyle(element).boxShadow, border: getComputedStyle(element).borderColor }));
  assert.equal(detailedTabStyle.selected, "true", "Detailed Review exposes its active state to assistive technology");
  assert.notEqual(detailedTabStyle.shadow, "none", `Detailed Review active tab has visible elevation: ${JSON.stringify(detailedTabStyle)}`);
  await page.getByRole("tab", { name: "Passage Flow" }).waitFor();
  await page.getByRole("region", { name: "Passage journey" }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 240));
  await page.getByRole("tab", { name: /Question Autopsy/ }).click();
  await page.locator("#fs-review-panel-questions").waitFor({ state: "visible" });
  const subtabScrollY = await page.evaluate(() => window.scrollY);
  assert.ok(subtabScrollY > 120 && subtabScrollY < 360, `switching review subtabs keeps the current scroll position: ${subtabScrollY}px`);
  await page.getByRole("tab", { name: "Passage Flow" }).click();
  assert.equal(await page.locator("#fs-review-panel-passage .fs-paragraph-source:visible").count(), 0, "passage text stays compact until a paragraph is opened");
  await capture("desktop-author-flow.png", page.locator(".fs-author-flow"));
  await page.locator(".fs-paragraph-map > li > details > summary").nth(0).click();
  await page.locator(".fs-paragraph-map > li").nth(0).locator(".fs-paragraph-source").waitFor();
  await page.getByText("WHY IT MATTERS", { exact: true }).first().waitFor();
  await page.getByText("It develops the passage's argument at step 1.", { exact: true }).waitFor();
  await page.locator(".fs-paragraph-map > li > details > summary").nth(4).click();
  await page.getByText("qualified", { exact: true }).waitFor();
  await page.getByRole("tab", { name: /Question Autopsy/ }).click();
  assert.equal(await page.locator(".fs-autopsy-passage").isVisible(), true, "desktop Question Autopsy keeps the passage beside its question");
  for (let index = 0; index < 4; index += 1) {
    const questionButton = page.locator(".fs-review-tab .fs-question-tile").nth(index);
    await questionButton.click();
    await page.locator(".fs-question-review-heading .fs-eyebrow").filter({ hasText: `Q${index + 1} ·` }).waitFor();
    assert.equal(await page.locator(".fs-question-review").isVisible(), true, `Q${index + 1} autopsy is visible`);
    assert.equal(await page.locator(".fs-autopsy-passage").isVisible(), true, `passage remains beside Q${index + 1}`);
    assert.equal(await page.locator(".fs-autopsy-passage .fs-review-passage-scroll > p.evidence-active").count(), 1, `Q${index + 1} highlights its passage evidence`);
  }
  const desktopEvidenceLayout = await page.locator(".fs-autopsy-passage").evaluate((element) => {
    const paragraph = element.querySelector("p.evidence-active");
    const label = paragraph?.querySelector(".fs-passage-paragraph-label");
    const copy = paragraph?.querySelector(".fs-passage-copy");
    const mark = copy?.querySelector(".fs-evidence-mark");
    return { labelWidth: label?.getBoundingClientRect().width || 0, copyWidth: copy?.getBoundingClientRect().width || 0, copyFontSize: copy ? getComputedStyle(copy).fontSize : "0px", copyColor: copy ? getComputedStyle(copy).color : "", markParent: mark?.parentElement?.className || "", markParentWidth: mark?.parentElement?.getBoundingClientRect().width || 0, copyText: copy?.innerText || "" };
  });
  assert.equal(desktopEvidenceLayout.markParent, "fs-passage-copy", `desktop evidence highlight stays inline in the full passage text column: ${JSON.stringify(desktopEvidenceLayout)}`);
  assert.ok(desktopEvidenceLayout.copyWidth > desktopEvidenceLayout.labelWidth * 5, `desktop passage text has the full second-column width: ${JSON.stringify(desktopEvidenceLayout)}`);
  assert.ok(desktopEvidenceLayout.markParentWidth > 250, `desktop highlighted sentence can wrap across the passage width: ${JSON.stringify(desktopEvidenceLayout)}`);
  assert.ok(parseFloat(desktopEvidenceLayout.copyFontSize) >= 13, `desktop evidence text retains readable passage sizing: ${JSON.stringify(desktopEvidenceLayout)}`);
  await page.getByText("The correct option stays within the passage's stated scope.").waitFor();
  await page.locator(".fs-question-tile").nth(1).click();
  await page.locator(".fs-question-review-heading h3").filter({ hasText: questions[1].question_text }).waitFor();
  const selectedOptionDetails = page.locator(".fs-option-review li.selected");
  assert.match(await selectedOptionDetails.innerText(), /This selected option adds a claim the cited paragraph does not support\./, "the selected wrong option shows its authored explanation");
  assert.match(await page.locator(".fs-autopsy-insight.trap").innerText(), /This option extends the claim beyond the passage\./, "the authored trap explanation stays visible");
  await page.getByText("WHY YOUR CHOICE LOOKED TEMPTING", { exact: true }).waitFor();
  await page.getByText("WHAT TO NOTICE NEXT TIME", { exact: true }).waitFor();
  assert.equal(await page.locator(".fs-option-inline-explanation.wrong").count(), 3, "every incorrect option keeps its available explanation visible");
  const reviewLayout = await page.locator(".fs-autopsy-columns").evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  assert.equal(reviewLayout.split(" ").length, 2, `desktop Question Autopsy keeps passage and question side by side: ${reviewLayout}`);
  await capture("desktop-detailed-review.png", page.locator(".fs-question-review"));

  await page.setViewportSize({ width: 768, height: 900 });
  const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const tabletLayout = await page.locator(".fs-autopsy-columns").evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  assert.equal(tabletLayout.split(" ").length, 1, `768px review uses a readable stacked layout: ${tabletLayout}`);
  assert.ok(tabletOverflow <= 1, `768px report has no horizontal overflow: ${tabletOverflow}px`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("tab", { name: "Reading Report" }).click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator(".fs-report-hero").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length), 2, "mobile report metrics use a two by two grid");
  const mobileHeadingTop = await page.locator(".fs-report-heading").evaluate((element) => element.getBoundingClientRect().top);
  assert.ok(mobileHeadingTop >= -1 && mobileHeadingTop < 160, `mobile Reading Report tab returns to top: ${mobileHeadingTop}px`);
  await capture("mobile-report-tabs.png", page.locator(".fs-report-tabs"));
  const mobileTitleLayout = await page.evaluate(() => {
    const copy = document.querySelector(".fs-report-heading-copy").getBoundingClientRect();
    const button = document.querySelector(".fs-report-cta-top").getBoundingClientRect();
    return { copyBottom: copy.bottom, buttonTop: button.top, buttonRight: button.right, viewport: document.documentElement.clientWidth };
  });
  assert.ok(mobileTitleLayout.buttonTop >= mobileTitleLayout.copyBottom - 1, `390px CTA stacks below the report title: ${JSON.stringify(mobileTitleLayout)}`);
  assert.ok(mobileTitleLayout.buttonRight <= mobileTitleLayout.viewport, `390px CTA stays inside the viewport: ${JSON.stringify(mobileTitleLayout)}`);
  assert.equal(await page.locator(".fs-type-row").count(), 3, "compact grouped question chart remains available at mobile width");
  assert.equal(await page.locator(".fs-analytics-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length), 1, "question types and traps stack on mobile");
  const mobileAnalyticsHeading = await page.locator(".fs-analytics-block .fs-section-heading").first().evaluate((element) => ({ textAlign: getComputedStyle(element).textAlign, left: element.getBoundingClientRect().left, childLeft: element.querySelector("div").getBoundingClientRect().left }));
  assert.equal(mobileAnalyticsHeading.textAlign, "left", `mobile analytics heading is left aligned: ${JSON.stringify(mobileAnalyticsHeading)}`);
  assert.ok(Math.abs(mobileAnalyticsHeading.left - mobileAnalyticsHeading.childLeft) < 2, `mobile analytics heading starts at the content edge: ${JSON.stringify(mobileAnalyticsHeading)}`);
  const reportOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(reportOverflow <= 1, `390px Reading Report has no horizontal overflow: ${reportOverflow}px`);
  await capture("mobile-reading-report.png", null);
  await capture("mobile-report-analytics.png", page.locator(".fs-analytics-grid"));
  await page.evaluate(() => { document.body.scrollTop = document.body.scrollHeight; document.documentElement.scrollTop = document.documentElement.scrollHeight; window.scrollTo(0, document.body.scrollHeight); });
  await page.getByRole("tab", { name: "Detailed Review" }).click();
  await page.waitForTimeout(100);
  const mobileReviewHeadingTop = await page.locator(".fs-report-heading").evaluate((element) => element.getBoundingClientRect().top);
  assert.ok(mobileReviewHeadingTop >= -1 && mobileReviewHeadingTop < 160, `mobile Detailed Review tab returns to top: ${mobileReviewHeadingTop}px`);
  const mobileDetailedTab = await page.locator("#fs-tab-review").evaluate((element) => ({ selected: element.getAttribute("aria-selected"), shadow: getComputedStyle(element).boxShadow }));
  assert.equal(mobileDetailedTab.selected, "true", "mobile Detailed Review is visibly and accessibly selected");
  assert.notEqual(mobileDetailedTab.shadow, "none", `mobile Detailed Review active treatment remains strong: ${JSON.stringify(mobileDetailedTab)}`);
  const mobileInactiveReport = await page.locator("#fs-tab-report").evaluate((element) => ({ selected: element.getAttribute("aria-selected"), color: getComputedStyle(element).color, border: getComputedStyle(element).borderColor, borderStyle: getComputedStyle(element).borderStyle, borderWidth: getComputedStyle(element).borderWidth, background: getComputedStyle(element).backgroundColor, cursor: getComputedStyle(element).cursor }));
  assert.equal(mobileInactiveReport.selected, "false", "mobile Reading Report is correctly marked inactive in Detailed Review");
  assert.notEqual(mobileInactiveReport.border, "rgba(0, 0, 0, 0)", `mobile inactive Reading Report keeps a visible outline: ${JSON.stringify(mobileInactiveReport)}`);
  assert.equal(mobileInactiveReport.borderStyle, "solid", `mobile inactive Reading Report uses a real border: ${JSON.stringify(mobileInactiveReport)}`);
  assert.ok(parseFloat(mobileInactiveReport.borderWidth) >= 1, `mobile inactive Reading Report border has visible width: ${JSON.stringify(mobileInactiveReport)}`);
  assert.equal(mobileInactiveReport.cursor, "pointer", `mobile inactive Reading Report remains clickable: ${JSON.stringify(mobileInactiveReport)}`);
  await page.getByRole("tab", { name: "Passage Flow" }).click();
  await capture("mobile-author-flow.png", page.locator(".fs-paragraph-map li").first());
  await page.getByRole("tab", { name: /Question Autopsy/ }).click();
  await page.locator(".fs-review-tab .fs-question-tile").nth(2).click();
  const mobileLayout = await page.locator(".fs-autopsy-columns").evaluate((element) => getComputedStyle(element).display);
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.equal(mobileLayout, "block", `mobile Question Autopsy uses its Passage/Questions switch: ${mobileLayout}`);
  assert.ok(mobileOverflow <= 1, `390px report has no horizontal overflow: ${mobileOverflow}px`);
  assert.equal(await page.locator(".fs-autopsy-passage").isVisible(), false, "mobile Question Autopsy starts with the selected question");
  await page.getByRole("tab", { name: "Passage", exact: true }).click();
  assert.equal(await page.locator(".fs-autopsy-passage").isVisible(), true, "mobile Passage switch reveals the evidence text");
  assert.equal(await page.locator(".fs-autopsy-question").isVisible(), false, "mobile Passage switch avoids crowding the selected question");
  const mobileEvidenceWrap = await page.locator(".fs-autopsy-passage").evaluate((element) => {
    const paragraph = element.querySelector("p.evidence-active");
    const target = paragraph?.querySelector(".fs-passage-copy") || element.querySelector(".fs-review-evidence > span") || element.querySelector(".fs-review-evidence");
    const mark = target?.querySelector(".fs-evidence-mark");
    return { width: target?.clientWidth || 0, scrollWidth: target?.scrollWidth || 0, fontSize: target ? getComputedStyle(target).fontSize : "0px", wordBreak: target ? getComputedStyle(target).wordBreak : "", markParent: mark?.parentElement?.className || "" };
  });
  assert.ok(mobileEvidenceWrap.width > 180, `mobile passage evidence gets a readable line width: ${JSON.stringify(mobileEvidenceWrap)}`);
  assert.ok(parseFloat(mobileEvidenceWrap.fontSize) >= 13, `mobile passage evidence retains readable passage sizing: ${JSON.stringify(mobileEvidenceWrap)}`);
  assert.ok(mobileEvidenceWrap.scrollWidth <= mobileEvidenceWrap.width + 1, `mobile passage evidence wraps without clipping: ${JSON.stringify(mobileEvidenceWrap)}`);
  assert.ok(mobileEvidenceWrap.markParent === "fs-passage-copy" || !mobileEvidenceWrap.markParent, `mobile highlight remains inside the passage text wrapper: ${JSON.stringify(mobileEvidenceWrap)}`);
  await page.locator("p.evidence-active").evaluate((element) => { const scroller = element.closest(".fs-review-passage-scroll"); scroller.scrollTop += element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 20; });
  assert.ok(await page.locator(".fs-review-passage-scroll .evidence-active .fs-evidence-mark").count(), "mobile screenshot shows the inline evidence highlight");
  await capture("mobile-autopsy-passage.png", page.locator(".fs-autopsy-passage"));
  await page.getByRole("tab", { name: "Questions", exact: true }).click();
  assert.equal(await page.locator(".fs-autopsy-question").isVisible(), true, "mobile Questions switch restores the selected autopsy");
  await capture("mobile-detailed-review.png", page.locator(".fs-question-review"));
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByRole("tab", { name: "Reading Report" }).click();
  assert.equal(await page.getByRole("button", { name: "Keep Practising" }).count(), 3, "all three report practice CTAs are visible");
  await page.route((url) => new URL(url).pathname === "/", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    await route.continue();
  });
  await page.locator(".fs-report-cta-top").click();
  await page.getByRole("button", { name: "Taking you to Home…" }).first().waitFor({ state: "visible" });
  assert.equal(await page.locator(".fs-report button.is-loading").count(), 3, "all report CTAs immediately show a disabled loading state");
  await page.locator(".fs-report-cta-top").evaluate((button) => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  try {
    await page.waitForURL((url) => url.pathname === "/", { waitUntil: "commit", timeout: 30000 });
  } catch {
    throw new Error(`Report practice CTA did not navigate Home; url=${page.url()}, actions=${JSON.stringify(seenActions)}, alert=${await page.locator('[role="alert"]').allTextContents()}`);
  }
  assert.equal(new URL(page.url()).pathname, "/", "the repeated-click attempt lands on Home");
  assert.equal(seenActions.includes("start_mission"), false, "report practice CTA does not start the Daily RC flow");
  await page.locator("aside").first().waitFor({ state: "visible" });
  assert.equal(await page.getByText("Grammar", { exact: true }).count(), 0, "Grammar is absent from the homepage sidebar");
  const capturedEventKeys = await page.evaluate(() => Object.keys(localStorage));
  for (const name of ["diagnostic_started", "diagnostic_completed", "diagnostic_report_viewed", "detailed_review_opened", "passage_flow_viewed", "question_autopsy_viewed", "keep_practising_clicked"]) {
    assert.ok(capturedEventKeys.includes(`auctor:first-session:event:${attemptId}:${name}`), `${name} is emitted once per attempt`);
  }
  for (const questionId of ["q1", "q2", "q3"]) assert.ok(capturedEventKeys.includes(`auctor:first-session:event:${attemptId}:answer:${questionId}`), `answer for ${questionId} is emitted once after save`);
  assert.ok(capturedEventKeys.includes(`auctor:first-session:event:${attemptId}:answer-change:q1:2`), "answer changes have a distinct event key");
  assert.deepEqual(runtimeErrors, [], "first-session browser flow has no uncaught runtime exceptions");
  console.log("First-session fixture browser smoke passed: profile handoff, Home opt-out, optimistic answer persistence, mobile tabs, report analysis and review, personalized Birbal coaching, three Home practice CTAs, coupon offer, and desktop/768px/390px layouts.");
} finally {
  await browser.close();
}
