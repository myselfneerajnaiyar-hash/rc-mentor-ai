import { NextResponse } from 'next/server';
import { dashboardIdentity } from '@/lib/tenant/dashboardIdentity';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
export const dynamic='force-dynamic';
async function handle(request,complete=false){
 try {
  const identity=await dashboardIdentity(request);
  if(identity.status)return NextResponse.json({error:'Authentication or membership required'},{status:identity.status});
  let completed=identity.profile.birbal_onboarded===true;
  // Read old tour receipts only for installations which applied the previous migration.
  // A missing legacy table must never prevent a locally bundled tour from running.
  if(!complete&&!completed){
   const legacy=await supabaseAdmin.from('product_tour_progress').select('completed_at').eq('user_id',identity.user.id).maybeSingle();
   completed=!!legacy.data?.completed_at;
  }
  if(complete||completed&&!identity.profile.birbal_onboarded){
   const {error}=await supabaseAdmin.from('profiles').update({birbal_onboarded:true}).eq('user_id',identity.user.id);
   if(error&&complete)throw error;
   completed=true;
  }
  return NextResponse.json({completed},{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){console.error('Product tour persistence failed',{message:error instanceof Error?error.message:'Database operation failed'});return NextResponse.json({error:'Tour progress could not sync. The tour is still available from the header.'},{status:503});}
}
export const GET=request=>handle(request);
export const POST=request=>handle(request,true);
