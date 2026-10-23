import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { dailyRcTodayDate, filterTodaysDailyRc } from "@/lib/dailyRc/today.mjs";
import { diagnosticQuestionForClient, FIRST_SESSION_DIAGNOSTIC_SET_ID, FIRST_SESSION_TIME_LIMIT_SECONDS, scoreDiagnostic, summarizeReadingReplay } from "@/lib/firstSession/diagnostic.mjs";

const MAX_READING_EVENTS = 500;

async function hasCompleteDailyRcAnswerRows(attemptId, dailyRcSetId) {
  const { data: expectedQuestions, error: questionError } = await supabaseAdmin
    .from("daily_rc_questions")
    .select("id")
    .eq("daily_rc_set_id", dailyRcSetId);
  if (questionError || expectedQuestions?.length !== 4) return false;
  const { data: answers, error: answerError } = await supabaseAdmin
    .from("daily_rc_question_attempts")
    .select("question_id")
    .eq("attempt_id", attemptId);
  if (answerError || answers?.length !== 4) return false;
  const expectedIds = new Set(expectedQuestions.map((question) => question.id));
  return new Set(answers.map((answer) => answer.question_id)).size === 4 && answers.every((answer) => expectedIds.has(answer.question_id));
}

export async function requireFirstSessionUser(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Authentication required", status: 401 };
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return { error: "Authentication required", status: 401 };
  return { user };
}

async function loadDiagnosticContent(includeAnswers = false) {
  const { data: set, error: setError } = await supabaseAdmin
    .from("daily_rc_sets")
    .select("id,title,source_year,passage,passage_json,passage_enrichment,timer_minutes,category,is_published")
    .eq("id", FIRST_SESSION_DIAGNOSTIC_SET_ID)
    .eq("category", "cat_pyq")
    .eq("is_published", true)
    .single();
  if (setError || !set) throw new Error("The first-session diagnostic passage is unavailable.");

  const { data: questions, error: questionError } = await supabaseAdmin
    .from("daily_rc_questions")
    .select("id,order_no,question_text,options,correct_answer,question_enrichment")
    .eq("daily_rc_set_id", set.id)
    .order("order_no", { ascending: true });
  if (questionError || questions?.length !== 4) throw new Error("The first-session diagnostic must contain exactly four questions.");
  if (questions.some((question) => !Array.isArray(question.options) || question.options.length !== 4 || !Number.isInteger(Number(question.correct_answer)) || Number(question.correct_answer) < 1 || Number(question.correct_answer) > 4)) {
    throw new Error("The first-session diagnostic has an invalid option or answer-key record.");
  }

  const passage = Array.isArray(set.passage_json) && set.passage_json.length
    ? set.passage_json.map((text) => String(text || "").trim()).filter(Boolean)
    : String(set.passage || "").split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean);
  if (!passage.length) throw new Error("The first-session passage is unavailable.");

  return {
    set: {
      id: set.id,
      title: set.title,
      source_year: set.source_year,
      passage,
      passage_enrichment: set.passage_enrichment || {},
      timer_minutes: 8,
    },
    questions: questions.map((question) => includeAnswers
      ? { ...diagnosticQuestionForClient(question), correct_answer: question.correct_answer, question_enrichment: question.question_enrichment || {} }
      : diagnosticQuestionForClient(question)),
  };
}

