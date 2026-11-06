import { NextResponse } from 'next/server';
import { dashboardIdentity } from '@/lib/tenant/dashboardIdentity';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { loadDailyStatus } from '@/lib/mobile/dailyStatus.mjs';
export const dynamic='force-dynamic';
export async function GET(request){
 let stage='identity';
 try{const identity=await dashboardIdentity(request);if(identity.status)return NextResponse.json({error:'Authentication or membership required'},{status:identity.status});
 stage='progress';
 return NextResponse.json(await loadDailyStatus(supabaseAdmin,identity.user.id,identity.capabilities.showDailyRC),{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){
  const reportedStage=typeof error?.dailyStatusStage==='string'&&/^(daily_rc|workout|hangman)\.[a-z]+$/.test(error.dailyStatusStage)?error.dailyStatusStage:stage;
  const code=typeof error?.dailyStatusCode==='string'&&/^[A-Za-z0-9_-]{1,32}$/.test(error.dailyStatusCode)?error.dailyStatusCode:'unknown';
  console.error('[daily-status] load failed',{stage:reportedStage,code});
  return NextResponse.json({error:'Your daily progress could not be loaded. Please retry.'},{status:503});
 }
}
