alter table travel_item_state
  add column if not exists custom_note text;

-- statement-breakpoint
alter table travel_item_state
  add column if not exists custom_source_url text;

-- statement-breakpoint
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'travel_item_state_recommendation_custom_check'
      and conrelid = 'public.travel_item_state'::regclass
  ) then
    alter table travel_item_state
      add constraint travel_item_state_recommendation_custom_check
      check (
        (custom_note is null and custom_source_url is null)
        or (custom_name is not null and custom_category is not null)
      );
  end if;
end
$$;
