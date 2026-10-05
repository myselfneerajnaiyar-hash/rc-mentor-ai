-- Correct only the verified sourceAnswer formatting defects on Boot Camp Days 1-15.
-- Safe to rerun: already-correct values are accepted and left unchanged.
begin;

do $patch$
declare
  r record;
  section text[];
  section_name text;
  d jsonb;
  arr jsonb;
  item jsonb;
  passages jsonb;
  passage jsonb;
  qs jsonb;
  i integer;
  j integer;
  qid text;
  oldv text;
  newv text;
  expected_day integer;
  expected_section text;
  expected_type text;
  seen integer := 0;
  changed integer := 0;
  rows_changed integer;
  targets jsonb := '{
    "bootcamp-day-1-rc3-q4":[1,"B ","B","Author Agreement","passages"],
    "bootcamp-day-1-va-q1":[1,"2-3-1-4","2,3,1,4","Para Jumble","verbalAbility"],
    "bootcamp-day-1-va-q5":[1,"2-1-3-4","2,1,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-2-va-q1":[2,"2-3-4-1","2,3,4,1","Para Jumble","verbalAbility"],
    "bootcamp-day-2-va-q5":[2,"4-2-3-1","4,2,3,1","Para Jumble","verbalAbility"],
    "bootcamp-day-3-va-q1":[3,"2-4-1-3","2,4,1,3","Para Jumble","verbalAbility"],
    "bootcamp-day-3-va-q5":[3,"2-3-1-4","2,3,1,4","Para Jumble","verbalAbility"],
    "bootcamp-day-4-va-q1":[4,"3-4-1-2","3,4,1,2","Para Jumble","verbalAbility"],
    "bootcamp-day-4-va-q2":[4,"2-1-3-4","2,1,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-5-va-q1":[5,"2-3-4-1","2,3,4,1","Para Jumble","verbalAbility"],
    "bootcamp-day-5-va-q5":[5,"2-4-1-3","2,4,1,3","Para Jumble","verbalAbility"],
    "bootcamp-day-6-va-q1":[6,"2-4-3-1","2,4,3,1","Para Jumble","verbalAbility"],
    "bootcamp-day-6-va-q5":[6,"4-2-1-3","4,2,1,3","Para Jumble","verbalAbility"],
    "bootcamp-day-7-va-q1":[7,"2-1-3-4","2,1,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-7-va-q5":[7,"2-3-1-4","2,3,1,4","Para Jumble","verbalAbility"],
    "bootcamp-day-8-va-q1":[8,"1-4-2-3","1,4,2,3","Para Jumble","verbalAbility"],
    "bootcamp-day-8-va-q5":[8,"2-4-3-1","2,4,3,1","Para Jumble","verbalAbility"],
    "bootcamp-day-9-va-q1":[9,"2-1-3-4","2,1,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-9-va-q5":[9,"2-4-3-1","2,4,3,1","Para Jumble","verbalAbility"],
    "bootcamp-day-10-va-q1":[10,"2-3-1-4","2,3,1,4","Para Jumble","verbalAbility"],
    "bootcamp-day-10-va-q5":[10,"4-1-2-3","4,1,2,3","Para Jumble","verbalAbility"],
    "bootcamp-day-11-va-q1":[11,"2-1-3-4","2,1,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-11-va-q5":[11,"2-1-3-4","2,1,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-12-va-q1":[12,"2-1-3-4","2,1,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-12-va-q5":[12,"1-2-3-4","1,2,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-13-va-q1":[13,"2-4-1-3","2,4,1,3","Para Jumble","verbalAbility"],
    "bootcamp-day-13-va-q5":[13,"2-1-3-4","2,1,3,4","Para Jumble","verbalAbility"],
    "bootcamp-day-14-va-q1":[14,"2-4-1-3","2,4,1,3","Para Jumble","verbalAbility"],
    "bootcamp-day-14-va-q5":[14,"2-3-4-1","2,3,4,1","Para Jumble","verbalAbility"],
    "bootcamp-day-15-va-q1":[15,"2-3-1-4","2,3,1,4","Para Jumble","verbalAbility"],
    "bootcamp-day-15-va-q5":[15,"1-2-3-4","1,2,3,4","Para Jumble","verbalAbility"]
  }'::jsonb;
begin
  for r in
    select id, day_number, document
    from public.bootcamp_days
    where day_number between 1 and 15
    order by day_number
    for update
  loop
    d := r.document;

    foreach section slice 1 in array array[
      array['content','warmup'],
      array['content','verbalAbility']
    ] loop
      section_name := section[2];
      arr := d #> section;
      for i in 0..jsonb_array_length(arr)-1 loop
        item := arr->i;
        qid := item->>'id';
        if targets ? qid then
          expected_day := (targets->qid->>0)::integer;
          oldv := targets->qid->>1;
          newv := targets->qid->>2;
          expected_type := targets->qid->>3;
          expected_section := targets->qid->>4;
          if r.day_number <> expected_day or section_name <> expected_section then
            raise exception 'Target % found in unexpected day or section', qid;
          end if;
          if item->>'type' is distinct from expected_type then
            raise exception 'Unexpected question type for %', qid;
          end if;
          if expected_type = 'Para Jumble' then
            if item->'answer' is distinct from to_jsonb(string_to_array(newv, ',')::integer[]) then
              raise exception 'Unexpected answer for %', qid;
            end if;
          elsif item->>'answer' is distinct from 'B' then
            raise exception 'Unexpected answer for %', qid;
          end if;
          seen := seen + 1;
          if item->>'sourceAnswer' = oldv then
            item := jsonb_set(item, '{sourceAnswer}', to_jsonb(newv), false);
            arr := jsonb_set(arr, array[i::text], item, false);
            changed := changed + 1;
          elsif item->>'sourceAnswer' is distinct from newv then
            raise exception 'Unexpected sourceAnswer for %', qid;
          end if;
        end if;
      end loop;
      d := jsonb_set(d, section, arr, false);
    end loop;

    passages := d #> '{content,passages}';
    for i in 0..jsonb_array_length(passages)-1 loop
      passage := passages->i;
      qs := passage->'questions';
      for j in 0..jsonb_array_length(qs)-1 loop
        item := qs->j;
        qid := item->>'id';
        if targets ? qid then
          expected_day := (targets->qid->>0)::integer;
          oldv := targets->qid->>1;
          newv := targets->qid->>2;
          expected_type := targets->qid->>3;
          expected_section := targets->qid->>4;
          if r.day_number <> expected_day or expected_section <> 'passages' then
            raise exception 'Target % found in unexpected day or section', qid;
          end if;
          if item->>'type' is distinct from expected_type or item->>'answer' is distinct from 'B' then
            raise exception 'Unexpected question type or answer for %', qid;
          end if;
          seen := seen + 1;
          if item->>'sourceAnswer' = oldv then
            item := jsonb_set(item, '{sourceAnswer}', to_jsonb(newv), false);
            qs := jsonb_set(qs, array[j::text], item, false);
            changed := changed + 1;
          elsif item->>'sourceAnswer' is distinct from newv then
            raise exception 'Unexpected sourceAnswer for %', qid;
          end if;
        end if;
      end loop;
      passage := jsonb_set(passage, '{questions}', qs, false);
      passages := jsonb_set(passages, array[i::text], passage, false);
    end loop;
    d := jsonb_set(d, '{content,passages}', passages, false);

    if d is distinct from r.document then
      update public.bootcamp_days set document = d where id = r.id and document = r.document;
      get diagnostics rows_changed = row_count;
      if rows_changed <> 1 then
        raise exception 'Concurrent change detected for %', r.id;
      end if;
    end if;
  end loop;

  if seen <> 31 then
    raise exception 'Expected to find 31 target questions, found %', seen;
  end if;
  if changed > 31 then
    raise exception 'Expected at most 31 sourceAnswer changes, got %', changed;
  end if;
end;
$patch$;

commit;
