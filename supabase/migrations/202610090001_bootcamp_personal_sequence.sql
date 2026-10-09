begin;

-- Existing enrollments keep their calendar behavior. New enrollments are marked
-- personal by the application and use the same curriculum source IDs 1-45.
alter table public.bootcamp_enrollments
  add column if not exists sequence_mode text not null default 'calendar'
  check (sequence_mode in ('calendar', 'personal'));

create or replace function public.bootcamp_create(p_user uuid, p_enrollment uuid, p_snapshot jsonb,
  p_hash text, p_source_revision text, p_state jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  training_day integer := (p_snapshot->>'dayNumber')::integer;
  attempt_id uuid;
  b jsonb;
  q jsonb;
  i integer;
  j integer;
  sequence_mode text;
  next_day integer := 1;
  prior_state jsonb;
begin
  select e.sequence_mode into sequence_mode
    from public.bootcamp_enrollments e
    where e.id=p_enrollment and e.user_id=p_user
    for update;
  if not found then raise exception 'Enrollment not found' using errcode='P0002'; end if;
  if training_day is null or training_day not between 1 and 50 then raise exception 'Invalid training day'; end if;
  select id into attempt_id from public.bootcamp_day_attempts where enrollment_id=p_enrollment and day_number=training_day;
  if found then return public.bootcamp_read(p_user,attempt_id); end if;

  if sequence_mode='personal' then
    loop
      exit when next_day > 45;
      select state into prior_state from public.bootcamp_day_attempts
        where enrollment_id=p_enrollment and day_number=next_day;
      exit when not found or prior_state->>'status' is distinct from 'completed';
      next_day := next_day + 1;
    end loop;
    if training_day<>next_day or training_day>45 then
      raise exception 'Complete the previous personal training day first' using errcode='P0001';
    end if;
  elsif training_day>45 then
    raise exception 'This Boot Camp curriculum ends at Day 45' using errcode='P0001';
  end if;

  if jsonb_array_length(p_snapshot->'blocks')<>5 or jsonb_array_length(p_state->'blocks')<>5 then
    raise exception 'Invalid Boot Camp snapshot'; end if;
  insert into public.bootcamp_day_attempts(enrollment_id,day_number,source_hash,source_revision,snapshot,state)
    values(p_enrollment,training_day,p_hash,p_source_revision,p_snapshot,p_state-'blocks') returning id into attempt_id;
  for i in 0..4 loop
    b := p_state->'blocks'->i;
    insert into public.bootcamp_block_attempts values(attempt_id,b->>'key',i,b-'questions');
    for j in 0..jsonb_array_length(b->'questions')-1 loop
      q := b->'questions'->j;
      insert into public.bootcamp_question_attempts values(attempt_id,b->>'key',q->>'source_question_id',j,q);
    end loop;
  end loop;
  return public.bootcamp_read(p_user,attempt_id);
end $$;

revoke all on function public.bootcamp_create(uuid,uuid,jsonb,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.bootcamp_create(uuid,uuid,jsonb,text,text,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
