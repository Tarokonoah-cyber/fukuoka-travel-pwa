create extension if not exists pgcrypto;

-- statement-breakpoint
create table if not exists travel_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  store_name text,
  store_name_ja text,
  amount_jpy integer not null check (amount_jpy >= 0),
  exchange_rate numeric(12, 6) not null check (exchange_rate > 0),
  amount_twd integer not null check (amount_twd >= 0),
  category text not null check (
    category in ('餐飲', '交通', '購物', '伴手禮', '門票', '住宿', '藥妝', '其他')
  ),
  payment_method text not null check (
    payment_method in ('現金', '信用卡', '交通卡', '其他')
  ),
  note text,
  input_method text not null default 'scan' check (input_method in ('scan', 'manual')),
  receipt_hash text,
  ai_confidence numeric(5, 4),
  ai_raw_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- statement-breakpoint
create index if not exists travel_expenses_expense_date_idx
  on travel_expenses (expense_date desc);

-- statement-breakpoint
create index if not exists travel_expenses_created_at_idx
  on travel_expenses (created_at desc);

-- statement-breakpoint
create index if not exists travel_expenses_receipt_hash_idx
  on travel_expenses (receipt_hash)
  where receipt_hash is not null;

-- statement-breakpoint
create or replace function set_travel_expenses_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- statement-breakpoint
drop trigger if exists travel_expenses_set_updated_at on travel_expenses;
-- statement-breakpoint
create trigger travel_expenses_set_updated_at
before update on travel_expenses
for each row execute function set_travel_expenses_updated_at();
