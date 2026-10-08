"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabase"
import styles from "./welcome.module.css"
import posthog from "posthog-js"
import { captureGoogleLoginFailure, captureSignupConversion, isNewGoogleSignup } from "@/lib/analytics/conversionEvents.mjs"
import { useTenant } from "@/components/providers/TenantProvider"
import TenantLogo from "@/components/tenant/TenantLogo"
import { attributionFromParams, buildAttributedPath, normalizeAttribution, persistBrowserAttribution, clearBrowserAttribution } from "@/lib/attribution.mjs"
import { runSingleFlight, validateMobileNumber } from "@/lib/onboarding/profileValidation.mjs"

export default function WelcomePage() {
  const { branding, refreshContext } = useTenant()
  const router = useRouter()
  const searchParams = useSearchParams();
const next = searchParams.get("next");
const free = searchParams.get("free");
const loginPath = buildAttributedPath("/login", attributionFromParams(searchParams), { next, free })


  const [name, setName] = useState("Champion")
  const [showProfileWizard, setShowProfileWizard] = useState(false)
  
const [loading, setLoading] = useState(true)
const [authError, setAuthError] = useState("")
const [profileSaveError, setProfileSaveError] = useState("")
const [savingProfile, setSavingProfile] = useState(false)
const finishProfileRequest = useRef(null)
const googleFailureReported = useRef(false)

async function continueBootcampAcquisition() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error("Your session expired. Please log in and finish profile setup again.")
  const response = await fetch("/api/bootcamp/access/claim", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const result = await response.json().catch(() => ({}))
  const destination = buildAttributedPath("/bootcamp-2026/start", attributionFromParams(searchParams))
  if (response.ok && result.access?.allowed) router.replace("/boot-camp")
  else router.replace(destination)
}

  const [profileName, setProfileName] = useState("")
  const [exam, setExam] = useState("CAT")
  const [attemptYear, setAttemptYear] = useState("2026")
  const [phone, setPhone] = useState("")
  const [whatsappOptIn, setWhatsappOptIn] = useState(false)

  const [step, setStep] = useState(1)

 useEffect(() => {
  checkUser()
}, [])

async function checkUser() {
  let authStage = true
  try {
    const url = new URL(window.location.href)
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""))
    const callbackError = searchParams.get("error_description") || searchParams.get("error") || hashParams.get("error_description") || hashParams.get("error")
    if (callbackError) {
      if (searchParams.get("oauth") === "google" && !googleFailureReported.current) {
        googleFailureReported.current = true
        captureGoogleLoginFailure({
          posthog,
          surface: searchParams.get("flow") === "signup" ? "signup" : "login",
          error: { code: searchParams.get("error_code") || "oauth_callback_failed" },
          attemptId: `callback:${searchParams.get("flow") || "login"}:${searchParams.get("error_code") || "oauth_error"}`,
        })
      }
      setAuthError(`Sign in could not complete: ${callbackError}`)
      return
    }

    const code = searchParams.get("code")
    if (code) {
      // The browser client may already have exchanged this during its URL
      // callback initialization. Only retry the exchange if no session exists.
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!sessionData.session) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) throw exchangeError
      }
      url.searchParams.delete("code")
      url.searchParams.delete("error")
      url.searchParams.delete("error_code")
      url.searchParams.delete("error_description")
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    }

    const { data: authData, error: userError } = await supabase.auth.getUser()
    if (!authData?.user && !code) {
      if (searchParams.get("oauth") === "google" && !googleFailureReported.current) {
        googleFailureReported.current = true
        captureGoogleLoginFailure({
          posthog,
          surface: searchParams.get("flow") === "signup" ? "signup" : "login",
          error: { code: userError?.code || "oauth_session_missing" },
          attemptId: "callback:" + (searchParams.get("flow") || "login") + ":session_missing",
        })
      }
      router.replace(loginPath)
      return
    }
    if (userError) throw userError
    if (!authData?.user) throw new Error("The confirmation link did not create a session")
    authStage = false

    const user = authData.user
    const emailName = user.email?.split("@")[0] || "Champion"
    const clean = emailName.replace(/[0-9]/g, "")
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1)
    setName(formatted)

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
    if (profileError) throw profileError

    if (profile) await persistSignupAttribution(user)

    posthog.identify(user.id, {
      email: user.email,
      name: profile?.name || formatted,
    })

    if (searchParams.get("oauth") === "google"
      && searchParams.get("flow") === "signup"
      && isNewGoogleSignup(user)) {
      captureSignupConversion({ userId: user.id, method: "google", createdAt: user.created_at, posthog, pixel: window.fbq })
    }

    if (profile?.profile_completed && next === "/inbox") {
      await refreshContext()
      router.replace("/inbox")
      return
    }
    if (profile?.profile_completed && next === "bootcamp") {
      await continueBootcampAcquisition()
      return
    }

    if (!profile || !profile.profile_completed) setShowProfileWizard(true)
  } catch (error) {
    if (authStage && searchParams.get("oauth") === "google" && !googleFailureReported.current) {
      googleFailureReported.current = true
      captureGoogleLoginFailure({
        posthog,
        surface: searchParams.get("flow") === "signup" ? "signup" : "login",
        error,
        attemptId: `callback:${searchParams.get("flow") || "login"}:${error?.code || error?.name || "oauth_error"}`,
      })
    }
    console.error("Welcome authentication failed", error)
    setAuthError("We couldn't verify your account. Please retry the confirmation link or log in.")
  } finally {
    setLoading(false)
  }
}

