export function validateMobileNumber(value) {
  if (value === "") {
    return { ok: false, error: "required", message: "Mobile number is required." }
  }

  if (typeof value !== "string" || !/^\d{10}$/.test(value)) {
    return { ok: false, error: "invalid_phone", message: "Please enter a valid 10-digit mobile number." }
  }

  return { ok: true }
}

export function classifySignupResult({ data, error }) {
  if (error) {
    const code = String(error.code || "").toLowerCase()
    const detail = String(error.message || "").toLowerCase()
    if (
      code === "user_already_exists" ||
      code === "user_already_registered" ||
      error.status === 409 ||
      /user already (exists|registered)|email already (exists|registered)/.test(detail)
    ) {
      return { type: "existing_user" }
    }
    return { type: "error", error }
  }

  if (!data?.user) return { type: "error", error: new Error("Signup did not return an account") }
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { type: "existing_user" }
  }
  if (data.session) return { type: "authenticated", user: data.user, session: data.session }
  return { type: "confirmation_required", user: data.user }
}

export function runSingleFlight(ref, task) {
  if (ref.current) return ref.current

  const pending = Promise.resolve().then(task)
  ref.current = pending
  const clear = () => {
    if (ref.current === pending) ref.current = null
  }
  void pending.then(clear, clear)
  return pending
}
