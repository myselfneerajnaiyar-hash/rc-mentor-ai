-- Read-only assertions for the migrated staging database; not executed by the Node suite.
-- This checks actual catalog state rather than simulating privileges.
do $$
begin
  if has_table_privilege('authenticated', 'public.inbox_notifications', 'UPDATE')
     or has_any_column_privilege('authenticated', 'public.inbox_notifications', 'UPDATE') then
    raise exception 'Authenticated users can still modify notification content directly';
  end if;
  if has_table_privilege('authenticated', 'public.inbox_notifications', 'INSERT') or has_table_privilege('authenticated', 'public.inbox_notifications', 'DELETE') then
    raise exception 'Direct authenticated insertion/deletion is still granted';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'inbox_notifications' and policyname = 'Inbox ownership boundary' and permissive = 'RESTRICTIVE') then
    raise exception 'Restrictive ownership boundary is absent';
  end if;
  if not has_table_privilege('authenticated', 'public.inbox_notifications', 'SELECT') then
    raise exception 'Authenticated Inbox reads are unavailable';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.inbox_notifications'::regclass) then
    raise exception 'Inbox RLS is disabled';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'inbox_notifications' and cmd = 'SELECT' and qual like '%auth.uid()%user_id%') then
    raise exception 'Expected owner-scoped SELECT policy is absent';
  end if;
  if has_table_privilege('authenticated', 'public.inbox_generation_runs', 'SELECT') then
    raise exception 'Generation ledger is exposed';
  end if;
  if not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'inbox_notifications_daily_cap_idx' and indexdef like 'CREATE UNIQUE INDEX%') then
    raise exception 'Daily uniqueness index is absent';
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.inbox_notifications'::regclass and tgname = 'inbox_assign_proactive_day' and tgenabled = 'O') then
    raise exception 'Proactive day assignment trigger is absent';
  end if;
end;
$$;
