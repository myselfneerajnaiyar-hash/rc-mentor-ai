import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function GET(req) {

const { searchParams } =
  new URL(req.url);

const userId =
  searchParams.get("userId");

  if (!userId) {
    return Response.json({
      error: "No user id"
    });
  }
const today =
  new Date()
    .toISOString()
    .split("T")[0];

const { data: existingMission } =
  await supabaseAdmin
    .from("birbal_daily_missions")
    .select("*")
    .eq("user_id", userId)
    .eq("mission_date", today)
    .maybeSingle();
if (existingMission) {

  const coach =
    existingMission.coach_json;

  coach.missions =
    await addMissionCompletion(
      coach.missions,
      userId
    );

  return Response.json({
    coach
  });

}

  const { data: rcSessions } =
    await supabaseAdmin
      .from("rc_sessions")
      .select("*")
      .eq("user_id", userId);

  const { data: challenges } =
    await supabaseAdmin
      .from("daily_rc_attempts")
      .select("*")
      .eq("user_id", userId);

  const { data: workouts } =
    await supabaseAdmin
      .from("workout_attempts")
      .select("*")
      .eq("user_id", userId);

      const { data: wordhunt } =
  await supabaseAdmin
    .from("hangman_attempts")
    .select("*")
    .eq("user_id", userId);

const { data: speed } =
  await supabaseAdmin
    .from("speed_sessions")
    .select("*")
    .eq("user_id", userId);

const { data: vocab } =
  await supabaseAdmin
    .from("vocab_sessions")
    .select("*")
    .eq("user_id", userId);

 const rcAttempts = rcSessions?.length || 0;
const challengeAttempts = challenges?.length || 0;
const workoutAttempts = workouts?.length || 0;
const wordhuntAttempts =
  wordhunt?.length || 0;

const speedAttempts =
  speed?.length || 0;

const vocabAttempts =
  vocab?.length || 0;

  const userData = {
  rcAttempts,
  challengeAttempts,
  workoutAttempts,
  wordhuntAttempts,
  speedAttempts,
  vocabAttempts
};

const readingIQ = Math.min(
  150,
  80 +
  (rcAttempts * 2) +
  challengeAttempts +
  workoutAttempts +
  wordhuntAttempts +
  speedAttempts +
  vocabAttempts
);

let readerType = "Developing Reader";

if (rcAttempts >= 20)
  readerType = "Analytical Reader";

if (speedAttempts >= 20)
  readerType = "Fast Reader";

if (
  rcAttempts >= 20 &&
  speedAttempts >= 20 &&
  vocabAttempts >= 10
)
  readerType = "Strategic Reader";

const { data: profile } =
  await supabaseAdmin
    .from("profiles")
    .select("name, exam")
    .eq("user_id", userId)
    .single();

const userName =
  profile?.name || "Student";

const exam =
  profile?.exam || "";

  const availableActivities =
exam === "CAT"
? `
Available activities:

1. Daily RC Arena
2. Daily Workout
3. Word Hunt
4. Speed Drill
5. Vocabulary Drill
6. RC Passage Practice

Daily RC Arena MUST always be included.

Choose exactly 2 additional missions from:

- Daily Workout
- Word Hunt
- Speed Drill
- Vocabulary Drill
- RC Passage Practice
`
: `
Available activities:

1. Daily Workout
2. Word Hunt
3. Speed Drill
4. Vocabulary Drill
5. RC Passage Practice

Choose exactly 3 missions from:


- Daily Workout
- Word Hunt
- Speed Drill
- Vocabulary Drill
- RC Passage Practice

Never return "Daily RC Arena".
It is not available for this student.
`;

console.log("Exam =", exam);

const prompt = `
You are Birbal.

Analyze this student's activity.



${JSON.stringify(userData)}
${availableActivities}


Return JSON only:

{
  "strength":"",
  "weakness":"",
  "diagnosis":"",
  "prescription":"",
 "missions":[
  {
    "title":"",
    "activityType":""
  }
]
}

Rules:

Student name:
${userName}

Student Reading IQ:
${readingIQ}

Student Reader Type:
${readerType}

Use the supplied Reading IQ.
Use the supplied Reader Type.
Do NOT generate or modify them.

Always address the student by name.
Use the student's name in diagnosis and prescription.
Speak like Birbal is talking directly to them.

- Generate realistic IQ between 50 and 150


- strength must be a short phrase
- weakness must be a short phrase

- diagnosis should address the student directly
- prescription should address the student directly

Examples:

Diagnosis:
"Vidhyut, you are showing strong analytical ability but your reading speed is slowing your overall performance."

Prescription:
"Vidhyut, complete one Speed Drill and one Daily Workout today to improve reading fluency."

Never use:
"The student..."
"This student..."
"The learner..."

- choose exactly 3 missions

- completed must always be false
`;

const completion =
  await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

const content =
  completion.choices[0].message.content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

const coach = JSON.parse(content);

coach.iq = readingIQ;
coach.readerType = readerType;

// Remove CAT mission for non-CAT exams
if (exam !== "CAT") {
  coach.missions = coach.missions.filter(
    m => m.title !== "Daily RC Arena"
  );
}

if (exam === "CAT") {

  coach.missions = [
    {
      title: "Daily RC Arena",
      activityType: "daily_rc_attempts"
    },
    ...coach.missions
  ];

}

coach.missions =
  coach.missions.filter(
    (mission, index, self) =>
      index === self.findIndex(
        m => m.title === mission.title
      )
  );

coach.missions =
  coach.missions.slice(0, 3);

  coach.missions =
  await addMissionCompletion(
    coach.missions,
    userId
  );

await supabaseAdmin
  .from("birbal_daily_missions")
  .insert({
    user_id: userId,
    mission_date: today,
    coach_json: coach
  });

return Response.json({
  coach,
  userData
});
}

