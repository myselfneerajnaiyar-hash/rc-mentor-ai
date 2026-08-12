import { timingSafeEqual } from "node:crypto"

export function isAuthorizedCronRequest(request, env = process.env) {
  const secret = env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || !authorization?.startsWith("Bearer ")) return false

  const supplied = authorization.slice("Bearer ".length)
  const expectedBuffer = Buffer.from(secret)
  const suppliedBuffer = Buffer.from(supplied)

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  )
}
