import { BookOpen, Flame, Puzzle, Target, Newspaper, Brain, Timer, GraduationCap, MessageSquare, Trophy, Inbox } from 'lucide-react';
const icons = { daily_rc: BookOpen, workout: Flame, hangman: Puzzle, rc: BookOpen, precision: Target, editorial: Newspaper, vocab: Brain, speed: Timer, cat: GraduationCap, mentor: MessageSquare, leaderboards: Trophy, inbox: Inbox };
export default function ActivityIcon({id}) {
 const Icon = icons[id] || BookOpen;
 return <span className="mobile-activity-icon" aria-hidden="true"><Icon size={22}/></span>;
}
