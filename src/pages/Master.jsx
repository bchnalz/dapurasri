import { Link } from 'react-router-dom'
import { Package, FolderTree, CreditCard, ArrowRight } from 'lucide-react'

const masterCards = [
  {
    to: '/master/products',
    title: 'Produk',
    description: 'Kelola daftar produk beserta harga dan satuan.',
    icon: Package,
    accent: 'teal',
  },
  {
    to: '/master/categories',
    title: 'Kategori Pembelian',
    description: 'Atur kategori untuk mengelompokkan transaksi pembelian.',
    icon: FolderTree,
    accent: 'amber',
  },
  {
    to: '/master/payment-methods',
    title: 'Metode Pembayaran',
    description: 'Tambah dan kelola metode pembayaran yang tersedia.',
    icon: CreditCard,
    accent: 'violet',
  },
]

const accentStyles = {
  teal: {
    iconBg: 'bg-teal-100 text-teal-700',
    hover: 'hover:border-teal-200 hover:shadow-teal-100/60',
  },
  amber: {
    iconBg: 'bg-amber-100 text-amber-700',
    hover: 'hover:border-amber-200 hover:shadow-amber-100/60',
  },
  violet: {
    iconBg: 'bg-violet-100 text-violet-700',
    hover: 'hover:border-violet-200 hover:shadow-violet-100/60',
  },
}

export default function Master() {
  return (
    <div className="animate-section-in flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold tracking-tight">Master Data</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola data dasar yang digunakan di seluruh aplikasi.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl w-full">
        {masterCards.map((card, i) => {
          const style = accentStyles[card.accent]
          return (
            <Link
              key={card.to}
              to={card.to}
              className={`animate-card-in group relative flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-5 shadow-sm transition-all duration-300 ${style.hover} hover:shadow-md active:scale-[0.98]`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <card.icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold tracking-tight">
                  {card.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
              <div className="flex items-center gap-1 text-xs font-medium text-primary mt-auto pt-1">
                Kelola data
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
