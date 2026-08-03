import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OpenAI from "openai";
import { getBirbalContext } from "@/lib/birbalContext";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function GET(req) {
      console.log("========== BIRBAL COACH ROUTE HIT ==========");

const { searchParams } =
  new URL(req.url);

const userId =
  searchParams.get("userId");

  const context = await getBirbalContext(
  supabaseAdmin,
  userId
);

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

      console.log("Returning cached coach");

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

  const userData = context;

const readingIQ = context.analytics.readingIQ;

const readerType = context.analytics.readerType;

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
6. RC Generator

Daily RC Arena MUST always be included.

Choose exactly 2 additional missions from:

- Daily Workout
- Word Hunt
- Speed Drill
- Vocabulary Drill
- RC Generator
`
: `
Available activities:

1. Daily Workout
2. Word Hunt
3. Speed Drill
4. Vocabulary Drill
5. RC Generator

Choose ONLY from these modules:

- Daily RC Arena
- Daily Workout
- Word Hunt
- Speed Drill
- Vocabulary Trainer
- RC Generator

Never recommend any other activity.

Never invent modules.

missions MUST be an array of OBJECTS.

Example:

"missions":[
{
"title":"Daily Workout",
"priority":"High",
"reason":"Improve reading consistency"
},
{
"title":"Word Hunt",
"priority":"Medium",
"reason":"Build vocabulary"
},
{
"title":"Speed Drill",
"priority":"Medium",
"reason":"Increase reading speed"
}
]

Never return strings.
Never return only activity names.


Never return "Daily RC Arena".
It is not available for this student.
`;

console.log("Exam =", exam);

const prompt = `
You are Birbal.

Analyze the student's analytics, recent activity and recommendations.

Treat them as the source of truth.

Do not recalculate any metric.

Do not estimate Reading IQ.

Do not estimate reader type.

Do not estimate accuracy.

Use the supplied analytics exactly.



Student Analytics

${JSON.stringify(context.analytics, null, 2)}

Student Recent Activity

${JSON.stringify(context.recentActivity, null, 2)}
${availableActivities}

Student Recommendations

${JSON.stringify(context.recommendations, null, 2)}

Use ONLY these statistics.
Do NOT invent any numbers.
If you mention attempts, use only the values above.


Return EXACTLY this JSON object.

Do not omit any field.

{
  "strength":"",
  "weakness":"",
  "diagnosis":"",
  "prescription":"",
  "coachReport":"",
  "coachMetrics":{
    
  },
  "coachPlan":[
    {
      "priority":"",
      "title":"",
      "reason":""
    }
  ],
  "missions":[]
}

Never leave coachReport empty.
Never remove any key.
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



- strength must be a short phrase
- weakness must be a short phrase

- diagnosis should address the student directly
- prescription should address the student directly

coachReport should be a concise coaching report (120-180 words).

Use ONLY the analytics and activity provided.

Do NOT invent statistics.

Do NOT invent Reading IQ.

Do NOT invent reader type.

Do NOT mention any feature that does not exist.

Do NOT recommend RC Passage Practice.

Explain:

- what the student is currently doing well
- what needs improvement
- why today's missions were chosen

Finish with one motivating sentence from Birbal.

coachReport must NEVER be empty.
Return plain text only.

Examples:

Diagnosis:
"Vidhyut, you are showing strong analytical ability but your reading speed is slowing your overall performance."

Prescription:
"Vidhyut, complete one Speed Drill and one Daily Workout today to improve reading fluency."

Never use:
"The student..."
"This student..."
"The learner..."

- Return exactly 3 missions from the allowed modules above.

- completed must always be false
`;

const completion =
  await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: {
      type: "json_object"
    },
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
if (Array.isArray(coach.missions)) {
  coach.missions = coach.missions.map((m) => {
    if (typeof m === "string") {
      return {
        title: m,
        priority: "Medium",
        reason: "Recommended by Birbal"
      };
    }
    return m;
  });
}

if (!coach.coachMetrics) {
  coach.coachMetrics = {};
}

coach.coachMetrics.level = readerType;
if (!coach.coachReport?.trim()) {
  coach.coachReport =
`${userName}, your Reading IQ is ${readingIQ} and your current reader type is ${readerType}.

You have made progress, but Birbal believes consistent practice is the key to becoming an exceptional reader.

Your diagnosis indicates that your biggest strength is "${coach.strength}" while your biggest challenge is "${coach.weakness}".

Follow today's prescription carefully and complete the suggested missions. Small improvements every day will compound into a major improvement in your CAT VARC performance.

Remember, great readers are not born—they are trained.`;
}
console.log("Coach keys:", Object.keys(coach));
console.log("Coach JSON:", coach);
console.log(JSON.stringify(coach, null, 2));

coach.iq = readingIQ;
coach.readerType = readerType;
coach.coachMetrics.level = readerType;

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
console.log("MISSIONS:", coach.missions);
console.log("COACH:", JSON.stringify(coach, null, 2));

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

  // Skip invalid missions
  if (!mission || typeof mission !== "object") {
    continue;
  }

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
      mission.title === "RC Generator"
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