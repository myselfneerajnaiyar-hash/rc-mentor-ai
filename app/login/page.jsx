"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabase"
import "./login.css"
import { BarChart3, BookOpen, BrainCircuit, Eye, EyeOff, Sparkles, Trophy, Zap } from "lucide-react"
import { useTenant } from "@/components/providers/TenantProvider"
import TenantLogo from "@/components/tenant/TenantLogo"

export default function LoginPage() {
  const { branding } = useTenant()
  const router = useRouter()
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
const free = searchParams.get("free") || "";
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleLogin = async () => {

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
     redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}&free=${encodeURIComponent(free)}`
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

    
console.log("NEXT =", next);
console.log("FREE =", free);
console.log("URL =", window.location.href);

router.replace(`/welcome?next=${next}&free=${free}`);
  }

  return (
  <main className="auth-layout">

    {/* LEFT SIDE */}
    <section className="auth-left">
      <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
      <div className="auth-brand"><TenantLogo className="auth-logo" /><div><h1>{branding.brandName}</h1>{branding.isInstitute && <p className="brand-attribution">Powered by Auctor Labs</p>}</div></div>
      <div className="auth-left-content">
        <div className="auth-eyebrow"><Sparkles size={14} /> Read deeper. Think sharper.</div>
        <p className="tagline">{branding.isInstitute ? "Your institute learning platform, powered by Auctor." : "Build elite reading intelligence."}</p>
        <p className="auth-left-copy">A focused learning system designed to turn every passage into measurable progress.</p>
        <ul className="feature-list">
          <li><span><BrainCircuit /></span>AI Mentor Birbal</li><li><span><Zap /></span>Daily RC Workouts</li>
          <li><span><BarChart3 /></span>Deep Performance Analytics</li><li><span><Trophy /></span>Global Leaderboard</li>
          <li><span><BookOpen /></span>Unlimited RC Generator</li>
        </ul>
      </div>
      <p className="auth-proof">Designed for deliberate practice · Built for ambitious readers</p>
    </section>

    {/* RIGHT SIDE */}
    <section className="auth-right">

     <div className="auth-card">
        <div className="auth-mobile-brand"><TenantLogo className="auth-mobile-logo" /><div><p>{branding.brandName}</p>{branding.isInstitute && <span>Powered by Auctor Labs</span>}</div></div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Continue building your reading intelligence.</p>

<button
  onClick={handleGoogleLogin}
  type="button"
  className="auth-google-button"
>

  <img
    src="https://developers.google.com/identity/images/g-logo.png"
    alt="Google"
    className="auth-google-icon"
  />

  <span>Continue with Google</span>

</button>
        <div className="auth-divider"><span>or continue with email</span></div>
        <form onSubmit={handleLogin} className="auth-form">

          <label className="auth-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

        <div className="auth-password-heading"><label className="auth-label" htmlFor="login-password">Password</label><span className="auth-forgot">Forgot password?</span></div>
        <div className="auth-password-wrap">

  <input
    id="login-password" type={showPassword ? "text" : "password"}
    placeholder="Enter your password" className="auth-input auth-password-input"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="auth-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? (
      <EyeOff size={19} />
    ) : (
      <Eye size={19} />
    )}
  </button>

</div>
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <><span className="auth-spinner" />Signing in...</> : "Login"}
          </button>

        </form>

        <p className="auth-footer">
          Don’t have an account? <a href={`/signup?next=${next}&free=${free}`}>
  Sign up
</a>
        </p>

      </div>

    </section>

  </main>
)
}
