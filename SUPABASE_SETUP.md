# Supabase setup for Dapurasri

## Create tables and RLS

1. Open your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**.
2. Click **New query**.
3. Copy the contents of `supabase/schema.sql` and paste into the editor.
4. Click **Run** (or Ctrl+Enter).

This creates:

- `products` – product master (name, price, unit)
- `purchase_categories` – purchase category master
- `sales_transactions` – sales header (transaction_no, transaction_date, total)
- `sales_details` – sales line items (product, quantity, unit_price, subtotal)
- `purchase_transactions` – purchase lines (category, description, amount, transaction_date)

Plus indexes and RLS policies so authenticated users have full access.

## Unique sales transaction numbers (required for sales)

To avoid duplicate or failed sales entries when multiple users save at once, run the transaction-number generator:

1. In SQL Editor, open a **New query**.
2. Copy the contents of `supabase/generate_sales_transaction_no.sql` and run it.

This creates the `generate_sales_transaction_no(date)` function. The app calls it via RPC to get a unique `INV-YYYYMMDD-NNN` number per day (advisory lock ensures no collisions).

## Payment methods (optional but recommended)

To use payment method selection in sales and purchase dialogs:

1. In SQL Editor, open a **New query**.
2. Copy the contents of `supabase/payment_methods_migration.sql` and run it.

This creates the `payment_methods` table and adds `payment_method_id` to `sales_transactions` and `purchase_transactions`. Then add payment methods via **Master → Metode Pembayaran** in the app.

## Auth users

- Go to **Authentication** → **Users** → **Add user** (email + password) to create an admin.
- Use that email/password to log in to the app.
