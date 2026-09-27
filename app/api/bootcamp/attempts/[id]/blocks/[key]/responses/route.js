import { handleBootCamp } from '@/lib/bootcamp/server'
export function PATCH(request,{ params }) { return handleBootCamp(request,'responses',params) }
