'use client';
import { Compass } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { allowActivityExit } from './mobile/MobileShell';
import { startProductTour } from './ProductTour';
export default function ProductTourButton(){
 const path=usePathname(),params=useSearchParams(),router=useRouter();
 return <button type="button" className="product-tour-button" aria-label="Product Tour" onClick={()=>{if(path==='/'&&(!params.get('view')||params.get('view')==='home'))startProductTour();else if(allowActivityExit())router.push('/?view=home&tour=replay');}}><Compass size={16} aria-hidden="true"/><span className="tour-label-desktop">Product Tour</span><span className="tour-label-mobile">Tour</span></button>;
}
