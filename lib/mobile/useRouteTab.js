'use client';
import { useRouter, useSearchParams } from 'next/navigation';
export function useRouteTab(allowed, fallback) {
 const params=useSearchParams(),router=useRouter();
 const requested=params.get('tab');
 return [allowed.includes(requested)?requested:fallback, value=>{const query=new URLSearchParams(params.toString());query.set('tab',value);router.replace(`/?${query}`,{scroll:false});}];
}
