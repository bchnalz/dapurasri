# Panduan Setup Aplikasi Kasir & Pencatatan Udang

## 📋 Daftar Isi
1. [Persiapan Environment](#persiapan-environment)
2. [Setup Project](#setup-project)
3. [Setup Supabase](#setup-supabase)
4. [Prompt untuk Cursor AI](#prompt-untuk-cursor-ai)
5. [Struktur Database](#struktur-database)
6. [Checklist Development](#checklist-development)

---

## 🛠️ Persiapan Environment

### Prerequisites yang Dibutuhkan:
- Node.js (v18 atau lebih baru)
- npm atau yarn
- Git
- Akun Supabase (gratis di https://supabase.com)
- Cursor IDE

---

## 🚀 Setup Project

### Step 1: Inisialisasi Project React + Vite

```bash
# Buat project baru dengan Vite
npm create vite@latest dapurasri -- --template react

# Masuk ke folder project
cd dapurasri

# Install dependencies dasar
npm install
```

### Step 2: Install Dependencies Tambahan

```bash
# Install React Router untuk navigasi
npm install react-router-dom

# Install Supabase client
npm install @supabase/supabase-js

# Install date handling
npm install date-fns

# Install form handling
npm install react-hook-form

# Install state management (optional)
npm install zustand

# Install icons
npm install lucide-react
```

### Step 3: Setup Shadcn/ui

```bash
# Install shadcn/ui
npx shadcn-ui@latest init

# Pilih opsi berikut saat diminta:
# - Style: Default
# - Base color: Slate (atau sesuai preferensi)
# - CSS variables: Yes

# Install komponen yang diperlukan
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add form
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
```

### Step 4: Setup Supabase Configuration

Buat file `.env.local` di root project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Buat file `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 🗄️ Setup Supabase

### Step 1: Buat Project di Supabase
1. Buka https://supabase.com
2. Klik "New Project"
3. Isi nama project, database password, dan pilih region terdekat
4. Tunggu setup selesai (±2 menit)

### Step 2: Dapatkan Credentials
1. Buka Project Settings → API
2. Copy "Project URL" → masukkan ke `.env.local` sebagai `VITE_SUPABASE_URL`
3. Copy "anon public" key → masukkan ke `.env.local` sebagai `VITE_SUPABASE_ANON_KEY`

### Step 3: Buat Database Schema

Buka SQL Editor di Supabase dan jalankan script berikut:

```sql
-- Tabel untuk User/Admin
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabel Master Produk
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'kg',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabel Master Kategori Pembelian
CREATE TABLE purchase_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabel Transaksi Penjualan (Header)
CREATE TABLE sales_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT UNIQUE NOT NULL,
  transaction_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabel Detail Penjualan
CREATE TABLE sales_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabel Transaksi Pembelian
CREATE TABLE purchase_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date DATE NOT NULL,
  category_id UUID REFERENCES purchase_categories(id),
  category_name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index untuk performa
CREATE INDEX idx_sales_date ON sales_transactions(transaction_date);
CREATE INDEX idx_purchase_date ON purchase_transactions(transaction_date);
CREATE INDEX idx_sales_details_transaction ON sales_details(sales_transaction_id);

-- Function untuk auto-generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  current_date TEXT;
BEGIN
  current_date := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT 'TRX-' || current_date || '-' || LPAD((COUNT(*) + 1)::TEXT, 4, '0')
  INTO new_number
  FROM sales_transactions
  WHERE transaction_number LIKE 'TRX-' || current_date || '%';
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

### Step 4: Enable Row Level Security (RLS) - Optional untuk development awal

```sql
-- Untuk sementara, disable RLS untuk development
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_transactions DISABLE ROW LEVEL SECURITY;

-- Nanti setelah aplikasi jadi, bisa diaktifkan dengan policy yang sesuai
```

### Step 5: Insert Sample Data (Optional)

```sql
-- Sample Products
INSERT INTO products (name, price, unit) VALUES
('Udang Windu', 85000, 'kg'),
('Udang Vaname', 65000, 'kg'),
('Udang Galah', 120000, 'kg');

-- Sample Purchase Categories
INSERT INTO purchase_categories (name) VALUES
('Pakan Udang'),
('Peralatan'),
('Operasional'),
('Lain-lain');
```

---

## 🤖 Prompt untuk Cursor AI

### Prompt Konfirmasi Awal (Copy paste ini ke Cursor)

```
Saya ingin membangun aplikasi kasir dan pencatatan udang dengan spesifikasi berikut.

TECHNOLOGY STACK:
- React dengan Vite
- Shadcn/ui untuk UI components
- Supabase sebagai database
- React Router untuk navigasi
- React Hook Form untuk form handling
- Date-fns untuk date manipulation
- Lucide React untuk icons

STRUKTUR DATABASE SUPABASE:
- Table: users (untuk admin)
- Table: products (master produk dan harga)
- Table: purchase_categories (kategori pembelian)
- Table: sales_transactions (header transaksi penjualan)
- Table: sales_details (detail item penjualan)
- Table: purchase_transactions (transaksi pembelian)

FITUR APLIKASI:

1. AUTHENTICATION & AUTHORIZATION
   - Login sebagai admin
   - Session management

2. HALAMAN MASTER DATA
   - CRUD produk (nama, harga, satuan)
   - CRUD kategori pembelian
   - Table dengan pagination, search, dan sort

3. HALAMAN DASHBOARD (Halaman Utama)
   - Tampilan perhitungan penjualan per bulan (current month)
   - Card statistics: Total Penjualan Bulan Ini, Total Pembelian Bulan Ini, Laba/Rugi
   - Chart/Graph sederhana (optional)

4. HALAMAN ENTRY TRANSAKSI
   Layout: 2 kolom side-by-side
   
   Kolom 1 - Tabel Penjualan:
   - Menampilkan semua transaksi penjualan, default 10 terbaru
   - Pagination
   - Kolom: Tanggal, No. Transaksi, Total, Aksi (Edit, Hapus)
   
   Kolom 2 - Tabel Pembelian:
   - Menampilkan semua transaksi pembelian, default 10 terbaru
   - Pagination
   - Kolom: Tanggal, Kategori, Deskripsi, Nominal, Aksi (Edit, Hapus)
   
   Tombol di atas tabel:
   - Tombol "Entry Penjualan Baru"
   - Tombol "Entry Pembelian Baru"
   
   DIALOG ENTRY PENJUALAN:
   - DatePicker untuk tanggal transaksi (bisa backdate)
   - Daftar produk dari master (bisa pilih produk, input quantity)
   - Tombol "+" untuk tambah item produk
   - Tombol "-" untuk hapus item
   - Total harga yang auto-calculate realtime
   - Tombol "Generate Invoice"
   - Saat klik "Generate Invoice" → tampilkan Dialog Preview Invoice (tabel summary)
   - Dialog Preview Invoice punya tombol "Confirm" untuk simpan ke database
   
   DIALOG ENTRY PEMBELIAN:
   - DatePicker untuk tanggal transaksi (bisa backdate)
   - Dropdown kategori pembelian (dari master)
   - Input deskripsi pembelian
   - Input nominal/harga
   - Tombol "+" untuk tambah item pembelian baru
   - Tombol "Save" untuk simpan semua items sekaligus

5. HALAMAN LAPORAN KEUANGAN
   Filter Section:
   - Filter by Produk (dropdown)
   - Filter by Tanggal/Bulan (date range picker)
   - Tombol "Apply Filter"
   
   Tabel Transaksi:
   - Gabungan view penjualan dan pembelian
   - Kolom: Tanggal, Jenis (Penjualan/Pembelian), Keterangan, Debit, Kredit
   
   Summary Section:
   - Total Penjualan dalam periode
   - Total Pembelian dalam periode
   - Laba/Rugi
   - Tombol "Generate Laporan PDF" (optional di fase 1)

ROUTING STRUCTURE:
/login
/dashboard
/master/products
/master/categories
/transactions
/reports

UI/UX REQUIREMENTS:
- Responsive design (mobile-friendly)
- Modern dan clean interface
- Loading states pada setiap action
- Toast notification untuk sukses/error
- Confirmation dialog sebelum delete
- Form validation

SEBELUM MULAI CODING:
1. Konfirmasi apakah Anda memahami semua requirement di atas
2. Buatkan struktur folder yang akan digunakan
3. List semua file yang akan dibuat
4. Explain bagaimana flow data dari UI ke Supabase
5. Tanyakan jika ada yang kurang jelas atau perlu klarifikasi

Setelah konfirmasi, kita akan mulai development step-by-step, dimulai dari:
1. Setup routing dan layout
2. Authentication
3. Master data pages
4. Dashboard
5. Transaction pages
6. Reports page

Apakah Anda siap? Mohon konfirmasi pemahaman Anda terlebih dahulu.
```

---

## 📁 Struktur Folder yang Direkomendasikan

```
aplikasi-kasir-udang/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn components
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.jsx
│   │   │   └── SalesChart.jsx
│   │   ├── transactions/
│   │   │   ├── SalesTable.jsx
│   │   │   ├── PurchaseTable.jsx
│   │   │   ├── SalesDialog.jsx
│   │   │   ├── PurchaseDialog.jsx
│   │   │   └── InvoicePreview.jsx
│   │   ├── master/
│   │   │   ├── ProductTable.jsx
│   │   │   └── CategoryTable.jsx
│   │   └── reports/
│   │       ├── FilterSection.jsx
│   │       └── ReportTable.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Transactions.jsx
│   │   ├── Reports.jsx
│   │   └── master/
│   │       ├── Products.jsx
│   │       └── Categories.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   └── utils.js
│   ├── hooks/
│   │   ├── useProducts.js
│   │   ├── useSales.js
│   │   ├── usePurchases.js
│   │   └── useAuth.js
│   ├── store/             # Zustand store (optional)
│   │   └── authStore.js
│   ├── App.jsx
│   └── main.jsx
├── .env.local
├── package.json
└── vite.config.js
```

---

## ✅ Checklist Development

### Phase 1: Setup & Authentication
- [ ] Install semua dependencies
- [ ] Setup Supabase config
- [ ] Buat database schema
- [ ] Setup routing
- [ ] Implementasi login/logout
- [ ] Protected routes

### Phase 2: Master Data
- [ ] CRUD Products
- [ ] CRUD Purchase Categories
- [ ] Table dengan pagination & search

### Phase 3: Dashboard
- [ ] Stats cards (penjualan, pembelian, laba/rugi)
- [ ] Monthly calculation
- [ ] Chart penjualan (optional)

### Phase 4: Transaksi
- [ ] Sales table dengan pagination
- [ ] Purchase table dengan pagination
- [ ] Sales dialog dengan item selection
- [ ] Purchase dialog dengan multi-item
- [ ] Invoice preview
- [ ] Edit & Delete functionality
- [ ] Backdate feature

### Phase 5: Laporan
- [ ] Filter by product
- [ ] Filter by date/month
- [ ] Combined transaction table
- [ ] Summary calculations
- [ ] Export PDF (optional)

### Phase 6: Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Responsive design
- [ ] Form validation

---

## 🎯 Tips Menggunakan Cursor AI

1. **Mulai dari yang kecil**: Jangan minta semua fitur sekaligus, develop per halaman
2. **Iterasi**: Setelah satu fitur jadi, test dulu, baru lanjut ke fitur berikutnya
3. **Spesifik**: Berikan contoh konkret bagaimana UI/UX yang diinginkan
4. **Review kode**: Selalu review kode yang di-generate, pastikan sesuai best practices
5. **Dokumentasi**: Minta Cursor untuk comment kode yang kompleks

---

## 🚀 Cara Menjalankan Aplikasi

```bash
# Development mode
npm run dev

# Build untuk production
npm run build

# Preview production build
npm run preview
```

---

## 📞 Bantuan & Resources

- Supabase Docs: https://supabase.com/docs
- Shadcn/ui Docs: https://ui.shadcn.com
- React Router: https://reactrouter.com
- Vite: https://vitejs.dev

---

**Catatan**: Dokumen ini adalah panduan awal. Sesuaikan dengan kebutuhan spesifik Anda saat development berlangsung.

Selamat coding! 🎉
