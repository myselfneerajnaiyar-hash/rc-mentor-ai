import { handleBootCamp } from '@/lib/bootcamp/server'
export const dynamic = 'force-dynamic'
export function POST(request) { return handleBootCamp(request,'chat') }
