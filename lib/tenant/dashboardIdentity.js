import { getAuthenticatedProfile } from './getCurrentProfile';
import { authorizeTenantMembership, getRequestHostname, resolveHostname } from './resolveHostname';
export async function dashboardIdentity(request) {
 const identity=await getAuthenticatedProfile(request);
 if(identity.error)return {status:identity.error==='unauthorized'?401:403};
 const tenant=await resolveHostname(getRequestHostname(request));
 if(!authorizeTenantMembership(tenant,identity.profile).allowed)return {status:403};
 return identity;
}
