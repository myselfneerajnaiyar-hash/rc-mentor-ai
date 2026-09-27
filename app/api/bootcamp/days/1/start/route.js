import { handleBootCamp } from '@/lib/bootcamp/server'
export function POST(request) { return handleBootCamp(request,'start') }
