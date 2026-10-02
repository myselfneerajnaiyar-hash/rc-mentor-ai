-- Separate CAT PYQ passages from original Daily RC Challenge passages.
-- Existing and otherwise unspecified records stay classified as CAT PYQ.
begin;

alter table public.daily_rc_sets
  add column if not exists category text not null default 'cat_pyq';

update public.daily_rc_sets
set category = 'cat_pyq'
where category is null or category = '';

alter table public.daily_rc_sets
  alter column category set default 'cat_pyq',
  alter column category set not null;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.daily_rc_sets'::regclass
      and conname = 'daily_rc_sets_category_check'
  ) then
    alter table public.daily_rc_sets
      add constraint daily_rc_sets_category_check
      check (category in ('cat_pyq', 'daily_rc_challenge'));
  end if;
end;
$migration$;

comment on column public.daily_rc_sets.category is
  'Passage category: cat_pyq for historical CAT questions or daily_rc_challenge for original/general RC passages.';

commit;
