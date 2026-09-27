import { handleBootCamp } from '@/lib/bootcamp/server'
export const dynamic = 'force-dynamic'
export function GET(request) { return handleBootCamp(request,'analytics') }
