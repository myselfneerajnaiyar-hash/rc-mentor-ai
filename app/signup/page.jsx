"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import "../login/login.css"
import { Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const handleGoogleLogin = async () => {

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://rc.auctorlabs.in/auth/callback"
    }
  })

  if (error) {
    alert(error.message)
  }
}

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

   

alert("Check your email to confirm your account.")

router.push("/login")
  }

  return (
  <div className="auth-layout">

    {/* LEFT SIDE */}
    <div className="auth-left">

      <h1>Auctor RC</h1>

      <p className="tagline">
        Train your reading intelligence for CAT.
      </p>

      <ul className="feature-list">
        <li>🧠 AI Mentor Birbal</li>
        <li>⚡ Daily RC Workouts</li>
        <li>🏆 Leaderboards & Streaks</li>
        <li>📊 Deep Performance Analytics</li>
        <li>📚 Unlimited RC Generator</li>
        <li>🎯 CAT RC Sectionals</li>
      </ul>

    </div>


    {/* RIGHT SIDE */}
    <div className="auth-right">

      <div className="auth-card">

        <h1 className="auth-title">Create Account</h1>

       <p className="auth-subtitle">
  New here? Sign up using your email and password.
</p>

<button
  onClick={handleGoogleLogin}
  type="button"
  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl mb-4 border border-gray-300 bg-white hover:bg-gray-100 transition shadow-sm"
>

  <img
    src="https://developers.google.com/identity/images/g-logo.png"
    alt="Google"
    className="w-5 h-5"
  />

  <span style={{ color: "#111827", fontWeight: 600 }}>
    Continue with Google
  </span>

</button>

        <form onSubmit={handleSignup}>

          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

        <div className="relative">

  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    className="auth-input pr-12"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 z-50"
  >
    {showPassword ? (
      <EyeOff size={20} color="black" strokeWidth={2.5} />
    ) : (
      <Eye size={20} color="black" strokeWidth={2.5} />
    )}
  </button>

</div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button">
            {loading ? "Creating account..." : "Sign Up"}
          </button>

        </form>

        <p className="auth-footer">
          Already have an account? <a href="/login">Login</a>
        </p>

      </div>

    </div>

  </div>
)
}