async function addMissionCompletion(
  missions,
  userId
) {

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  for (const mission of missions) {

    mission.completed = false;

    if (mission.title === "Daily RC Arena") {

      const { data } =
        await supabaseAdmin
          .from("daily_rc_attempts")
          .select("id")
          .eq("user_id", userId)
          .gte(
            "completed_at",
            `${today}T00:00:00`
          )
          .limit(1);

      mission.completed =
        data?.length > 0;
    }

    else if (
      mission.title === "Daily Workout"
    ) {

      const { data } =
        await supabaseAdmin
          .from("workout_attempts")
          .select("id")
          .eq("user_id", userId)
          .gte(
            "completed_at",
            `${today}T00:00:00`
          )
          .limit(1);

      mission.completed =
        data?.length > 0;
    }

    else if (
      mission.title === "Word Hunt"
    ) {

      const { data } =
        await supabaseAdmin
          .from("hangman_attempts")
          .select("id")
          .eq("user_id", userId)
          .eq("attempt_date", today)
          .limit(1);

      mission.completed =
        data?.length > 0;
    }

    else if (
      mission.title === "Speed Drill"
    ) {

      const { data } =
        await supabaseAdmin
          .from("speed_sessions")
          .select("created_at")
          .eq("user_id", userId)
          .gte(
            "created_at",
            `${today}T00:00:00`
          )
          .limit(1);

      mission.completed =
        data?.length > 0;
    }

    else if (
      mission.title === "Vocabulary Drill"
    ) {

      const { data } =
        await supabaseAdmin
          .from("vocab_sessions")
          .select("created_at")
          .eq("user_id", userId)
          .gte(
            "created_at",
            `${today}T00:00:00`
          )
          .limit(1);

      mission.completed =
        data?.length > 0;
    }

    else if (
      mission.title === "RC Passage Practice"
    ) {

      const { data } =
        await supabaseAdmin
          .from("rc_sessions")
          .select("created_at")
          .eq("user_id", userId)
          .gte(
            "created_at",
            `${today}T00:00:00`
          )
          .limit(1);

      mission.completed =
        data?.length > 0;
    }
  }

  return missions;
}