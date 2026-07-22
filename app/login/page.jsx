"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabase"
import "./login.css"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleLogin = async () => {

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
     redirectTo: `https://rc.auctorlabs.in/auth/callback?next=${next}&free=${free}`
    }
  })

  if (error) {
    alert(error.message)
  }
}

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

    const next = searchParams.get("next") || "";
const free = searchParams.get("free") || "";
console.log("NEXT =", next);
console.log("FREE =", free);
console.log("URL =", window.location.href);

router.replace(`/welcome?next=${next}&free=${free}`);
  }

  return (
  <div className="auth-layout">

    {/* LEFT SIDE */}
    <div className="auth-left hidden md:flex">
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

     <div className="auth-card w-full md:w-1/2">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">
  New user? Create an account using your email and password.
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
        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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