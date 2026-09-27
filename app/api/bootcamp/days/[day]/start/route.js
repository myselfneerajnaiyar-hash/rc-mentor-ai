import { handleBootCamp } from '@/lib/bootcamp/server'
export function POST(request,{params}) { return handleBootCamp(request,'start',params) }
