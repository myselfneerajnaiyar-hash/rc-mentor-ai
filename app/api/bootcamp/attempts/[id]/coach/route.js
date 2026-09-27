import { handleBootCamp } from '@/lib/bootcamp/server'
export const maxDuration = 30
export function POST(request,{ params }) { return handleBootCamp(request,'coach',params) }
