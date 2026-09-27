import { NextResponse } from 'next/server';
import { dashboardIdentity } from '@/lib/tenant/dashboardIdentity';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { loadDailyStatus } from '@/lib/mobile/dailyStatus.mjs';
export const dynamic='force-dynamic';
export async function GET(request){
 try{const identity=await dashboardIdentity(request);if(identity.status)return NextResponse.json({error:'Authentication or membership required'},{status:identity.status});
 return NextResponse.json(await loadDailyStatus(supabaseAdmin,identity.user.id,identity.capabilities.showDailyRC),{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'Your daily progress could not be loaded. Please retry.'},{status:503});}
}
