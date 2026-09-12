alter table public.profiles
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists whatsapp_opt_in_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_whatsapp_opt_in_timestamp_check;
alter table public.profiles
  add constraint profiles_whatsapp_opt_in_timestamp_check
  check (not whatsapp_opt_in or whatsapp_opt_in_at is not null);

comment on column public.profiles.whatsapp_opt_in is
  'True only when the user explicitly consents to Auctor WhatsApp communication.';
comment on column public.profiles.whatsapp_opt_in_at is
  'Timestamp at which explicit Auctor WhatsApp consent was recorded.';

update public.whatsapp_automation_events event
set status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = 'whatsapp_opt_in_required',
    next_attempt_at = null,
    locked_at = null,
    locked_by = null,
    claim_token = null
where event.status in ('pending', 'failed')
  and not exists (
    select 1
    from public.profiles profile
    where profile.user_id = event.user_id
      and profile.whatsapp_opt_in = true
      and profile.whatsapp_opt_in_at is not null
  );

-- Backfill only unambiguous Indian mobile numbers. Consent is intentionally
-- not inferred or changed for any existing user.
update public.profiles
set phone = '+91' || btrim(phone)
where btrim(phone) ~ '^[6-9][0-9]{9}$';

update public.whatsapp_automation_events
set phone_snapshot = '+91' || btrim(phone_snapshot)
where btrim(phone_snapshot) ~ '^[6-9][0-9]{9}$';

update public.whatsapp_message_events
set phone = case
  when btrim(phone) ~ '^[6-9][0-9]{9}$' then '+91' || btrim(phone)
  when btrim(phone) ~ '^91[6-9][0-9]{9}$' then '+' || btrim(phone)
  else phone
end
where btrim(phone) ~ '^(91)?[6-9][0-9]{9}$';
