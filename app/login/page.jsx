"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import "./login.css"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.replace("/welcome")
  }

  return (
  <div className="auth-layout">

    {/* LEFT SIDE */}
    <div className="auth-left">
      <h1>Auctor RC</h1>

      <p className="tagline">
        Build elite reading intelligence for CAT.
      </p>

      <ul className="feature-list">
        <li>🧠 AI Mentor Birbal</li>
        <li>⚡ Daily RC Workouts</li>
        <li>📊 Deep Performance Analytics</li>
        <li>🏆 Global Leaderboard</li>
        <li>📚 Unlimited RC Generator</li>
      </ul>
    </div>

    {/* RIGHT SIDE */}
    <div className="auth-right">

      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button">
            Login
          </button>

        </form>

        <p className="auth-footer">
          Don’t have an account? <a href="/signup">Sign up</a>
        </p>

      </div>

    </div>

  </div>
)
}