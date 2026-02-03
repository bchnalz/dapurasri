-- Payment methods: run this in Supabase SQL Editor after the main schema.
-- Adds payment_methods master and payment_method_id to sales & purchase.

-- Payment methods (master)
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add column to sales_transactions (nullable for existing rows)
alter table public.sales_transactions
  add column if not exists payment_method_id uuid references public.payment_methods(id);

-- Add column to purchase_transactions (nullable for existing rows)
alter table public.purchase_transactions
  add column if not exists payment_method_id uuid references public.payment_methods(id);

-- RLS for payment_methods
alter table public.payment_methods enable row level security;
create policy "Authenticated full access on payment_methods"
  on public.payment_methods for all to authenticated using (true) with check (true);
