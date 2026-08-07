"use client"

import { useEffect } from "react"

const ACTIVE_CLASS = "assessment-mode-active"
let activeAssessments = 0

export default function AssessmentMode({ active = true }) {
  useEffect(() => {
    if (!active) return
    activeAssessments += 1
    document.body.classList.add(ACTIVE_CLASS)

    return () => {
      activeAssessments = Math.max(0, activeAssessments - 1)
      if (activeAssessments === 0) document.body.classList.remove(ACTIVE_CLASS)
    }
  }, [active])

  return null
}
