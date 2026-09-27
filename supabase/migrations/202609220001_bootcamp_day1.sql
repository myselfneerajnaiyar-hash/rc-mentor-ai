-- Student-owned Boot Camp storage only. Does not alter bootcamp_days or legacy tables.
-- Run once in Supabase SQL Editor. Fails safely if incompatible tables already exist.
begin;

create table public.bootcamp_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  program_key text not null default 'bootcamp',
  created_at timestamptz not null default now(),
  unique (user_id, program_key)
);
create table public.bootcamp_day_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.bootcamp_enrollments(id),
  day_number integer not null check (day_number = 1),
  source_hash text not null,
  source_revision text not null,
  snapshot jsonb not null,
  revision integer not null default 0,
  state jsonb not null,
  created_at timestamptz not null default now(),
  unique (enrollment_id, day_number)
);
create table public.bootcamp_block_attempts (
  day_attempt_id uuid not null references public.bootcamp_day_attempts(id),
  block_key text not null check (block_key in ('warmup','rc1','rc2','rc3','va')),
  position integer not null check (position between 0 and 4),
  state jsonb not null,
  primary key (day_attempt_id, block_key),
  unique (day_attempt_id, position)
);
create table public.bootcamp_question_attempts (
  day_attempt_id uuid not null,
  block_key text not null,
  source_question_id text not null,
  position integer not null,
  state jsonb not null,
  primary key (day_attempt_id, source_question_id),
  unique (day_attempt_id, block_key, position),
  foreign key (day_attempt_id, block_key) references public.bootcamp_block_attempts(day_attempt_id, block_key),
  check (state->>'outcome' is null or state->>'outcome' in ('correct','incorrect','skipped','not_reached','timed_out')),
  check (state->>'points' is null or (state->>'points')::integer in (0,1))
);

-- No direct browser access, even to owned snapshots: they contain protected keys.
alter table public.bootcamp_enrollments enable row level security;
alter table public.bootcamp_day_attempts enable row level security;
alter table public.bootcamp_block_attempts enable row level security;
alter table public.bootcamp_question_attempts enable row level security;
revoke all on public.bootcamp_enrollments, public.bootcamp_day_attempts,
  public.bootcamp_block_attempts, public.bootcamp_question_attempts from public, anon, authenticated;
grant select, insert, update on public.bootcamp_enrollments, public.bootcamp_day_attempts,
  public.bootcamp_block_attempts, public.bootcamp_question_attempts to service_role;

