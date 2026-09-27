'use client';
import { Home, CalendarDays, BookOpen, User } from 'lucide-react';
import { captureLearningEvent } from '@/lib/learningAnalytics';
const tabs=[['home','Home',Home],['today','Today',CalendarDays],['practice','Practice',BookOpen],['profile','Profile',User]];
export default function MobileBottomNav({view,onNavigate}){
 return <nav className="auctor-mobile-nav" aria-label="Main navigation">{tabs.map(([key,label,Icon])=><a key={key} href={`/?view=${key}`} aria-label={label} aria-current={view===key?'page':undefined} onClick={e=>{e.preventDefault();captureLearningEvent('mobile_nav_click',{destination:key});onNavigate(`/?view=${key}`);}}><Icon size={21} aria-hidden="true"/><span>{label}</span></a>)}</nav>;
}
