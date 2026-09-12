"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabase"
import styles from "./welcome.module.css"
import posthog from "posthog-js"
import { useTenant } from "@/components/providers/TenantProvider"
import TenantLogo from "@/components/tenant/TenantLogo"
import { normalizeWhatsAppPhoneE164 } from "@/lib/whatsapp/phone"

export default function WelcomePage() {
  const { branding, refreshContext } = useTenant()
  const router = useRouter()
  const searchParams = useSearchParams();
const next = searchParams.get("next");
const free = searchParams.get("free");
useEffect(() => {
  console.log("URL:", window.location.href);
  console.log("NEXT:", next);
}, []);


  const [name, setName] = useState("Champion")
  const [showProfileWizard, setShowProfileWizard] = useState(false)
  
const [loading, setLoading] = useState(true)

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

  const { data: authData } = await supabase.auth.getUser()

  if (!authData?.user) {
    router.push("/login")
    return
  }

  const user = authData.user

  const emailName = user.email?.split("@")[0] || "Champion"
  const clean = emailName.replace(/[0-9]/g, "")
  const formatted =
    clean.charAt(0).toUpperCase() + clean.slice(1)

  setName(formatted)

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

    posthog.identify(user.id, {
  email: user.email,
  name: profile?.name || formatted,
})

 if (!profile || !profile.profile_completed) {
  setShowProfileWizard(true)
}

  setLoading(false)   // ✅ MOVE IT HERE
}

 async function finishProfile() {
  const { data: authData } = await supabase.auth.getUser()

  if (!authData?.user) return

  const user = authData.user
  const normalizedPhone = normalizeWhatsAppPhoneE164(phone)
  if (!normalizedPhone.ok) {
    alert(normalizedPhone.message)
    return
  }
  const whatsappOptInAt = whatsappOptIn ? new Date().toISOString() : null
  const expiry = new Date()

expiry.setDate(expiry.getDate() + 3)

  // 🔥 check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  // =========================
  // IF PROFILE EXISTS → UPDATE
  // =========================

  if (existingProfile) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: name,
        exam: exam,
        attempt_year: attemptYear,
        phone: normalizedPhone.phone,
        profile_completed: true,
        trial_days: 3,
        trial_expires_at: expiry,
        whatsapp_opt_in: whatsappOptIn,
        whatsapp_opt_in_at: whatsappOptInAt,
      })
      .eq("user_id", user.id)
    if (profileError) throw profileError
  }

  // =========================
  // IF PROFILE DOES NOT EXIST → INSERT
  // =========================

  else {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          user_id: user.id,
          email: user.email,
          name: name,
          exam: exam,
          attempt_year: attemptYear,
          phone: normalizedPhone.phone,
          role: "student",
          profile_completed: true,
          trial_days: 3,
          trial_expires_at: expiry,
          whatsapp_opt_in: whatsappOptIn,
          whatsapp_opt_in_at: whatsappOptInAt,
        },
      ])
    if (profileError) throw profileError
  }

  await refreshContext()

  if (whatsappOptIn) {
    const { data: sessionData } = await supabase.auth.getSession()
    const enrollmentResponse = await fetch("/api/whatsapp/enroll-trial", {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionData.session?.access_token || ""}` },
    })
    if (!enrollmentResponse.ok) {
      const enrollmentResult = await enrollmentResponse.json().catch(() => ({}))
      throw new Error(enrollmentResult.error || "Unable to schedule WhatsApp trial messages")
    }
  }

  setShowProfileWizard(false)
  await fetch("/api/send-welcome-email", {
  method: "POST",

  headers: {
    "Content-Type": "application/json",
  },

  body: JSON.stringify({
    email: user.email,
    name: name,
  }),
})

 if (next === "cat") {
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
}
  if (loading) {
  return null
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
      placeholder="+91 9876543210"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
    />

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
      disabled={!phone.trim()}
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
 if (next === "cat") {
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
