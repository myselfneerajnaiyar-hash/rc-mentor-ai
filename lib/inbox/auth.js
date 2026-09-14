import { timingSafeEqual } from "node:crypto"

export function isAuthorizedInboxCron(request, env = process.env) {
  const secret = env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || !authorization?.startsWith("Bearer ")) return false
  const expected = Buffer.from(secret)
  const supplied = Buffer.from(authorization.slice("Bearer ".length))
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}

