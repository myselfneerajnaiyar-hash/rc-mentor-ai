"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import "./welcome.css"

export default function WelcomePage() {
  const router = useRouter()

  const [name, setName] = useState("Champion")
  const [showProfileWizard, setShowProfileWizard] = useState(false)

  const [profileName, setProfileName] = useState("")
  const [exam, setExam] = useState("CAT")
  const [attemptYear, setAttemptYear] = useState("2026")

  const [step, setStep] = useState(1)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user) {
      router.push("/login")
      return
    }

    const user = authData.user

    // Auto name from email
    const emailName = user.email?.split("@")[0] || "Champion"
    const clean = emailName.replace(/[0-9]/g, "")
    const formatted =
      clean.charAt(0).toUpperCase() + clean.slice(1)

    setName(formatted)

    // Check profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!profile) {
      setShowProfileWizard(true)
    }
  }

  async function finishProfile() {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return

    await supabase.from("profiles").insert([
      {
        user_id: authData.user.id,
        name: profileName,
        exam: exam,
        attempt_year: attemptYear,
      }
    ])

    setShowProfileWizard(false)
    router.push("/")
  }

  /* ---------------- PROFILE WIZARD ---------------- */

 if (showProfileWizard) {
  return (
    <div className="welcome-wrapper">
      <div className="welcome-card">

        <h1 className="welcome-title">
          Let’s Set Up Your Profile
        </h1>

        {/* STEP 1 - NAME */}
        {step === 1 && (
          <>
            <p className="welcome-subtitle">
              What should we call you?
            </p>

            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button
              className="welcome-btn"
              onClick={() => setStep(2)}
              disabled={!name.trim()}
            >
              Next →
            </button>
          </>
        )}

        {/* STEP 2 - EXAM */}
        {step === 2 && (
          <>
            <p className="welcome-subtitle">
              Select Your Target Exam
            </p>

            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
            >
              <option value="CAT">CAT</option>
              <option value="XAT">XAT</option>
              <option value="GMAT">GMAT</option>
            </select>

            <button
              className="welcome-btn"
              onClick={() => setStep(3)}
            >
              Next →
            </button>
          </>
        )}

        {/* STEP 3 - YEAR */}
        {step === 3 && (
          <>
            <p className="welcome-subtitle">
              Attempt Year?
            </p>

            <select
              value={attemptYear}
              onChange={(e) => setAttemptYear(e.target.value)}
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            <button
              className="welcome-btn"
              onClick={finishProfile}
            >
              Finish →
            </button>
          </>
        )}

      </div>
    </div>
  )
}

  /* ---------------- NORMAL WELCOME ---------------- */

  return (
    <div className="welcome-wrapper">
      <div className="welcome-card">
        <h1 className="welcome-title">
          Welcome {name} 👋
        </h1>

        <p className="welcome-subtitle">
          Ready to sharpen your reading intelligence?
        </p>

        <p className="welcome-emotion">
          This is your competitive edge zone.
        </p>

        <ul className="welcome-points">
          <li>🧠 Adaptive RC Engine</li>
          <li>⚡ Speed Optimization Drills</li>
          <li>📊 Smart Performance Analytics</li>
        </ul>

        <button
          className="welcome-btn"
          onClick={() => router.push("/")}
        >
          Start Your RC Journey →
        </button>

        <p className="welcome-footer">
          Not just practice. Precision training.
        </p>
      </div>
    </div>
  )
}