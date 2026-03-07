"use client"

import DailyWorkoutFlow from "./DailyWorkoutFlow"
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
  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          🔥 Daily Workout
        </h1>
        <p className="text-slate-400 mt-1">
          Structured 30-minute intelligence training
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="start" className="w-full">

    <TabsList
className="
flex gap-2 p-1
bg-slate-900/60
backdrop-blur-xl
border border-slate-800
rounded-2xl
w-full
overflow-x-auto
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

        </TabsList>

        {/* Tab Content */}

        <TabsContent value="start" className="pt-8">
          <DailyWorkoutFlow
            mode="normal"
            user={user}
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