create table if not exists travel_item_state (
  namespace text not null check (namespace in ('packing', 'shopping', 'wishlist', 'prep')),
  item_id text not null,
  checked boolean not null default false,
  custom_name text,
  custom_category text,
  updated_at timestamptz not null default now(),
  primary key (namespace, item_id),
  check (
    (custom_name is null and custom_category is null)
    or (custom_name is not null and custom_category is not null)
  )
);

-- statement-breakpoint
create index if not exists travel_item_state_updated_at_idx
  on travel_item_state (updated_at desc);
