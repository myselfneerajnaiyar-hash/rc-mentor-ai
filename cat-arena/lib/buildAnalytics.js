export function buildAnalytics(attempt) {
    console.log(attempt.questions[0]);
     console.log("QUESTIONS", attempt.questions);
     console.log("ANSWERS", attempt.answers);
console.log("QUESTION STATES", attempt.questionStates);
console.log("QUESTION TIME", attempt.questionTime);

  const attempted = attempt.attempted;
  const correct = attempt.correct;
  const wrong = attempt.wrong;
  const skipped = attempt.total - attempted;

  const kpis = {

    score: attempt.score,

    totalMarks: 66,

    accuracy:
      attempted === 0
        ? 0
        : Math.round((correct / attempted) * 100),

    attemptRate:
      Math.round((attempted / attempt.total) * 100),

    attempted,

    correct,

    wrong,

    skipped,

    total: attempt.total,

    totalTime: attempt.timeTaken

  };

  const speedAccuracy = attempt.questions.map((question, i) => {

  const selected = attempt.answers[i];
  const time = attempt.questionTime[i] || 0;

  let correct = 0;

  if (
    selected !== null &&
    selected !== undefined &&
    selected !== ""
  ) {

    if (question.correctIndex !== undefined) {

      correct =
        selected === question.correctIndex
          ? 1
          : 0;

    } else {

      const answer =
        String(question.correctAnswer).trim();

      if (question.type === "Para Jumble") {

        correct =
          String(selected).trim() === answer ? 1 : 0;

      }

      else if (question.type === "Odd Sentence Out") {

        correct =
          String(selected) === answer ? 1 : 0;

      }

      else if (question.type === "Sentence Placement") {

        correct =
          `Option ${Number(selected)+1}` === answer ? 1 : 0;

      }

      else if (question.type === "Para Summary") {

        correct =
          question.options?.[selected]?.trim() === answer
            ? 1
            : 0;
      }

    }

  }

  return {
    question: `Q${i+1}`,
    time,
    accuracy: correct,
    status: correct ? "Correct" : "Wrong"
  };

});

 const questionTimeline = attempt.questions.map((question, i) => {

  const selected = attempt.answers[i];
  const time = attempt.questionTime[i] || 0;

  let state = "Unattempted";

  if (
    selected !== null &&
    selected !== undefined &&
    selected !== ""
  ) {

    let isCorrect = false;

    // RC MCQ
    if (question.correctIndex !== undefined) {

      isCorrect =
        selected === question.correctIndex;

    }

    // VA
    else {

      const correctAnswer =
        String(question.correctAnswer).trim();

      if (question.type === "Para Jumble") {

        isCorrect =
          String(selected).trim() ===
          correctAnswer;

      }

      else if (question.type === "Odd Sentence Out") {

        isCorrect =
          String(selected) ===
          correctAnswer;

      }

      else if (question.type === "Sentence Placement") {

        isCorrect =
          `Option ${Number(selected) + 1}` ===
          correctAnswer;

      }

      else if (question.type === "Para Summary") {

        const selectedText =
          question.options?.[selected];

        isCorrect =
          selectedText?.trim() ===
          correctAnswer;
      }

    }

    state = isCorrect ? "Correct" : "Wrong";
  }

  return {
    question: `Q${i + 1}`,
    state,
    time,
  };

});

  const timePerQuestion = attempt.questionTime.map((time, i) => ({
    question: `Q${i + 1}`,
    seconds: time
  }));

 let running = 0;

const cumulativeScore = attempt.questions.map((question, i) => {

  const selected = attempt.answers[i];

  const attempted =
    selected !== null &&
    selected !== undefined &&
    selected !== "";

  if (!attempted) {
    return {
      question: `Q${i + 1}`,
      score: running,
    };
  }

  // MCQ
  if (question.correctIndex !== undefined) {

    if (selected === question.correctIndex) {
      running += 3;
    } else if (question.options.length > 0) {
      running -= 1;
    }

  }

  // TITA
  else {

    const correct =
      String(selected).trim() ===
      String(question.correctAnswer).trim();

    if (correct) {
      running += 3;
    }
    else if (question.options.length > 0) {
      // Only MCQ has negative marking
      running -= 1;
    }
  }

  return {
    question: `Q${i + 1}`,
    score: running,
  };
});

const passagePerformance =
  attempt.analysis?.passages || [];

  const accuracyTrend = [];

let correctTillNow = 0;
let attemptedTillNow = 0;

attempt.questions.forEach((question, i) => {

  const selected = attempt.answers[i];

  const attempted =
    selected !== null &&
    selected !== undefined &&
    selected !== "";

  if (!attempted) {

    accuracyTrend.push({
      question: `Q${i + 1}`,
      accuracy: null,
    });

    return;
  }

  attemptedTillNow++;

  let isCorrect = false;

  if (question.correctIndex !== undefined) {

    isCorrect =
      selected === question.correctIndex;

  } else {

    const answer =
      String(question.correctAnswer).trim();

    if (question.type === "Para Jumble") {

      isCorrect =
        String(selected).trim() === answer;

    }

    else if (question.type === "Odd Sentence Out") {

      isCorrect =
        String(selected) === answer;

    }

    else if (question.type === "Sentence Placement") {

      isCorrect =
        `Option ${Number(selected)+1}` === answer;

    }

    else if (question.type === "Para Summary") {

      isCorrect =
        question.options?.[selected]?.trim() === answer;

    }

  }

  if (isCorrect)
    correctTillNow++;

  accuracyTrend.push({

    question: `Q${i+1}`,

    accuracy:
      Math.round(
        (correctTillNow/attemptedTillNow)*100
      ),

    status:
      isCorrect ? "Correct" : "Wrong"

  });

});

function normalizeDifficulty(level = "") {

  level = String(level).toLowerCase();

  if (
    level.includes("easy") ||
    level.includes("low")
  ) return "Easy";

  if (
    level.includes("high") ||
    level.includes("hard") ||
    level.includes("difficult")
  ) return "Difficult";

  return "Medium";
}

const difficultyRows = [];

attempt.questions.forEach((question, i) => {

  const selected = attempt.answers[i];

  let diagnosis = {};

  try {

    diagnosis =
      question.explanation
        ? JSON.parse(question.explanation)
        : {};

  } catch {

    diagnosis = {};

  }

  difficultyRows.push({

    questionNumber: i + 1,

    difficulty:
      normalizeDifficulty(
        diagnosis.difficulty
      ),

    rawDifficulty:
      diagnosis.difficulty || "",

    type:
      question.type || "RC",

    topic:
      diagnosis.primarySkill ||
      diagnosis.skillTested ||
      "Unknown",

    status:
      questionTimeline[i].state,

    attempted:
      selected !== null &&
      selected !== undefined &&
      selected !== "",

    time:
      attempt.questionTime[i] || 0

  });

});

const difficultyAnalysis =
["Easy","Medium","Difficult"].map(level=>{

  const rows =
    difficultyRows.filter(
      r=>r.difficulty===level
    );

  return{

    difficulty:level,

    correct:
      rows.filter(
        r=>r.status==="Correct"
      ).length,

    wrong:
      rows.filter(
        r=>r.status==="Wrong"
      ).length,

    skipped:
      rows.filter(
        r=>!r.attempted
      ).length

  };

});

const difficultyTimeAnalysis =
["Easy","Medium","Difficult"].map(level=>{

  const rows =
    difficultyRows.filter(
      r=>r.difficulty===level
    );

  const attempted =
    rows.filter(
      r=>r.attempted
    );

  const avgTime =
    attempted.length
      ? Math.round(
          attempted.reduce(
            (sum,row)=>sum+row.time,
            0
          )/attempted.length
        )
      : 0;

  return{

    difficulty:level,

    attempted:
      attempted.length,

    correct:
      attempted.filter(
        r=>r.status==="Correct"
      ).length,

    averageTime:avgTime,

    idealTime:
      level==="Easy"
      ?"35-45 sec"
      :level==="Medium"
      ?"45-60 sec"
      :"70-90 sec",

    verdict:
      level==="Easy"
      ?avgTime>45
        ?"Too Slow"
        :"Good"
      :level==="Medium"
      ?avgTime>60
        ?"Too Slow"
        :"Good"
      :avgTime>90
      ?"Too Slow"
      :"Good"

  };

});

const topicPerformance =
Object.values(

difficultyRows.reduce((acc,row)=>{

if(!acc[row.topic]){

acc[row.topic]={

topic:row.topic,

attempted:0,

correct:0,

wrong:0,

totalTime:0

};

}

if(row.attempted){

acc[row.topic].attempted++;

acc[row.topic].totalTime+=row.time;

if(row.status==="Correct")

acc[row.topic].correct++;

else

acc[row.topic].wrong++;

}

return acc;

},{})

).map(topic=>({

...topic,

accuracy:

topic.attempted

?Math.round(

topic.correct*100/

topic.attempted

)

:0,

averageTime:

topic.attempted

?Math.round(

topic.totalTime/

topic.attempted

)

:0

}));

const difficultyTimeline =
difficultyRows;

const idealTime =
difficultyRows.reduce((sum,row)=>{

    if(row.difficulty==="Easy") return sum+40;
    if(row.difficulty==="Medium") return sum+55;
    return sum+80;

},0);

kpis.timeEfficiency =
Math.round(
    idealTime*100/kpis.totalTime
);

kpis.idealTime = idealTime;

/* ================= MARKS DISTRIBUTION ================= */

let rcMarks = 0;
let vaMarks = 0;

const rcPassageMarks = {};
const vaTypeMarks = {};

attempt.questions.forEach((question, i) => {

  const row = difficultyRows[i];

  if (!row.attempted) return;

  let marks = 0;

  if (row.status === "Correct")
    marks = 3;

  else if (
    row.status === "Wrong" &&
    question.options?.length > 0
  )
    marks = -1;

  if (
    question.correctIndex !== undefined
  ) {

    rcMarks += marks;

    const passage =
      question.passageNumber ||
      question.passage ||
      `Passage ${Math.ceil((i + 1) / 4)}`;

   if (!rcPassageMarks[passage]) {
  rcPassageMarks[passage] = {
    value: 0,
    correct: 0,
    wrong: 0,
    attempted: 0,
  };
}

rcPassageMarks[passage].value += marks;
rcPassageMarks[passage].attempted++;

if (row.status === "Correct")
  rcPassageMarks[passage].correct++;

if (row.status === "Wrong")
  rcPassageMarks[passage].wrong++;

  }

  else {

    vaMarks += marks;

    const type =
      question.type || "VA";

    if (!vaTypeMarks[type]) {
  vaTypeMarks[type] = {
    value: 0,
    correct: 0,
    wrong: 0,
    attempted: 0,
  };
}

vaTypeMarks[type].value += marks;
vaTypeMarks[type].attempted++;

if (row.status === "Correct")
  vaTypeMarks[type].correct++;

if (row.status === "Wrong")
  vaTypeMarks[type].wrong++;

  }

});

const marksDistribution = {

  total: [
  {
    name: "RC",
    value: rcMarks,
    correct: attempt.analysis?.passages
      ?.slice(0,4)
      ?.reduce((s,p)=>s+p.correct,0) || 0,
    wrong: attempt.analysis?.passages
      ?.slice(0,4)
      ?.reduce((s,p)=>s+p.wrong,0) || 0,
    attempted: attempt.analysis?.passages
      ?.slice(0,4)
      ?.reduce((s,p)=>s+p.total,0) || 0,
  },
  {
    name: "VA",
    value: vaMarks,
    correct: vaTypeMarks
      ? Object.values(vaTypeMarks).reduce((s,x)=>s+x.correct,0)
      : 0,
    wrong: vaTypeMarks
      ? Object.values(vaTypeMarks).reduce((s,x)=>s+x.wrong,0)
      : 0,
    attempted: vaTypeMarks
      ? Object.values(vaTypeMarks).reduce((s,x)=>s+x.attempted,0)
      : 0,
  },
],

rc: Object.entries(rcPassageMarks).map(([name, data]) => ({
  name,
  ...data,
})),

 va: Object.entries(vaTypeMarks).map(([name, data]) => ({
  name,
  ...data,
})),
};

kpis.rcScore = rcMarks;
kpis.vaScore = vaMarks;

kpis.rcCorrect = marksDistribution.total[0].correct;
kpis.rcAttempted = marksDistribution.total[0].attempted;

kpis.vaCorrect = marksDistribution.total[1].correct;
kpis.vaAttempted = marksDistribution.total[1].attempted;

kpis.marksLost = kpis.wrong;
kpis.negativeMarks = kpis.wrong;

  return {

    kpis,

    questionTimeline,

    timePerQuestion,

    cumulativeScore,

    sectionPerformance: [],

    difficultyBreakdown: [],

    skillRadar: [],

    speedAccuracy,
    passagePerformance,
    accuracyTrend,
    difficultyAnalysis,
    difficultyTimeAnalysis,

difficultyTimeline,
difficultyRows,
topicPerformance,
marksDistribution,

  sectionPerformance: [],
  difficultyBreakdown: [],
  skillRadar: [],

  };

}