import { NextResponse } from 'next/server'
import { BootCampError } from '@/lib/bootcamp/content.mjs'
import { claimBootCampRequestAccess } from '@/lib/bootcamp/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const result = await claimBootCampRequestAccess(request)
    const status = result.claimed ? 201 : result.access.allowed ? 200 : 409
    return NextResponse.json(result, { status, headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const status = error instanceof BootCampError ? error.status : 500
    return NextResponse.json({ error: error instanceof BootCampError ? error.message : 'Unable to claim Boot Camp access.' }, { status, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
