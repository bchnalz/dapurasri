import { Link } from 'react-router-dom'
import { Package, FolderTree, CreditCard } from 'lucide-react'

const items = [
  { to: '/master/products', label: 'Produk', icon: Package },
  { to: '/master/categories', label: 'Kategori Pembelian', icon: FolderTree },
  { to: '/master/payment-methods', label: 'Metode Pembayaran', icon: CreditCard },
]

export default function Master() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Master Data</h2>
      <p className="text-sm text-muted-foreground">Pilih halaman:</p>
      <div className="flex flex-col gap-2">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium bg-card hover:bg-accent transition-colors"
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
