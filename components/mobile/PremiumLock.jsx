'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { captureLearningEvent } from '@/lib/learningAnalytics';
export default function PremiumLock({ feature, onClose }) {
  const ref = useRef(null);
  useEffect(() => { const dialog=ref.current; const previous=document.activeElement; dialog?.showModal(); captureLearningEvent('mobile_lock_view',{feature:feature.id}); return () => { dialog?.close(); previous?.focus?.(); }; }, [feature.id]);
  return <dialog ref={ref} className="mobile-lock" onCancel={onClose}><p className="mobile-eyebrow">Premium practice</p><h2>{feature.name}</h2><p>{feature.description || 'Personalised reading practice and guidance with your Auctor access.'}</p><p>An active trial, subscription or institute access unlocks this feature.</p><Link className="mobile-primary" href={`/pricing?returnTo=${encodeURIComponent(feature.href || '/')}`}>Explore access options</Link><Link className="mobile-secondary" href="/?view=today" onClick={onClose}>Try free daily practice</Link><button className="mobile-text-action" onClick={onClose}>Back to what I was doing</button></dialog>;
}
