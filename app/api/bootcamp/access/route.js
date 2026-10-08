import { NextResponse } from 'next/server'
import { BootCampError } from '@/lib/bootcamp/content.mjs'
import { getBootCampRequestAccess } from '@/lib/bootcamp/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    return NextResponse.json(await getBootCampRequestAccess(request), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const status = error instanceof BootCampError ? error.status : 500
    return NextResponse.json({ error: status === 401 ? 'Authentication required.' : 'Unable to verify Boot Camp access.' }, { status, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
