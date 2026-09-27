import { getEffectiveEntitlement } from '../tenant/entitlement.js'
import { BootCampError } from './content.mjs'
// Reuse the existing payment/trial/institute policy; Boot Camp does not extend it.
export function requireBootCampEntitlement(context,now=new Date()) {
  const entitlement=getEffectiveEntitlement({...context,now})
  if(!entitlement.hasAccess)throw new BootCampError('An active trial or subscription is required for Boot Camp.',402)
  return entitlement
}
