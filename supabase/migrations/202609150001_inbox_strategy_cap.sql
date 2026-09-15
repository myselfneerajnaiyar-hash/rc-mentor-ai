-- Extend the existing database-enforced daily cap to every proactive category.
create or replace function public.inbox_assign_proactive_day() returns trigger
language plpgsql set search_path = public as $inbox$
begin
  if new.proactive_date is not null or new.type in (
    'STUDY_REMINDER', 'DAILY_RECOMMENDATION', 'PERFORMANCE_UPDATE',
    'PROGRESS', 'STREAK', 'ACHIEVEMENT', 'MILESTONE', 'INACTIVITY',
    'EXAM_PREP', 'OFFER'
  ) then
    new.proactive_date := (new.created_at at time zone 'Asia/Kolkata')::date;
  end if;
  return new;
end;
$inbox$;
revoke all on function public.inbox_assign_proactive_day() from public, anon, authenticated;