create function public.bootcamp_read(p_user uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare d public.bootcamp_day_attempts; blocks jsonb;
begin
  select a.* into d from public.bootcamp_day_attempts a join public.bootcamp_enrollments e on e.id=a.enrollment_id
    where a.id=p_id and e.user_id=p_user;
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  select jsonb_agg(b.state || jsonb_build_object('questions', (
    select jsonb_agg(q.state order by q.position) from public.bootcamp_question_attempts q
    where q.day_attempt_id=b.day_attempt_id and q.block_key=b.block_key
  )) order by b.position) into blocks from public.bootcamp_block_attempts b where b.day_attempt_id=p_id;
  return to_jsonb(d) || jsonb_build_object('state', d.state || jsonb_build_object('blocks',blocks), 'server_now',clock_timestamp());
end $$;

create function public.bootcamp_create(p_user uuid, p_enrollment uuid, p_snapshot jsonb,
  p_hash text, p_source_revision text, p_state jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare attempt_id uuid; b jsonb; q jsonb; i integer; j integer;
begin
  perform 1 from public.bootcamp_enrollments where id=p_enrollment and user_id=p_user for update;
  if not found then raise exception 'Enrollment not found' using errcode='P0002'; end if;
  select id into attempt_id from public.bootcamp_day_attempts where enrollment_id=p_enrollment and day_number=1;
  if found then return public.bootcamp_read(p_user,attempt_id); end if;
  if jsonb_array_length(p_snapshot->'blocks')<>5 or jsonb_array_length(p_state->'blocks')<>5 then
    raise exception 'Invalid Day 1 snapshot'; end if;
  insert into public.bootcamp_day_attempts(enrollment_id,day_number,source_hash,source_revision,snapshot,state)
    values(p_enrollment,1,p_hash,p_source_revision,p_snapshot,p_state-'blocks') returning id into attempt_id;
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

-- Serialized, optimistic commit of one server-validated transition. The revision
-- prevents lost saves, double advances, and races between tabs/server processes.
create function public.bootcamp_commit(p_user uuid, p_id uuid, p_revision integer, p_next jsonb, p_action text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare d public.bootcamp_day_attempts; old_record jsonb; old_state jsonb; old_b jsonb; b jsonb; q jsonb;
  i integer; j integer; current_index integer; deadline timestamptz; stamp timestamptz; seconds integer;
begin
  select a.* into d from public.bootcamp_day_attempts a join public.bootcamp_enrollments e on e.id=a.enrollment_id
    where a.id=p_id and e.user_id=p_user for update of a;
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  if d.revision<>p_revision then raise exception 'stale_revision' using errcode='40001'; end if;
  old_record := public.bootcamp_read(p_user,p_id); old_state := old_record->'state';
  current_index := (old_state->>'current_block')::integer;
  old_b := old_state->'blocks'->current_index;
  stamp := clock_timestamp(); deadline := (old_b->>'deadline_at')::timestamptz;
  if old_state->>'phase'='activity' and deadline is not null and stamp>=deadline then
    if p_action='responses' or p_next->'blocks'->current_index->>'end_reason' is distinct from 'timeout' then
      raise exception 'deadline_expired' using errcode='P0001';
    end if;
  end if;
  if p_next->'scoring_policy' is distinct from old_state->'scoring_policy'
    or p_next->'started_at' is distinct from old_state->'started_at'
    or jsonb_array_length(p_next->'blocks')<>5 then raise exception 'Immutable attempt fields'; end if;
  if p_action='block_start' then
    seconds := (d.snapshot->'blocks'->current_index->>'seconds')::integer;
    p_next := jsonb_set(p_next,array['blocks',current_index::text,'started_at'],to_jsonb(stamp));
    p_next := jsonb_set(p_next,array['blocks',current_index::text,'deadline_at'],
      case when seconds is null then 'null'::jsonb else to_jsonb(stamp+make_interval(secs=>seconds)) end);
  end if;
  for i in 0..4 loop
    b := p_next->'blocks'->i; old_b := old_state->'blocks'->i;
    if b->>'key' is distinct from old_b->>'key' or b->'position' is distinct from old_b->'position'
      or jsonb_array_length(b->'questions')<>jsonb_array_length(old_b->'questions') then raise exception 'Invalid block'; end if;
    if old_b->>'status'='completed' and (b->'questions' is distinct from old_b->'questions'
      or b->'result' is distinct from old_b->'result' or b->'finished_at' is distinct from old_b->'finished_at'
      or b->'deadline_at' is distinct from old_b->'deadline_at') then raise exception 'Finalized block is immutable'; end if;
    update public.bootcamp_block_attempts set state=b-'questions' where day_attempt_id=p_id and block_key=b->>'key';
    for j in 0..jsonb_array_length(b->'questions')-1 loop
      q := b->'questions'->j;
      if q->>'source_question_id' is distinct from old_b->'questions'->j->>'source_question_id' then raise exception 'Invalid question'; end if;
      update public.bootcamp_question_attempts set state=q where day_attempt_id=p_id and source_question_id=q->>'source_question_id';
    end loop;
  end loop;
  update public.bootcamp_day_attempts set state=p_next-'blocks',revision=revision+1 where id=p_id;
  return public.bootcamp_read(p_user,p_id);
end $$;

revoke all on function public.bootcamp_read(uuid,uuid) from public, anon, authenticated;
revoke all on function public.bootcamp_create(uuid,uuid,jsonb,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.bootcamp_commit(uuid,uuid,integer,jsonb,text) from public, anon, authenticated;
grant execute on function public.bootcamp_read(uuid,uuid) to service_role;
grant execute on function public.bootcamp_create(uuid,uuid,jsonb,text,text,jsonb) to service_role;
grant execute on function public.bootcamp_commit(uuid,uuid,integer,jsonb,text) to service_role;
notify pgrst, 'reload schema';
commit;