async function finalizeDiagnostic(journey) {
  const { set, questions } = await loadDiagnosticContent(true);
  const now = new Date();
  const deadline = new Date(journey.diagnostic_deadline_at);
  const started = new Date(journey.diagnostic_started_at);
  const elapsedSeconds = Math.max(0, Math.min(480, Math.ceil((Math.min(now, deadline) - started) / 1000)));
  const { correct } = scoreDiagnostic(questions, journey.diagnostic_answers, journey.diagnostic_started_at);
  const { data: updated, error } = await supabaseAdmin
    .from("first_session_journeys")
    .update({
      phase: "DIAGNOSTIC_COMPLETED",
      diagnostic_set_id: set.id,
      diagnostic_score: correct,
      diagnostic_time_taken_seconds: elapsedSeconds,
      diagnostic_completed_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", journey.id)
    .eq("phase", "DIAGNOSTIC_IN_PROGRESS")
    .select("*")
    .maybeSingle();
  if (error) throw new Error("Your diagnostic could not be saved. Please retry.");
  return updated || journey;
}

export async function getFirstSessionState(userId) {
  const { data: journey, error } = await supabaseAdmin
    .from("first_session_journeys")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Your first-session progress could not be loaded.");
  if (!journey) return { required: false, journey: null };

  let current = journey;
  const now = new Date();
  if (current.phase === "PROFILE_COMPLETE") {
    const { data, error: transitionError } = await supabaseAdmin
      .from("first_session_journeys")
      .update({ phase: "DIAGNOSTIC_NOT_STARTED", updated_at: now.toISOString() })
      .eq("id", current.id)
      .eq("phase", "PROFILE_COMPLETE")
      .select("*")
      .maybeSingle();
    if (transitionError) throw new Error("Your first-session progress could not be updated.");
    current = data || { ...current, phase: "DIAGNOSTIC_NOT_STARTED" };
  }

  if (current.phase === "DIAGNOSTIC_IN_PROGRESS" && new Date(current.diagnostic_deadline_at) <= now) {
    current = await finalizeDiagnostic(current);
  }
  if (current.phase === "DAILY_RC_MISSION" && current.mission_challenge_date && current.mission_started_at) {
    const { data: mission } = await supabaseAdmin.from("daily_rc_sets")
      .select("id")
      .eq("challenge_date", current.mission_challenge_date)
      .eq("category", "daily_rc_challenge")
      .eq("is_published", true)
      .maybeSingle();
    if (mission) {
      const { data: attempt } = await supabaseAdmin.from("daily_rc_attempts")
        .select("id,completed_at")
        .eq("user_id", userId)
        .eq("daily_rc_set_id", mission.id)
        .not("completed_at", "is", null)
        .maybeSingle();
      if (attempt && new Date(attempt.completed_at) >= new Date(current.mission_started_at)) {
        if (await hasCompleteDailyRcAnswerRows(attempt.id, mission.id)) {
          const { data: completed } = await supabaseAdmin.from("first_session_journeys")
            .update({ phase: "DAILY_RC_COMPLETED", mission_daily_set_id: mission.id, mission_daily_attempt_id: attempt.id, mission_completed_at: attempt.completed_at, updated_at: now.toISOString() })
            .eq("id", current.id)
            .eq("phase", "DAILY_RC_MISSION")
            .select("*")
            .maybeSingle();
          if (completed) current = completed;
        }
      }
    }
  }
  if (current.phase === "DAILY_RC_COMPLETED") {
    const { data, error: transitionError } = await supabaseAdmin
      .from("first_session_journeys")
      .update({ phase: "NORMAL_HOME", updated_at: now.toISOString() })
      .eq("id", current.id)
      .eq("phase", "DAILY_RC_COMPLETED")
      .select("*")
      .maybeSingle();
    if (transitionError) throw new Error("Your first-session progress could not be updated.");
    current = data || { ...current, phase: "NORMAL_HOME" };
  }

  const result = { required: current.phase !== "NORMAL_HOME", journey: current };
  if (current.phase === "DIAGNOSTIC_NOT_STARTED" || current.phase === "DIAGNOSTIC_IN_PROGRESS") {
    result.diagnostic = await loadDiagnosticContent(false);
  }
  if (current.phase === "DIAGNOSTIC_COMPLETED" || current.phase === "DIAGNOSIS_VIEWED" || current.phase === "DAILY_RC_MISSION") {
    const { set, questions } = await loadDiagnosticContent(true);
    const score = scoreDiagnostic(questions, current.diagnostic_answers, current.diagnostic_started_at);
    result.report = {
      attempt_id: current.id,
      set_id: set.id,
      title: set.title,
      source_year: set.source_year,
      passage: set.passage,
      passage_enrichment: set.passage_enrichment,
      score: score.correct,
      total_questions: 4,
      time_taken_seconds: current.diagnostic_time_taken_seconds || 0,
      questions: score.reviewedQuestions,
      replay: summarizeReadingReplay(current.reading_events),
      completed_at: current.diagnostic_completed_at,
    };
  }
  if (current.phase === "DAILY_RC_MISSION" || current.phase === "DIAGNOSIS_VIEWED" || current.phase === "DIAGNOSTIC_COMPLETED") {
    const missionDate = dailyRcTodayDate();
    const { data: mission, error: missionError } = await filterTodaysDailyRc(
      supabaseAdmin.from("daily_rc_sets").select("id,title,source_year,timer_minutes"),
      missionDate,
    ).maybeSingle();
    if (!missionError && mission) result.mission = mission;
  }
  if (current.phase === "DIAGNOSTIC_IN_PROGRESS") {
    result.server_now = now.toISOString();
    result.answers = current.diagnostic_answers;
    result.reading_events = current.reading_events;
  }
  return result;
}

export async function startDiagnostic(userId) {
  const state = await getFirstSessionState(userId);
  if (!state.required || !state.journey) throw new Error("The first-session flow is already complete.");
  if (state.journey.phase === "DIAGNOSTIC_IN_PROGRESS") return { ...state, server_now: new Date().toISOString() };
  if (state.journey.phase !== "DIAGNOSTIC_NOT_STARTED") throw new Error("The diagnostic cannot be started from this step.");

  const now = new Date();
  const { data: journey, error } = await supabaseAdmin
    .from("first_session_journeys")
    .update({
      phase: "DIAGNOSTIC_IN_PROGRESS",
      diagnostic_set_id: FIRST_SESSION_DIAGNOSTIC_SET_ID,
      diagnostic_started_at: now.toISOString(),
      diagnostic_deadline_at: new Date(now.getTime() + FIRST_SESSION_TIME_LIMIT_SECONDS * 1000).toISOString(),
      diagnostic_answers: [],
      reading_events: [],
      updated_at: now.toISOString(),
    })
    .eq("id", state.journey.id)
    .eq("phase", "DIAGNOSTIC_NOT_STARTED")
    .select("*")
    .maybeSingle();
  if (error) throw new Error("The diagnostic could not be started.");
  if (!journey) return getFirstSessionState(userId);
  return getFirstSessionState(userId);
}

export async function saveDiagnosticAnswer(userId, questionId, selectedOption) {
  if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption > 3) throw new Error("Choose one of the four options.");
  const { data: journey, error } = await supabaseAdmin.from("first_session_journeys").select("*").eq("user_id", userId).single();
  if (error || journey.phase !== "DIAGNOSTIC_IN_PROGRESS") throw new Error("The diagnostic is no longer accepting answers.");
  if (new Date(journey.diagnostic_deadline_at) <= new Date()) throw new Error("Time is up. Your saved answers are being scored.");
  const { data: question, error: questionError } = await supabaseAdmin
    .from("daily_rc_questions")
    .select("id,options")
    .eq("id", questionId)
    .eq("daily_rc_set_id", FIRST_SESSION_DIAGNOSTIC_SET_ID)
    .single();
  if (questionError || !question || !Array.isArray(question.options) || selectedOption >= question.options.length) throw new Error("That question is not part of this diagnostic.");

  const now = new Date().toISOString();
  const answers = Array.isArray(journey.diagnostic_answers) ? [...journey.diagnostic_answers] : [];
  const index = answers.findIndex((answer) => answer.question_id === questionId);
  const prior = index >= 0 ? answers[index] : null;
  if (prior?.selected_option === selectedOption) return { is_change: false, is_repeat: true, answered_at: prior.answered_at };
  const entry = {
    question_id: questionId,
    selected_option: selectedOption,
    answered_at: now,
    history: [...(prior?.history || []), { selected_option: selectedOption, at: now }],
  };
  if (index >= 0) answers[index] = entry;
  else answers.push(entry);

  const { error: updateError } = await supabaseAdmin.from("first_session_journeys")
    .update({ diagnostic_answers: answers, updated_at: now })
    .eq("id", journey.id)
    .eq("phase", "DIAGNOSTIC_IN_PROGRESS");
  if (updateError) throw new Error("Your answer could not be saved. Retry the selection.");
  return { is_change: Boolean(prior), answered_at: now };
}

export async function saveReadingEvent(userId, event) {
  const visibleMs = Math.max(0, Math.min(120000, Number(event?.visible_ms) || 0));
  const eventType = event?.event_type === "viewport_interval" ? "viewport_interval" : event?.event_type === "paragraph_entered" ? "paragraph_entered" : "paragraph_left";
  const visibleIndexes = Array.isArray(event?.visible_paragraph_indexes)
    ? [...new Set(event.visible_paragraph_indexes.map(Number))].filter((index) => Number.isInteger(index) && index >= 0 && index <= 20).sort((a, b) => a - b)
    : [];
  const paragraphIndex = Number(event?.paragraph_index);
  if (eventType === "viewport_interval" ? visibleIndexes.length === 0 || visibleIndexes.length !== new Set(event.visible_paragraph_indexes.map(Number)).size : !Number.isInteger(paragraphIndex) || paragraphIndex < 0 || paragraphIndex > 20) throw new Error("Invalid paragraph telemetry.");
  const { data: journey, error } = await supabaseAdmin.from("first_session_journeys").select("id,phase,diagnostic_deadline_at,reading_events").eq("user_id", userId).single();
  if (error || journey.phase !== "DIAGNOSTIC_IN_PROGRESS" || new Date(journey.diagnostic_deadline_at) <= new Date()) throw new Error("The diagnostic is no longer collecting replay data.");
  const events = Array.isArray(journey.reading_events) ? journey.reading_events.slice(-MAX_READING_EVENTS + 1) : [];
  events.push(eventType === "viewport_interval"
    ? { event_type: eventType, visible_paragraph_indexes: visibleIndexes, interval_id: String(event.interval_id || "").slice(0, 80), visible_ms: visibleMs, captured_at: new Date().toISOString() }
    : { event_type: eventType, paragraph_index: paragraphIndex, visible_ms: visibleMs, captured_at: new Date().toISOString() });
  const { error: updateError } = await supabaseAdmin.from("first_session_journeys")
    .update({ reading_events: events, updated_at: new Date().toISOString() })
    .eq("id", journey.id)
    .eq("phase", "DIAGNOSTIC_IN_PROGRESS");
  if (updateError) throw new Error("Reading replay could not be saved.");
}

export async function submitDiagnostic(userId) {
  const { data: journey, error } = await supabaseAdmin.from("first_session_journeys").select("*").eq("user_id", userId).single();
  if (error) throw new Error("Your diagnostic session could not be found.");
  if (journey.phase === "DIAGNOSTIC_IN_PROGRESS") return getFirstSessionState(userId).then((state) => {
    if (state.journey?.phase === "DIAGNOSTIC_IN_PROGRESS") return finalizeDiagnostic(journey).then(() => getFirstSessionState(userId));
    return state;
  });
  if (journey.phase === "DIAGNOSTIC_COMPLETED" || journey.phase === "DIAGNOSIS_VIEWED" || journey.phase === "DAILY_RC_MISSION") return getFirstSessionState(userId);
  throw new Error("The diagnostic cannot be submitted from this step.");
}

export async function markReportViewed(userId) {
  const { data: journey, error } = await supabaseAdmin.from("first_session_journeys").select("id,phase").eq("user_id", userId).single();
  if (error) throw new Error("Your report could not be loaded.");
  if (journey.phase === "DIAGNOSTIC_COMPLETED") {
    const { error: updateError } = await supabaseAdmin.from("first_session_journeys")
      .update({ phase: "DIAGNOSIS_VIEWED", updated_at: new Date().toISOString() })
      .eq("id", journey.id)
      .eq("phase", "DIAGNOSTIC_COMPLETED");
    if (updateError) throw new Error("Your report view could not be saved.");
  }
  return getFirstSessionState(userId);
}

export async function startDailyRcMission(userId) {
  const state = await getFirstSessionState(userId);
  if (state.journey?.phase !== "DIAGNOSIS_VIEWED" && state.journey?.phase !== "DAILY_RC_MISSION") throw new Error("Complete the diagnostic report before starting the mission.");
  const challengeDate = dailyRcTodayDate();
  const { data: mission, error: missionError } = await filterTodaysDailyRc(
    supabaseAdmin.from("daily_rc_sets").select("id,title,source_year"),
    challengeDate,
  ).maybeSingle();
  if (missionError || !mission) throw new Error("Today's Daily RC mission is not available yet.");
  const { data: journey, error } = await supabaseAdmin.from("first_session_journeys")
    .update({ phase: "DAILY_RC_MISSION", mission_challenge_date: challengeDate, mission_daily_set_id: mission.id, mission_started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("phase", ["DIAGNOSIS_VIEWED", "DAILY_RC_MISSION"])
    .select("*")
    .single();
  if (error || !journey) throw new Error("The Daily RC mission could not be started.");
  return { challenge_date: challengeDate, mission };
}

export async function completeDailyRcMission(userId) {
  const { data: journey, error: journeyError } = await supabaseAdmin.from("first_session_journeys").select("*").eq("user_id", userId).single();
  if (!journeyError && ["DAILY_RC_COMPLETED", "NORMAL_HOME"].includes(journey.phase) && journey.mission_daily_attempt_id) {
    return { attempt_id: journey.mission_daily_attempt_id, first_session_attempt_id: journey.id };
  }
  if (journeyError || journey.phase !== "DAILY_RC_MISSION" || !journey.mission_challenge_date) throw new Error("There is no active first-session Daily RC mission.");
  const { data: mission, error: missionError } = await supabaseAdmin.from("daily_rc_sets")
    .select("id")
    .eq("challenge_date", journey.mission_challenge_date)
    .eq("category", "daily_rc_challenge")
    .eq("is_published", true)
    .single();
  if (missionError || !mission) throw new Error("The Daily RC mission could not be verified.");
  const { data: attempt, error: attemptError } = await supabaseAdmin.from("daily_rc_attempts")
    .select("id,completed_at")
    .eq("user_id", userId)
    .eq("daily_rc_set_id", mission.id)
    .not("completed_at", "is", null)
    .maybeSingle();
  if (attemptError || !attempt || new Date(attempt.completed_at) < new Date(journey.mission_started_at)) throw new Error("Finish today's Daily RC before continuing.");
  if (!(await hasCompleteDailyRcAnswerRows(attempt.id, mission.id))) throw new Error("The Daily RC answer record is incomplete.");
  const { error } = await supabaseAdmin.from("first_session_journeys")
    .update({ phase: "DAILY_RC_COMPLETED", mission_daily_set_id: mission.id, mission_daily_attempt_id: attempt.id, mission_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", journey.id)
    .eq("phase", "DAILY_RC_MISSION");
  if (error) throw new Error("Your completed mission could not be recorded.");
  return { attempt_id: attempt.id, first_session_attempt_id: journey.id };
}
