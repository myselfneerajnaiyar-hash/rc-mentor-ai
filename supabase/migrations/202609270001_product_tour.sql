begin;
create table if not exists public.product_tour_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 completed_at timestamptz not null default now()
);
alter table public.product_tour_progress enable row level security;
revoke all on public.product_tour_progress from anon, authenticated;
grant select on public.product_tour_progress to authenticated;
grant all on public.product_tour_progress to service_role;
create policy "Read own product tour completion" on public.product_tour_progress for select to authenticated using (auth.uid() = user_id);
-- Preserve completion from the legacy Birbal onboarding flow.
insert into public.product_tour_progress (user_id)
select user_id from public.profiles where birbal_onboarded is true
on conflict (user_id) do nothing;
commit;
