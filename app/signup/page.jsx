"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import "../login/login.css"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
          Start your RC mastery journey
        </p>

        <form onSubmit={handleSignup}>

          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

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