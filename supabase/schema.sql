-- Dapurasri – Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

-- Products (master)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(18, 2) not null check (price >= 0),
  unit text not null default 'kg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Purchase categories (master)
create table if not exists public.purchase_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sales transactions (header)
create table if not exists public.sales_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_no text not null unique,
  transaction_date date not null,
  total numeric(18, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sales details (line items)
create table if not exists public.sales_details (
  id uuid primary key default gen_random_uuid(),
  sales_transaction_id uuid not null references public.sales_transactions(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(18, 3) not null check (quantity > 0),
  unit_price numeric(18, 2) not null check (unit_price >= 0),
  subtotal numeric(18, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Purchase transactions (one row per purchase line)
create table if not exists public.purchase_transactions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.purchase_categories(id),
  description text not null,
  amount numeric(18, 2) not null check (amount >= 0),
  transaction_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_sales_transactions_date on public.sales_transactions(transaction_date desc);
create index if not exists idx_sales_details_sales_transaction_id on public.sales_details(sales_transaction_id);
create index if not exists idx_purchase_transactions_date on public.purchase_transactions(transaction_date desc);
create index if not exists idx_purchase_transactions_category_id on public.purchase_transactions(category_id);

-- RLS: allow authenticated users full access (admin app)
alter table public.products enable row level security;
alter table public.purchase_categories enable row level security;
alter table public.sales_transactions enable row level security;
alter table public.sales_details enable row level security;
alter table public.purchase_transactions enable row level security;

create policy "Authenticated full access on products"
  on public.products for all to authenticated using (true) with check (true);

create policy "Authenticated full access on purchase_categories"
  on public.purchase_categories for all to authenticated using (true) with check (true);

create policy "Authenticated full access on sales_transactions"
  on public.sales_transactions for all to authenticated using (true) with check (true);

create policy "Authenticated full access on sales_details"
  on public.sales_details for all to authenticated using (true) with check (true);

create policy "Authenticated full access on purchase_transactions"
  on public.purchase_transactions for all to authenticated using (true) with check (true);
