"use client";

import { Card, CardContent } from "@/components/ui/card";


export default function BirbalCoachCard({
  coach
}) {

    if (!coach) return null;

    const missionIcons = {
  "Daily RC Arena": "🎯",
  "Daily Workout": "🔥",
  "Vocabulary Drill": "📚",
  "Word Hunt": "🧩",
  "Speed Drill": "⚡",
  "RC Passage Practice": "🧠"
};

  
  const completed =
    coach.missions.filter(
      m => m.completed === true
    ).length;

  const total =
  coach?.missions?.length || 0;

  const progress =
    total === 0
      ? 0
      : (completed / total) * 100;

      const missionCompleted =
  completed === total && total > 0;

  return (

  <Card
  className="
  mt-6
  w-full
  bg-gradient-to-br
  from-indigo-900/90
  via-slate-900
  to-cyan-950/90
  border
  border-cyan-500/20
  rounded-3xl
  backdrop-blur-xl
  shadow-[0_0_40px_rgba(34,211,238,0.12)]
  "
>
      <CardContent className="p-6">

     <div className="
grid
grid-cols-1
lg:grid-cols-[180px_1fr]
gap-6
">

          <div className="space-y-4">

  <img
    src="/birbal.png"
    className="
    w-20
    h-20
    rounded-full
    border
    border-indigo-500
    "
  />

  <div
    className="
    flex-1
    bg-slate-900/50
    border
    border-cyan-500/20
    rounded-2xl
    p-6
    text-center
    "
  >
    <div className="text-xs text-slate-400">
      Reading Score
    </div>

   <div className="
text-5xl
lg:text-4xl
font-bold
text-white
">
      {coach.iq}
    </div>

    <div className="text-cyan-400 text-sm">
      {coach.readerType}
    </div>

  </div>



</div>
<div>
          

            <div className="text-indigo-400 text-sm">
              🧠 Birbal's Coaching Plan
            </div>

            <div className="mt-3 space-y-1 text-slate-300 text-sm">

             
             <div
  className="
  mt-4
  bg-black/20
  border-l-4
  border-cyan-400
  rounded-xl
  p-3
  "
>

  <div className="text-slate-200 text-sm leading-relaxed">
    {coach.diagnosis}
  </div>

  <div className="mt-2 text-cyan-300 text-sm leading-relaxed">
    {coach.prescription}
  </div>

</div>

{missionCompleted && (

  <div
    className="
    mt-6
    rounded-2xl
    border
    border-green-500/30
    bg-green-500/10
    p-3
    text-center
    "
  >

    <div className="text-2xl">
      🎉
    </div>

    <div className="text-base font-bold text-green-400 mt-2">
      Mission Accomplished
    </div>

    <div className="text-slate-300 mt-2">
      Excellent work!
    </div>

    <div className="text-slate-400 text-sm mt-2">
      You completed all of today's missions.
      Birbal will prepare a fresh challenge tomorrow.
    </div>

  </div>

)}

              <div className="
grid
grid-cols-1
md:grid-cols-2
gap-3
mt-4
">

  <div className="bg-slate-900/60
border border-cyan-500/10 rounded-xl p-4">

    <div className="text-xs text-slate-400">
      Strength
    </div>

    <div className="text-green-400 font-medium">
      {coach.strength}
    </div>

  </div>

  <div className="bg-slate-900/60
border border-cyan-500/10 rounded-xl p-4">

    <div className="text-xs text-slate-400">
      Weakness
    </div>

    <div className="text-red-400 font-medium">
      {coach.weakness}
    </div>

  </div>

</div>

            </div>

            <div className="mt-4">

              <div className="flex justify-between text-xs text-slate-400 mb-2">

                <span>
                  Today's Mission Progress
                </span>

                <span>
                  {completed}/{total}
                </span>

              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

                <div
                  className="
                  h-full
                  bg-gradient-to-r
                  from-indigo-500
                  to-cyan-500
                  "
                  style={{
                    width: `${progress}%`
                  }}
                />

              </div>

            </div>

          </div>
</div>
    

        <div className="
mt-6
pt-6
border-t
border-cyan-500/10
space-y-2
">

         {coach?.missions?.map((mission,index) => (

            <div
              key={index}
              className="
              bg-slate-800/70
              rounded-xl
              px-3
              py-2
              text-slate-200
              "
            >

             <div className="flex justify-between items-center">

  <div className="flex items-center gap-3">

    <div
      className={`
        w-6 h-6
        rounded-full
        flex
        items-center
        justify-center
        ${
          mission.completed
            ? "bg-green-500 text-white"
            : "border border-slate-500"
        }
      `}
    >
      {mission.completed ? "✓" : ""}
    </div>

    <span className="text-lg">
      {missionIcons[mission.title]}
    </span>

    <span>
      {mission.title}
    </span>

  </div>

  <div
    className={`
      text-xs
      px-3
      py-1
      rounded-full
      ${
        mission.completed
          ? "bg-green-500/20 text-green-400"
          : "bg-slate-700 text-slate-300"
      }
    `}
  >
    {mission.completed
      ? "Completed"
      : "Pending"}
  </div>

</div>

              </div>

        

          ))}

        </div>

      </CardContent>

    </Card>

  );
}