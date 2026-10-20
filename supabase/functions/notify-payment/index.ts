type Json = Record<string, unknown>

const json = (body: Json, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
})

function serviceRoleRequest(req: Request) {
  const authorization = req.headers.get("authorization") || ""
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : ""
  if (!token) return false

  try {
    const payload = token.split(".")[1]
    if (!payload) return false
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const claims = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")))
    return claims.role === "service_role"
  } catch {
    return false
  }
}

function getSupabaseCredentials() {
  const url = Deno.env.get("SUPABASE_URL")
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS")
  let secretKey: string | undefined

  if (secretKeysJson) {
    try {
      const keys = JSON.parse(secretKeysJson)
      secretKey = keys.default || Object.values(keys)[0] as string | undefined
    } catch {
      secretKey = undefined
    }
  }

  const key = secretKey || legacyKey
  if (!url || !key) return null

  const headers = new Headers({ apikey: key, "content-type": "application/json" })
  if (!key.startsWith("sb_secret_")) headers.set("authorization", `Bearer ${key}`)
  return { url: url.replace(/\/$/, ""), headers }
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const credentials = getSupabaseCredentials()
  if (!credentials) throw new Error("SUPABASE_CONFIG_MISSING")

  const headers = new Headers(credentials.headers)
  new Headers(init.headers).forEach((value, key) => headers.set(key, value))
  const response = await fetch(`${credentials.url}${path}`, { ...init, headers })
  if (!response.ok) throw new Error("SUPABASE_REQUEST_FAILED")
  return response.json()
}

function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100)
}

function cleanLine(value: unknown) {
  return typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim() : ""
}

function getTimestamp(value: unknown) {
  const parsed = typeof value === "string" ? new Date(value) : new Date()
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value)) + " IST"
}

async function sendTelegram(text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID")
  if (!token || !chatId) throw new Error("TELEGRAM_CONFIG_MISSING")

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.ok !== true) throw new Error("TELEGRAM_DELIVERY_FAILED")
}

async function finishDispatch(paymentId: string, status: "sent" | "failed", errorCode: string | null) {
  await supabaseRequest("/rest/v1/rpc/finish_payment_telegram_notification", {
    method: "POST",
    body: JSON.stringify({
      p_razorpay_payment_id: paymentId,
      p_status: status,
      p_error_code: errorCode,
    }),
  })
}

Deno.serve(async (req: Request) => {
  if (!serviceRoleRequest(req)) return json({ error: "Unauthorized" }, 401)

  const tokenReady = Boolean(Deno.env.get("TELEGRAM_BOT_TOKEN"))
  const destinationReady = Boolean(Deno.env.get("TELEGRAM_CHAT_ID"))
  const databaseReady = Boolean(getSupabaseCredentials())

  if (req.method === "GET") {
    return json({ ok: tokenReady && destinationReady && databaseReady, configured: {
      botToken: tokenReady,
      destination: destinationReady,
      database: databaseReady,
    } })
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)
  if (!tokenReady || !destinationReady || !databaseReady) {
    return json({ error: "Notification configuration is incomplete" }, 503)
  }

  let payload: Json
  try {
    payload = await req.json()
  } catch {
    return json({ error: "Invalid JSON payload" }, 400)
  }

  if (payload.test_mode === true) {
    try {
      await sendTelegram("✅ Auctor payment Telegram test — delivery is working.")
      return json({ ok: true, test: true })
    } catch {
      return json({ error: "Telegram test delivery failed" }, 502)
    }
  }

  const record = payload.record as Json | undefined
  const paymentId = cleanLine(record?.razorpay_payment_id)
  const userId = cleanLine(record?.user_id)
  if (payload.type !== "INSERT" || !record || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !userId) {
    return json({ error: "Not a supported payment subscription event" }, 400)
  }

  let order: Json
  let profile: Json | null = null
  try {
    const orders = await supabaseRequest(
      `/rest/v1/razorpay_payment_orders?select=razorpay_order_id,razorpay_payment_id,user_id,plan,original_amount_paise,discount_amount_paise,amount_paid_paise,currency,coupon_code,paid_at,status&razorpay_payment_id=eq.${encodeURIComponent(paymentId)}&status=eq.provisioned&limit=1`,
    ) as Json[]
    order = orders[0]
    if (!order || order.user_id !== userId || order.razorpay_payment_id !== paymentId) {
      return json({ error: "Payment was not found as provisioned" }, 404)
    }

    const profiles = await supabaseRequest(
      `/rest/v1/profiles?select=name,email&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    ) as Json[]
    profile = profiles[0] || null
  } catch {
    return json({ error: "Payment validation failed" }, 503)
  }

  try {
    const claimed = await supabaseRequest("/rest/v1/rpc/claim_payment_telegram_notification", {
      method: "POST",
      body: JSON.stringify({
        p_razorpay_payment_id: paymentId,
        p_razorpay_order_id: order.razorpay_order_id,
      }),
    })
    if (claimed !== true) return json({ ok: true, duplicate: true })
  } catch {
    return json({ error: "Could not claim notification idempotency key" }, 503)
  }

  const paidAt = getTimestamp(order.paid_at || record.created_at)
  const amount = Number(order.amount_paid_paise)
  const discount = Number(order.discount_amount_paise || 0)
  const name = cleanLine(record.name || profile?.name)
  const email = cleanLine(record.email || profile?.email)
  const coupon = cleanLine(order.coupon_code)
  const lines = [
    "💳 Payment received",
    `Amount: ${formatInr(amount)}`,
    name ? `Customer: ${name}` : "",
    email ? `Email: ${email}` : "",
    `Plan: ${cleanLine(order.plan) || cleanLine(record.plan) || "—"}`,
    coupon ? `Coupon: ${coupon}` : discount > 0 ? `Discount: ${formatInr(discount)}` : "",
    `Razorpay payment: ${paymentId}`,
    `Razorpay order: ${cleanLine(order.razorpay_order_id)}`,
    `Time: ${formatTimestamp(paidAt)}`,
  ].filter(Boolean)

  try {
    await sendTelegram(lines.join("\n"))
  } catch {
    try { await finishDispatch(paymentId, "failed", "TELEGRAM_DELIVERY_FAILED") } catch { /* no payload or secret logging */ }
    return json({ error: "Telegram delivery failed" }, 502)
  }

  try {
    await finishDispatch(paymentId, "sent", null)
  } catch {
    // Keep the unique claim so a retry cannot send a duplicate.
  }
  return json({ ok: true, sent: true })
})
