// Discovery flags only: existing Boot Camp routes and services remain intact.
export const BOOTCAMP_ENABLED = false;
export const GRAMMAR_ENABLED = false;
export const MOBILE_BREAKPOINT = 900;
export const FEATURES = [
  { id: 'daily_rc', name: 'Daily RC Challenge', group: 'Daily', description: 'One passage. A fresh reading challenge.', time: '8 min', href: '/daily-challenge', capability: 'showDailyRC' },
  { id: 'workout', name: 'Daily Workout', group: 'Daily', description: 'Reading, vocabulary and speed in one session.', time: '25–30 min', href: '/?view=today&activity=workout' },
  { id: 'hangman', name: 'Word Hunt', group: 'Daily', description: 'Build vocabulary with a daily word puzzle.', time: '5 min', href: '/?view=today&activity=hangman' },
  { id: 'rc', name: 'RC Practice & Generator', group: 'Reading', description: 'Generate a passage or bring your own for guided practice.', href: '/?view=rc', premium: true },
  { id: 'precision', name: 'Precision Training', group: 'Reading', description: 'Focus on the question types you want to improve.', href: '/?view=precision', premium: true },
  { id: 'editorial', name: 'Editorial Decoder', group: 'Reading', description: 'Understand an editorial with Birbal. Upload or scan.', href: '/birbal-v2', premium: true },
  { id: 'vocab', name: 'Vocabulary Lab', group: 'Verbal & speed', description: 'Learn words, practise recall and revisit your word bank.', href: '/?view=vocab', premium: true },
  { id: 'speed', name: 'Speed Reading Gym', group: 'Verbal & speed', description: 'Read faster while checking comprehension.', time: '3–5 min', href: '/?view=speed', premium: true },
  { id: 'cat', name: 'CAT Sectional Tests', group: 'Testing', description: 'Official CAT papers and mock tests. Individual access shown inside.', href: '/?view=cat', capability: 'showCATSectionals' },
  { id: 'mentor', name: 'Ask Birbal', group: 'Your tools', description: 'Get help with your reading and your next practice.', href: '/?view=mentor', premium: true },
  { id: 'leaderboards', name: 'Leaderboards', group: 'Your tools', description: 'Daily rankings and the weekly RC challenge.', href: '/?view=leaderboards' },
  { id: 'inbox', name: 'Inbox', group: 'Your tools', description: 'Your learning updates and reminders.', href: '/inbox' },
];
export function visibleFeatures(capabilities = {}) { return FEATURES.filter(f => !f.capability || capabilities[f.capability]); }
export function nextActivity(activities, exclude) {
  const eligible = activities.filter(a => a.available && a.id !== exclude);
  return eligible.find(a => !a.completed) || eligible[0] || null;
}
export function destination(view) { return ['home','today','practice','profile'].includes(view) ? view : ['workout','hangman'].includes(view) ? 'today' : 'practice'; }
