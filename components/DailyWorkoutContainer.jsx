"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"

import DailyWorkoutFlow, { WORKOUT_INTRO } from "./DailyWorkoutFlow"
import DailyPerformance from "./daily/DailyPerformance"
import DailyAnalytics from "./daily/DailyAnalytics"
import DailyHistory from "./daily/DailyHistory"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"

export default function DailyWorkoutContainer({ user }) {
  const params=useSearchParams();
  const [tab,setTab]=useState(params.get("tab")||"start");
  useEffect(()=>{setTab(params.get("tab")||"start")},[params]);
  const [workoutRunning, setWorkoutRunning] = useState(false)
  const tabsRef = useRef(null)
  useEffect(() => {
    const list = tabsRef.current
    if (!list) return
    const revealActive = () => {
      if (!window.matchMedia('(max-width:899px)').matches) return
      const active = list.querySelector('[data-state="active"]')
      if (!active) return
      const bounds = list.getBoundingClientRect(), item = active.getBoundingClientRect()
      const delta = item.left < bounds.left + 6 ? item.left - bounds.left - 6
        : item.right > bounds.right - 6 ? item.right - bounds.right + 6 : 0
      if (delta) list.scrollBy({left: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'})
    }
    revealActive()
    const observer = new ResizeObserver(revealActive)
    observer.observe(list)
    return () => observer.disconnect()
  }, [tab, workoutRunning])

  return (
    <div className="daily-workout-container space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          🔥 Daily Workout
        </h1>
        <p className="text-slate-400 mt-1">
          <span className="workout-desktop-subtitle">Structured 30-minute intelligence training</span>
          <span className="workout-mobile-subtitle">{WORKOUT_INTRO}</span>
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">

    {!workoutRunning && <TabsList ref={tabsRef} aria-label="Daily Workout sections"
className="
workout-tabs flex !justify-start gap-2 p-1
bg-slate-900/60
backdrop-blur-xl
border border-slate-800
rounded-2xl
w-full
overflow-x-auto overflow-y-hidden

px-1
"
>

          <TabsTrigger
            value="start"
           className="px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
text-slate-400 hover:text-white
data-[state=active]:bg-indigo-600
data-[state=active]:text-white
transition-all duration-200"
          >
            Start
          </TabsTrigger>

          <TabsTrigger
            value="analytics"
          className="px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
text-slate-400 hover:text-white
data-[state=active]:bg-indigo-600
data-[state=active]:text-white
transition-all duration-200"
          >
            Analytics
          </TabsTrigger>

          <TabsTrigger
            value="history"
           className="px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
text-slate-400 hover:text-white
data-[state=active]:bg-indigo-600
data-[state=active]:text-white
transition-all duration-200"
          >
            History
          </TabsTrigger>

          <TabsTrigger
            value="performance"
           className="px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
text-slate-400 hover:text-white
data-[state=active]:bg-indigo-600
data-[state=active]:text-white
transition-all duration-200"
          >
            Performance
          </TabsTrigger>

        </TabsList>}

        {/* Tab Content */}

        <TabsContent value="start" className="pt-8">
          <DailyWorkoutFlow
            mode="normal"
            user={user}
            onRunningChange={setWorkoutRunning}
          />
        </TabsContent>

       <TabsContent value="analytics" className="pt-8">
  <DailyAnalytics user={user} />
</TabsContent>

       <TabsContent value="history" className="pt-8">
  <DailyHistory user={user} />
</TabsContent>
        <TabsContent value="performance" className="pt-8">
  <DailyPerformance user={user} />
</TabsContent>

      </Tabs>

    </div>
  )
}
