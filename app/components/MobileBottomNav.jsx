'use client';
import { Home, CalendarDays, BookOpen, User } from 'lucide-react';
import { Trophy } from 'lucide-react';
import { captureLearningEvent } from '@/lib/learningAnalytics';
import { useTenant } from '@/components/providers/TenantProvider';
const baseTabs=[['home','Home',Home,'/?view=home'],['today','Today',CalendarDays,'/?view=today'],['practice','Practice',BookOpen,'/?view=practice'],['profile','Profile',User,'/?view=profile']];
export default function MobileBottomNav({view,onNavigate}){
 const {capabilities}=useTenant();
 const tabs=capabilities.isCAT?[baseTabs[0],['bootcamp','Boot Camp',Trophy,'/boot-camp'],...baseTabs.slice(1)]:baseTabs;
 return <nav className="auctor-mobile-nav" aria-label="Main navigation" data-tab-count={tabs.length} style={{gridTemplateColumns:`repeat(${tabs.length},minmax(0,1fr))`}}>{tabs.map(([key,label,Icon,href])=><a key={key} href={href} aria-label={label} aria-current={view===key?'page':undefined} onClick={e=>{e.preventDefault();captureLearningEvent('mobile_nav_click',{destination:key});onNavigate(href);}}><Icon size={21} aria-hidden="true"/><span>{label}</span></a>)}</nav>;
}
