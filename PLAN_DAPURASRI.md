# Dapurasri – Pre-development plan

## 1. Confirmation of requirements

Understood:

- **Stack:** React (Vite), Shadcn/ui, Supabase, React Router, React Hook Form, date-fns, Lucide React.
- **DB:** Supabase Auth only (no custom `users` table). Tables: `products`, `purchase_categories`, `sales_transactions`, `sales_details`, `purchase_transactions`.
- **Features:** Auth (admin login + session), Master (products + purchase categories CRUD), Dashboard (monthly Penjualan & Pembelian separately; no profit/loss sum; optional chart), Transaction page (sales + purchase tables + dialogs), Financial report (filters: product on sales only, date range; combined table; summary = Penjualan total + Pembelian total only).
- **Routes:** `/login`, `/dashboard`, `/master/products`, `/master/categories`, `/transactions`, `/reports`.
- **UX:** Responsive, loading states, toasts, delete confirmation, form validation.

---

## 2. Folder structure

```
src/
├── components/           # Shared UI
│   ├── ui/               # Shadcn components (generated)
│   ├── layout/
│   │   ├── AppLayout.jsx
│   │   └── ProtectedRoute.jsx
│   └── common/
│       ├── DataTable.jsx
│       ├── ConfirmDialog.jsx
│       └── LoadingSpinner.jsx
├── lib/
│   ├── supabase.js       # Supabase client
│   └── utils.js          # cn(), etc.
├── hooks/
│   ├── useAuth.js
│   └── useToast.js
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── master/
│   │   ├── Products.jsx
│   │   └── Categories.jsx
│   ├── Transactions.jsx
│   │   ├── SalesEntryDialog.jsx
│   │   ├── SalesInvoicePreviewDialog.jsx
│   │   ├── PurchaseEntryDialog.jsx
│   │   ├── SalesTable.jsx
│   │   └── PurchaseTable.jsx
│   └── Reports.jsx
├── contexts/
│   └── AuthContext.jsx
├── routes/
│   └── index.jsx         # Route definitions
├── App.jsx
├── main.jsx
└── index.css
```

---

## 3. Files to create (checklist)

| Area | File | Purpose |
|------|------|--------|
| **Lib** | `src/lib/supabase.js` | Supabase client init |
| | `src/lib/utils.js` | `cn()` and helpers |
| **Context** | `src/contexts/AuthContext.jsx` | Auth state + session |
| **Hooks** | `src/hooks/useAuth.js` | Auth helpers |
| **Layout** | `src/components/layout/AppLayout.jsx` | Sidebar/nav + outlet |
| | `src/components/layout/ProtectedRoute.jsx` | Redirect if not logged in |
| **Common** | `src/components/common/DataTable.jsx` | Pagination, search, sort |
| | `src/components/common/ConfirmDialog.jsx` | Delete confirmation |
| | `src/components/common/LoadingSpinner.jsx` | Loading state |
| **Pages** | `src/pages/Login.jsx` | Login form |
| | `src/pages/Dashboard.jsx` | Stats cards + optional chart |
| | `src/pages/master/Products.jsx` | Products CRUD |
| | `src/pages/master/Categories.jsx` | Purchase categories CRUD |
| | `src/pages/Transactions.jsx` | Two-column layout + tables |
| | `src/pages/Transactions/SalesEntryDialog.jsx` | New/edit sales |
| | `src/pages/Transactions/SalesInvoicePreviewDialog.jsx` | Invoice preview + confirm |
| | `src/pages/Transactions/PurchaseEntryDialog.jsx` | New/edit purchase |
| | `src/pages/Transactions/SalesTable.jsx` | Sales list + pagination |
| | `src/pages/Transactions/PurchaseTable.jsx` | Purchase list + pagination |
| | `src/pages/Reports.jsx` | Filters + combined table + summary |
| **Routes** | `src/routes/index.jsx` | Router config |
| **Root** | `src/App.jsx` | Router + AuthProvider + Toaster |
| **Shadcn** | `src/components/ui/*` | Button, Input, Dialog, Table, etc. (via CLI) |

Supabase: SQL migration for 5 tables (`products`, `purchase_categories`, `sales_transactions`, `sales_details`, `purchase_transactions`). No custom `users` table; use Supabase Auth only.

---

## 4. Data flow (UI → Supabase)

- **Auth:** Login form → `supabase.auth.signInWithPassword()` → session in `AuthContext` → `ProtectedRoute` reads session; logout → `signOut()`.
- **Products:** List → `from('products').select()`; Create/Update/Delete → `insert` / `update` / `delete` with React Hook Form payload.
- **Purchase categories:** Same pattern as products → `purchase_categories` table.
- **Sales:**  
  - Transaction number: **auto-generated** (e.g. `INV-YYYYMMDD-001`).  
  - New: Sales dialog (date + line items) → “Generate Invoice” → preview dialog → “Confirm” → generate invoice no. → `insert` into `sales_transactions` (one row) then `insert` into `sales_details` (one row per line).  
  - Edit: Load transaction + details → same flow with `update` by id.  
  - List: `sales_transactions` (with join/sum for total if needed) + pagination.
- **Purchases:** Dialog (date, category, description, amount; multiple rows via “+”) → “Save” → `insert` into `purchase_transactions` (one row per item) in one or more calls.
- **Reports:** Filters: **product** (applies only to sales table / sales lines), **date range**. Query sales (optionally filtered by product via `sales_details.product_id`) + purchases → combined table (Date, Type, Description, Debit, Credit). Summary: **Penjualan total** and **Pembelian total** only (no profit/loss sum).

Data flow is: **UI event → React state / form → Supabase client (from lib) → Supabase (DB/Auth) → response → state update → UI (and toast).**

---

## 5. Decisions (confirmed)

| Topic | Decision |
|-------|----------|
| **Users** | Supabase Auth only; no custom `users` table. |
| **Sales transaction number** | Auto-generated (e.g. `INV-YYYYMMDD-001`). |
| **Profit/Loss** | Do not sum. Show **Penjualan** (sales total) and **Pembelian** (purchases total) separately on Dashboard and Reports. |
| **Report “Filter by Product”** | Yes — filter applies only to the sales table (sales lines); purchases are not filtered by product. |

---

Ready to proceed with **Step 1: Setup routing and layout**.
