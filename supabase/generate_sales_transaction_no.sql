-- Generate unique sales transaction number (INV-YYYYMMDD-NNN) atomically.
-- Run in Supabase Dashboard → SQL Editor.
-- Prevents duplicate/failed entries when multiple users save at the same time.

CREATE OR REPLACE FUNCTION public.generate_sales_transaction_no(p_txn_date date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_key bigint;
  prefix text;
  max_num int;
  next_num int;
BEGIN
  prefix := 'INV-' || to_char(p_txn_date, 'YYYYMMDD') || '-';
  -- Same date => same lock so only one caller gets the next number at a time.
  lock_key := 10000000000::bigint + (to_char(p_txn_date, 'YYYYMMDD')::bigint);
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT COALESCE(MAX(
    (regexp_match(transaction_no, '[0-9]+$'))[1]::int
  ), 0) INTO max_num
  FROM public.sales_transactions
  WHERE transaction_no LIKE prefix || '%'
    AND transaction_no ~ ('^INV-[0-9]{8}-[0-9]+$');

  next_num := max_num + 1;
  RETURN prefix || lpad(next_num::text, 3, '0');
END;
$$;

COMMENT ON FUNCTION public.generate_sales_transaction_no(date) IS
  'Returns next unique sales transaction number for the given date. Uses advisory lock to avoid duplicates under concurrency.';

-- Allow authenticated and service role to call (Supabase RPC).
GRANT EXECUTE ON FUNCTION public.generate_sales_transaction_no(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_sales_transaction_no(date) TO service_role;
