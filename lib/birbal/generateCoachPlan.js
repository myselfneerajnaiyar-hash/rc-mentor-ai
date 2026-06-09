export function generateCoachPlan({
  stats,
  dna,
  insight,
  playedToday,
  completedArenaToday,
  completedWorkoutToday
}) {

  const weakness =
    insight?.weakness || "Inference Questions";

  const strength =
    insight?.strength || "Not enough data";

  let diagnosis = "";

  let prescription = "";

  let passage = "";

  // Weakness analysis

  if (weakness.includes("Inference")) {

    diagnosis =
      "You are struggling to read between the lines. Inference questions are costing you marks.";

    prescription =
      "Practice one Philosophy RC and focus only on inference questions.";

    passage =
      "📖 Philosophy RC • Inference Focus";
  }

  else if (weakness.includes("Tone")) {

    diagnosis =
      "You can understand content but often miss the author's attitude.";

    prescription =
      "Practice one Editorial RC and identify tone after every paragraph.";

    passage =
      "📰 Editorial RC • Tone Focus";
  }

  else if (weakness.includes("Main Idea")) {

    diagnosis =
      "You understand details but lose track of the central argument.";

    prescription =
      "Practice one Science RC and write a one-line summary.";

    passage =
      "🔬 Science RC • Main Idea Focus";
  }

  else {

    diagnosis =
      "Your performance is inconsistent across RC skills.";

    prescription =
      "Complete a balanced CAT-level passage today.";

    passage =
      "📖 CAT RC • Mixed Focus";
  }

  return {

    diagnosis,

    prescription,

    iq: stats?.iq || 0,

    readerType:
      dna?.type || "Developing Reader",

    strength,

    weakness,

    missions: [

      {
        title: "🔥 Daily CAT Challenge",
        completed: completedArenaToday
      },

     {
  title: passage,
  completed: completedWorkoutToday
},
      {
        title: "🧩 Word Hunt",
        completed: playedToday
      }

    ]

  };
}