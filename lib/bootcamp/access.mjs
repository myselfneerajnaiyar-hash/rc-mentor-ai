import { getEffectiveEntitlement } from '../tenant/entitlement.js'
import { BootCampError } from './content.mjs'
import { isBootCampPreviewUser } from './clock.mjs'
// Reuse the existing payment/trial/institute policy; Boot Camp does not extend it.
export function requireBootCampEntitlement(context,now=new Date()) {
  const entitlement=getEffectiveEntitlement({...context,now})
  if(!entitlement.hasAccess)throw new BootCampError('An active trial or subscription is required for Boot Camp.',402)
  return entitlement
}

// Use the date simulator's allowlist for Preview-only entitlement bypass.
// Tenant membership and published-content checks remain separate.
export function requireBootCampAccess(context,{email,env=process.env,now=new Date()}={}) {
  if(isBootCampPreviewUser(email,env))return {kind:'preview',hasAccess:true,isPremium:false,isInstituteStudent:false}
  return requireBootCampEntitlement(context,now)
}
