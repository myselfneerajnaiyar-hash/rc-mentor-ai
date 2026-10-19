-- Paid platform plans have the same CAT sectional entitlement; their expiry
-- controls duration. The separately sold CAT Test Series remains sectional-only.
create or replace function public.has_active_cat_sectional_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = (select auth.uid())
      and s.plan in ('monthly', 'quarterly', 'half_yearly', 'yearly', 'cat_test_series')
      and s.expires_at > statement_timestamp()
  );
$$;

revoke all on function public.has_active_cat_sectional_access() from public;
grant execute on function public.has_active_cat_sectional_access() to anon, authenticated;

alter table public.sectional_test_content enable row level security;
alter table public.sectional_passage_content enable row level security;
alter table public.sectional_question_content enable row level security;
alter table public.sectional_va_content enable row level security;
alter table public.mentor_test_attempts enable row level security;
alter table public.mentor_rc_passage_attempts enable row level security;
alter table public.mentor_rc_question_attempts enable row level security;
alter table public.mentor_va_attempts enable row level security;

drop policy if exists "public read sectional tests" on public.sectional_test_content;
create policy "published sectional tests require entitlement or free access"
on public.sectional_test_content for select to public
using (
  is_published is true
  and (is_free is true or (select public.has_active_cat_sectional_access()))
);

drop policy if exists "public read sectional passages" on public.sectional_passage_content;
create policy "sectional passages require parent test access"
on public.sectional_passage_content for select to public
using (
  exists (
    select 1 from public.sectional_test_content t
    where t.id = test_id
      and t.is_published is true
      and (t.is_free is true or (select public.has_active_cat_sectional_access()))
  )
);

drop policy if exists "public read sectional questions" on public.sectional_question_content;
create policy "sectional questions require parent test access"
on public.sectional_question_content for select to public
using (
  exists (
    select 1 from public.sectional_test_content t
    where t.id = test_id
      and t.is_published is true
      and (t.is_free is true or (select public.has_active_cat_sectional_access()))
  )
);

drop policy if exists "public read sectional va" on public.sectional_va_content;
create policy "sectional verbal ability questions require parent test access"
on public.sectional_va_content for select to public
using (
  exists (
    select 1 from public.sectional_test_content t
    where t.id = test_id
      and t.is_published is true
      and (t.is_free is true or (select public.has_active_cat_sectional_access()))
  )
);

drop policy if exists "mentor_test_attempts_insert_own" on public.mentor_test_attempts;
create policy "mentor_test_attempts_insert_own_with_access"
on public.mentor_test_attempts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.sectional_test_content t
    where t.id = test_id
      and t.is_published is true
      and (t.is_free is true or (select public.has_active_cat_sectional_access()))
  )
);

drop policy if exists "mentor_test_attempts_select_own" on public.mentor_test_attempts;
create policy "mentor_test_attempts_select_own_with_access"
on public.mentor_test_attempts for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.sectional_test_content t
    where t.id = test_id
      and t.is_published is true
      and (t.is_free is true or (select public.has_active_cat_sectional_access()))
  )
);

drop policy if exists "mentor_test_attempts_update_own" on public.mentor_test_attempts;
create policy "mentor_test_attempts_update_own_with_access"
on public.mentor_test_attempts for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.sectional_test_content t
    where t.id = test_id
      and t.is_published is true
      and (t.is_free is true or (select public.has_active_cat_sectional_access()))
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.sectional_test_content t
    where t.id = test_id
      and t.is_published is true
      and (t.is_free is true or (select public.has_active_cat_sectional_access()))
  )
);

drop policy if exists "mentor_rc_passage_attempts_insert_own" on public.mentor_rc_passage_attempts;
create policy "mentor_rc_passage_attempts_insert_own_with_access"
on public.mentor_rc_passage_attempts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.mentor_test_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  )
);
drop policy if exists "mentor_rc_passage_attempts_select_own" on public.mentor_rc_passage_attempts;
create policy "mentor_rc_passage_attempts_select_own_with_access"
on public.mentor_rc_passage_attempts for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.mentor_test_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  )
);

drop policy if exists "mentor_rc_question_attempts_insert_own" on public.mentor_rc_question_attempts;
create policy "mentor_rc_question_attempts_insert_own_with_access"
on public.mentor_rc_question_attempts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.mentor_test_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  )
);
drop policy if exists "mentor_rc_question_attempts_select_own" on public.mentor_rc_question_attempts;
create policy "mentor_rc_question_attempts_select_own_with_access"
on public.mentor_rc_question_attempts for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.mentor_test_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  )
);

drop policy if exists "mentor_va_attempts_insert_own" on public.mentor_va_attempts;
create policy "mentor_va_attempts_insert_own_with_access"
on public.mentor_va_attempts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.mentor_test_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  )
);
drop policy if exists "mentor_va_attempts_select_own" on public.mentor_va_attempts;
create policy "mentor_va_attempts_select_own_with_access"
on public.mentor_va_attempts for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.mentor_test_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  )
);
