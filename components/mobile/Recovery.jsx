'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { captureLearningEvent } from '@/lib/learningAnalytics';
export default function Recovery({ message, onRetry, title = 'Let’s try that again', area = 'activity' }) {
  useEffect(() => { captureLearningEvent('mobile_error', { area }); }, [area, message]);
  return <section className="mobile-recovery" role="alert"><h2>{title}</h2><p>{message || 'Your activity could not load. Your current answers and settings have not been cleared.'}</p><div>{onRetry && <button type="button" onClick={() => { captureLearningEvent('mobile_retry', { area }); onRetry(); }}>Retry</button>}<Link href="/?view=today">Back to Today</Link></div></section>;
}