async function finishProfile() {
  const phoneValidation = validateMobileNumber(phone)
  if (!phoneValidation.ok) {
    setProfileSaveError(phoneValidation.message)
    return
  }

  setProfileSaveError("")
  setSavingProfile(true)
  try {
    await runSingleFlight(finishProfileRequest, async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error("Your session expired. Please log in and finish profile setup again.")

      const user = authData.user
      const whatsappOptInAt = whatsappOptIn ? new Date().toISOString() : null
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("id,trial_started_at,trial_expires_at")
        .eq("user_id", user.id)
        .maybeSingle()
      if (existingProfileError) throw existingProfileError

      // Existing trials must never be restarted by revisiting the welcome flow.
      const startTrial = !existingProfile || (!existingProfile.trial_expires_at && !existingProfile.trial_started_at)
      const newTrialFields = startTrial
        ? { trial_days: 3, trial_expires_at: new Date().toISOString() }
        : {}

      if (existingProfile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name,
            exam,
            attempt_year: attemptYear,
            phone,
            profile_completed: true,
            ...newTrialFields,
            whatsapp_opt_in: whatsappOptIn,
            whatsapp_opt_in_at: whatsappOptInAt,
          })
          .eq("user_id", user.id)
        if (profileError) throw profileError
      } else {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([{
            user_id: user.id,
            email: user.email,
            name,
            exam,
            attempt_year: attemptYear,
            phone,
            role: "student",
            profile_completed: true,
            trial_days: 3,
            trial_expires_at: new Date().toISOString(),
            whatsapp_opt_in: whatsappOptIn,
            whatsapp_opt_in_at: whatsappOptInAt,
          }])
        if (profileError) throw profileError
      }

      await persistSignupAttribution(user)
      await refreshContext()

      if (whatsappOptIn) {
        void (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession()
            const enrollmentResponse = await fetch("/api/whatsapp/enroll-trial", {
              method: "POST",
              headers: { Authorization: `Bearer ${sessionData.session?.access_token || ""}` },
            })
            if (!enrollmentResponse.ok) {
              const enrollmentResult = await enrollmentResponse.json().catch(() => ({}))
              console.warn(enrollmentResult.error || "Unable to schedule WhatsApp trial messages")
            }
          } catch (error) {
            console.warn("Unable to schedule WhatsApp trial messages", error)
          }
        })()
      }

      setShowProfileWizard(false)
      void fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name }),
      }).catch((error) => console.warn("Unable to send welcome email", error))

      if (next === "/inbox") {
        router.replace("/inbox")
      } else if (next === "bootcamp") {
        await continueBootcampAcquisition()
      } else if (next === "cat") {
        router.push(free === "1" ? "/?view=cat&free=1" : "/?view=cat")
      } else if (next === "pricing") {
        router.push("/pricing")
      } else {
        router.push("/")
      }
    })
  } catch (error) {
    console.error("Profile setup failed", error)
    setProfileSaveError(error?.message?.startsWith("Your session expired")
      ? error.message
      : "We couldn't save your profile. Check your connection and try again.")
  } finally {
    setSavingProfile(false)
  }
}
async function persistSignupAttribution(user) {
  const query = new URLSearchParams(window.location.search)
  const metadata = normalizeAttribution(user.user_metadata?.signup_attribution)
  const browserAttribution = persistBrowserAttribution(query)
  const attribution = {
    firstTouch: Object.keys(metadata.firstTouch).length ? metadata.firstTouch : browserAttribution.firstTouch,
    lastTouch: Object.keys(browserAttribution.lastTouch).length ? browserAttribution.lastTouch : metadata.lastTouch,
  }
  if (!Object.keys(attribution.firstTouch).length && !Object.keys(attribution.lastTouch).length) return
  try {
    const { error } = await supabase.rpc("capture_signup_attribution", {
      p_first_touch: attribution.firstTouch,
      p_last_touch: attribution.lastTouch,
    })
    if (error) console.warn("Signup attribution was not saved.", error.code || error.message)
    else clearBrowserAttribution()
  } catch (error) {
    console.warn("Signup attribution could not reach the profile service.", error?.message || "Request failed")
  }
}
  if (loading) {
  return null
}

  if (authError) {
    return (
      <div className={styles["welcome-wrapper"]}>
        <div className={styles["welcome-card"]}>
          <p className={styles["welcome-error"]} role="alert">{authError}</p>
          <a className={styles["welcome-btn"]} href={loginPath}>Go to Login</a>
        </div>
      </div>
    )
  }

  /* ---------------- PROFILE WIZARD ---------------- */

 if (showProfileWizard) {
  return (
    <div className={styles["welcome-wrapper"]}>
      <div className={styles["welcome-card"]}>
        <div className="mb-6 flex items-center justify-center gap-3"><TenantLogo className="h-10 w-10 rounded-xl object-contain" /><div><span className="font-semibold text-white">{branding.brandName}</span>{branding.isInstitute && <p className="text-[10px] text-slate-400">Powered by Auctor Labs</p>}</div></div>

        <h1 className={styles["welcome-title"]}>
          Let’s Set Up Your Profile
        </h1>

        {/* STEP 1 - NAME */}
        {step === 1 && (
          <>
            <p className={styles["welcome-subtitle"]}>
              What should we call you?
            </p>

            <input
              type="text"
              placeholder="Enter your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button
              className={styles["welcome-btn"]}
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
            <p className={styles["welcome-subtitle"]}>
              Select Your Target Exam
            </p>

            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
            >
              <option value="CAT">CAT</option>
              <option value="XAT">XAT</option>
              <option value="GMAT">GMAT</option>
               <option value="CLAT">CLAT</option>
                <option value="Bank PO">Bank PO</option>
                  <option value="SSC">SSC</option>
                 <option value="CUET">CUET</option>
                  <option value="IPMAT">IPMAT</option>
            </select>

            <button
              className={styles["welcome-btn"]}
              onClick={() => setStep(3)}
            >
              Next →
            </button>
          </>
        )}

      {/* STEP 3 - YEAR */}
{step === 3 && (
  <>
    <p className={styles["welcome-subtitle"]}>
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
      className={styles["welcome-btn"]}
      onClick={() => setStep(4)}
    >
      Next →
    </button>
  </>
)}

{/* STEP 4 - PHONE */}
{step === 4 && (
  <>
    <p className={styles["welcome-subtitle"]}>
      Get daily RC reminders on WhatsApp 📱
    </p>

    <input
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      aria-label="Mobile number"
      placeholder="9876543210"
      value={phone}
      onChange={(e) => {
        setPhone(e.target.value)
        setProfileSaveError("")
      }}
    />

    {profileSaveError && <p className={styles["welcome-error"]} role="alert">{profileSaveError}</p>}

    <label className={styles["whatsapp-consent"]}>
      <input
        type="checkbox"
        checked={whatsappOptIn}
        onChange={(event) => setWhatsappOptIn(event.target.checked)}
      />
      <span>I agree to receive Auctor updates, study reminders, recommendations and offers on WhatsApp.</span>
    </label>

    <button
      className={styles["welcome-btn"]}
      onClick={finishProfile}
      disabled={savingProfile}
    >
      {savingProfile ? "Saving..." : "Finish →"}
    </button>
  </>
)}
         

      </div>
    </div>
  )
}

  /* ---------------- NORMAL WELCOME ---------------- */

  return (
    <div className={styles["welcome-wrapper"]}>
      <div className={styles["welcome-card"]}>
        <div className="mb-6 flex items-center justify-center gap-3"><TenantLogo className="h-10 w-10 rounded-xl object-contain" /><div><span className="font-semibold text-white">{branding.brandName}</span>{branding.isInstitute && <p className="text-[10px] text-slate-400">Powered by Auctor Labs</p>}</div></div>
        <h1 className={styles["welcome-title"]}>
          Welcome {name} 👋
        </h1>

        <p className={styles["welcome-subtitle"]}>
         Your RC training engine is ready.
        </p>

        <p className={styles["welcome-emotion"]}>
          Let's build your reading intelligence.
        </p>

        <ul className={styles["welcome-points"]}>
          <li>🧠 Adaptive RC Engine</li>
          <li>⚡ Speed Optimization Drills</li>
          <li>📊 Smart Performance Analytics</li>
        </ul>

        <button
          className={styles["welcome-btn"]}
         onClick={() => {
 if (next === "/inbox") {
  router.replace("/inbox");
} else if (next === "cat") {
  if (free === "1") {
    router.push("/?view=cat&free=1");
  } else {
    router.push("/?view=cat");
  }
} else if (next === "pricing") {
  router.push("/pricing");
} else {
  router.push("/");
}
}}
        >
          Start Your RC Journey →
        </button>

        <p className={styles["welcome-footer"]}>
          Not just practice. Precision training.
        </p>
      </div>
    </div>
  )
}
