-- History follows saved completed attempts, not curriculum day order.
-- The current workout is still excluded from its own trainer evidence.
begin;

create or replace function public.bootcamp_history(p_user uuid, p_before_day integer)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_before_day is null or p_before_day not between 1 and 50 then
    raise exception 'Invalid training day';
  end if;
  return coalesce((
    select jsonb_agg(public.bootcamp_read(p_user,a.id) order by a.day_number)
    from public.bootcamp_day_attempts a
    join public.bootcamp_enrollments e on e.id=a.enrollment_id
    where e.user_id=p_user
      and e.program_key='bootcamp'
      and a.day_number<>p_before_day
  ),'[]'::jsonb);
end $$;

revoke all on function public.bootcamp_history(uuid,integer) from public,anon,authenticated;
grant execute on function public.bootcamp_history(uuid,integer) to service_role;
notify pgrst,'reload schema';
commit;
