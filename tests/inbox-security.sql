-- Read-only catalog assertions for production or staging; not executed by the Node suite.
-- This checks actual catalog state rather than simulating privileges.
begin read only;

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
  if exists (
    select 1 from unnest(array['anon','authenticated']) role_name
    cross join unnest(array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege_name
    where has_table_privilege(role_name, 'public.inbox_notifications', privilege_name)
  ) then raise exception 'Inbox client mutation privileges remain'; end if;
  if has_table_privilege('anon', 'public.inbox_notifications', 'SELECT') then
    raise exception 'Anonymous Inbox reads remain';
  end if;
  if exists (
    select 1 from unnest(array['anon','authenticated']) role_name
    cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege_name
    where has_table_privilege(role_name, 'public.inbox_generation_runs', privilege_name)
  ) then raise exception 'Client generation-ledger privileges remain'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.inbox_generation_runs'::regclass) then
    raise exception 'Generation-ledger RLS is disabled';
  end if;
  if exists (
    select 1 from unnest(array['public.inbox_notifications','public.inbox_generation_runs']) table_name
    cross join unnest(array['SELECT','INSERT','UPDATE','DELETE']) privilege_name
    where not has_table_privilege('service_role', table_name, privilege_name)
  ) then raise exception 'Service role lacks required Inbox privileges'; end if;
  if not exists (
    select 1 from pg_index i join pg_class c on c.oid = i.indexrelid
    where i.indrelid = 'public.inbox_notifications'::regclass
      and c.relname = 'inbox_notifications_rule_key_idx' and i.indisunique and i.indisvalid and i.indisready
      and pg_get_indexdef(i.indexrelid) like '%(user_id, rule_key)%'
      and pg_get_expr(i.indpred, i.indrelid) = '(rule_key IS NOT NULL)'
  ) then raise exception 'Valid rule-key unique index is missing'; end if;
  if not exists (
    select 1 from pg_index i join pg_class c on c.oid = i.indexrelid
    where i.indrelid = 'public.inbox_notifications'::regclass
      and c.relname = 'inbox_notifications_daily_cap_idx' and i.indisunique and i.indisvalid and i.indisready
      and pg_get_indexdef(i.indexrelid) like '%(user_id, proactive_date)%'
      and pg_get_expr(i.indpred, i.indrelid) = '(proactive_date IS NOT NULL)'
  ) then raise exception 'Valid daily-cap unique index is missing'; end if;
  if not exists (
    select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.inbox_notifications'::regclass and t.tgname = 'inbox_assign_proactive_day'
      and t.tgenabled in ('O','A') and t.tgtype = 7
      and p.oid = 'public.inbox_assign_proactive_day()'::regprocedure
      and pg_get_functiondef(p.oid) like '%Asia/Kolkata%'
      and pg_get_functiondef(p.oid) like '%new.created_at%'
      and pg_get_functiondef(p.oid) like '%new.proactive_date%'
  ) then raise exception 'Expected BEFORE INSERT proactive-day trigger/function is missing'; end if;
end;
$$;

-- Definitions provide evidence for manual comparison with migration 002.
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename in ('inbox_notifications','inbox_generation_runs');
select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in ('inbox_notifications','inbox_generation_runs');
select pg_get_functiondef('public.inbox_assign_proactive_day()'::regprocedure);
rollback;
