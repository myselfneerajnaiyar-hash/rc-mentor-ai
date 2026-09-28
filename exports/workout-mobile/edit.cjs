const fs=require('fs');function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('components/DailyWorkoutFlow.jsx',s=>s.replace('export default function DailyWorkoutFlow', 'export const WORKOUT_INTRO = "Practise speed, vocabulary and reading in one guided session. Allow about 30 minutes.";\n\nexport default function DailyWorkoutFlow').replace('<section className="rounded-3xl border', '<section className="workout-overview rounded-3xl border').replace('>Practise speed, vocabulary and reading in one guided session. Allow about 30 minutes.</p>', '>{WORKOUT_INTRO}</p>').replace('className="workout-intro-details mt-6">','className="workout-activities mt-6">').replace('<article className="rounded-2xl', '<article className="workout-activity-card rounded-2xl'));
edit('components/DailyWorkoutContainer.jsx',s=>s.replace('useState, useEffect','useState, useEffect, useRef').replace('import DailyWorkoutFlow from', 'import DailyWorkoutFlow, { WORKOUT_INTRO } from').replace('  const [workoutRunning, setWorkoutRunning] = useState(false)',`  const [workoutRunning, setWorkoutRunning] = useState(false)
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
  }, [tab, workoutRunning])`).replace('          Structured 30-minute intelligence training','          <span className="workout-desktop-subtitle">Structured 30-minute intelligence training</span>\n          <span className="workout-mobile-subtitle">{WORKOUT_INTRO}</span>').replace('{!workoutRunning && <TabsList','{!workoutRunning && <TabsList ref={tabsRef} aria-label="Daily Workout sections"').replace('[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',''));
edit('app/mobile.css',s=>s.replace('.daily-workout-container .workout-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));height:auto;overflow:visible;gap:6px;padding:6px}', '.daily-workout-container .workout-tabs{display:flex;flex-wrap:nowrap;height:auto;overflow-x:auto;overflow-y:hidden;gap:6px;padding:6px;scrollbar-width:thin;scrollbar-color:#475569 transparent;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}').replace('.daily-workout-container .workout-tabs [role=tab]{min-width:0;min-height:48px;padding:10px 12px}', '.daily-workout-container .workout-tabs [role=tab]{flex:0 0 auto;min-height:48px;padding:10px 20px;white-space:nowrap}'));
