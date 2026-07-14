create table if not exists travel_day_plan_state (
  travel_date date not null,
  item_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'skipped')),
  sort_order integer not null,
  is_custom boolean not null default false,
  custom_title text,
  custom_time_label text,
  custom_start_time text,
  custom_location text,
  custom_note text,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (travel_date, item_id),
  check (
    (is_custom = false and custom_title is null)
    or (is_custom = true and custom_title is not null)
  ),
  check (custom_start_time is null or custom_start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

-- statement-breakpoint
create index if not exists travel_day_plan_state_date_order_idx
  on travel_day_plan_state (travel_date, sort_order, item_id)
  where deleted_at is null;
