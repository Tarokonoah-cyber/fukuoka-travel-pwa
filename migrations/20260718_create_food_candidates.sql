create table if not exists travel_food_candidates (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  check (char_length(id) between 1 and 160),
  check (jsonb_typeof(payload) = 'object')
);

-- statement-breakpoint
create index if not exists travel_food_candidates_updated_at_idx
  on travel_food_candidates (updated_at desc);
