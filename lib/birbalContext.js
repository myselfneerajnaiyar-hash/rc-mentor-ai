import { getStudentProfile } from "@/lib/studentProfile";

export async function getBirbalContext(supabase, userId) {

  // -----------------------------
  // PROFILE
  // -----------------------------

  const profile = await getStudentProfile(supabase, userId);

  // -----------------------------
  // RC SESSIONS
  // -----------------------------

  const { data: rcSessions = [] } = await supabase
    .from("rc_sessions")
    .select("*")
    .eq("user_id", userId);

  const sessionIds = rcSessions.map(s => s.id);

  const { data: rcQuestions = [] } = await supabase
    .from("rc_session_questions")
    .select("*")
    .in("session_id", sessionIds);

  // -----------------------------
  // DAILY RC
  // -----------------------------

  const { data: dailyRC = [] } = await supabase
    .from("daily_rc_attempts")
    .select("*")
    .eq("user_id", userId);

  // -----------------------------
  // WORKOUT
  // -----------------------------

  const { data: workout = [] } = await supabase
    .from("workout_attempts")
    .select("*")
    .eq("user_id", userId);

  // -----------------------------
  // SPEED
  // -----------------------------

  const { data: speed = [] } = await supabase
    .from("speed_sessions")
    .select("*")
    .eq("user_id", userId);

    const averageWPM =
  speed.length === 0
    ? null
    : Math.round(
        speed.reduce(
          (sum, s) => sum + (s.effective_wpm || 0),
          0
        ) / speed.length
      );

  // -----------------------------
  // VOCAB
  // -----------------------------

  const { data: vocab = [] } = await supabase
    .from("vocab_sessions")
    .select("*")
    .eq("user_id", userId);

  // -----------------------------
  // WORD HUNT
  // -----------------------------

  const { data: wordhunt = [] } = await supabase
    .from("hangman_attempts")
    .select("*")
    .eq("user_id", userId);

  // -----------------------------
  // SECTIONALS
  // -----------------------------

  const [
    mentorTests,
    mentorVA,
    mentorPassages,
    mentorQuestions
  ] = await Promise.all([

    supabase
      .from("mentor_test_attempts")
      .select("*")
      .eq("user_id", userId),

    supabase
      .from("mentor_va_attempts")
      .select("*")
      .eq("user_id", userId),

    supabase
      .from("mentor_rc_passage_attempts")
      .select("*")
      .eq("user_id", userId),

    supabase
      .from("mentor_rc_question_attempts")
      .select("*")
      .eq("user_id", userId)

  ]);

  // -----------------------------
  // FOR NOW
  // -----------------------------

// -----------------------------
// RC ANALYTICS
// -----------------------------

const totalQuestions = rcQuestions.length;

const correctQuestions = rcQuestions.filter(
  q => q.is_correct
).length;

const overallAccuracy =
  totalQuestions === 0
    ? 0
    : Math.round((correctQuestions / totalQuestions) * 100);

const totalTime = rcQuestions.reduce(
  (sum, q) => sum + (q.time_taken_sec || 0),
  0
);

const averageTime =
  totalQuestions === 0
    ? 0
    : Math.round(totalTime / totalQuestions);

const questionTypes = {};

rcQuestions.forEach(q => {

  const type = q.question_type || "Unknown";

  if (!questionTypes[type]) {
    questionTypes[type] = {
      total: 0,
      correct: 0
    };
  }

  questionTypes[type].total++;

  if (q.is_correct)
    questionTypes[type].correct++;

});

let strongestSkill = "";
let weakestSkill = "";

let bestAccuracy = -1;
let worstAccuracy = 101;

Object.entries(questionTypes).forEach(([type, stat]) => {

  if (stat.total < 3) return;

  const accuracy = Math.round(
    (stat.correct / stat.total) * 100
  );

  if (accuracy > bestAccuracy) {
    bestAccuracy = accuracy;
    strongestSkill = type;
  }

  if (accuracy < worstAccuracy) {
    worstAccuracy = accuracy;
    weakestSkill = type;
  }

});

const skills = Object.entries(questionTypes).map(
  ([type, stat]) => ({
    type,
    total: stat.total,
    accuracy:
      stat.total === 0
        ? 0
        : Math.round((stat.correct / stat.total) * 100)
  })
);

// -----------------------------
// READING IQ
// -----------------------------

let readingIQ = 50;

readingIQ += Math.floor(overallAccuracy / 5);

readingIQ += Math.min(rcSessions.length, 20);

readingIQ += Math.min(workout.length, 10);

readingIQ += Math.min(speed.length, 10);

readingIQ = Math.min(readingIQ, 150);

let readerType = "Developing Reader";

if (readingIQ >= 120)
  readerType = "Elite Reader";
else if (readingIQ >= 100)
  readerType = "Strategic Reader";
else if (readingIQ >= 80)
  readerType = "Consistent Reader";



  // -----------------------------
// STUDENT SUMMARY
// -----------------------------



// -----------------------------
// READING DNA
// -----------------------------

const readingDNA = {

  readingIQ,

  readerType,

  strongestSkill,

  weakestSkill,

  overallAccuracy,

  averageTime

};
// -----------------------------
// RECENT ACTIVITY
// -----------------------------

const recentActivity = {
  rcSessions: rcSessions.length,
  vocabularySessions: vocab.length,
  speedSessions: speed.length,
  workoutAttempts: workout.length,
  dailyRCAttempts: dailyRC.length,
  wordHuntAttempts: wordhunt.length,
  sectionalTests: mentorTests.data?.length || 0
};


const analytics = {

  readingIQ,

  readerType,

  overallAccuracy,

  averageTime,

  averageWPM,

  strongestSkill,

  weakestSkill,

  totalQuestions,

  totalRCSessions: rcSessions.length,

  skills

};

const recommendations = [];

if (overallAccuracy < 70) {
  recommendations.push("Complete Today's Daily Workout");
}

if (averageTime > 70) {
  recommendations.push("Practice Speed Drill");
}

if (weakestSkill) {
 recommendations.push(
  "Generate 2 Medium RCs using RC Generator"
);
}

if (vocab.length < 10) {
  recommendations.push("Revise Vocabulary Trainer");
}


 return {

  profile,

  analytics,

  

  readingDNA,

  recentActivity,
  recommendations,

  rcSessions,

  rcQuestions,

  dailyRC,

  workout,

  speed,

  vocab,

  wordhunt,

  sectionals: {
    tests: mentorTests.data || [],
    va: mentorVA.data || [],
    passages: mentorPassages.data || [],
    questions: mentorQuestions.data || []
  }

};
}