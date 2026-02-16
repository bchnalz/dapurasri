import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

const reportCards = [
  {
    to: '/reports/sales',
    title: 'Laporan Penjualan',
    description: 'Lihat ringkasan transaksi penjualan berdasarkan periode, produk, dan metode pembayaran.',
    icon: TrendingUp,
    accent: 'green',
  },
  {
    to: '/reports/expenses',
    title: 'Laporan Pengeluaran',
    description: 'Pantau seluruh pengeluaran usaha berdasarkan periode dan metode pembayaran.',
    icon: TrendingDown,
    accent: 'red',
  },
]

const accentStyles = {
  green: {
    iconBg: 'bg-green-100 text-green-700',
    hover: 'hover:border-green-200 hover:shadow-green-100/60',
  },
  red: {
    iconBg: 'bg-red-100 text-red-700',
    hover: 'hover:border-red-200 hover:shadow-red-100/60',
  },
}

export default function Reports() {
  return (
    <div className="animate-section-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Laporan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pilih jenis laporan untuk melihat data keuangan usaha Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        {reportCards.map((card, i) => {
          const style = accentStyles[card.accent]
          return (
            <Link
              key={card.to}
              to={card.to}
              className={`animate-card-in group relative flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-5 shadow-sm transition-all duration-300 ${style.hover} hover:shadow-md active:scale-[0.98]`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <card.icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold tracking-tight">{card.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              <div className="flex items-center gap-1 text-xs font-medium text-primary mt-auto pt-1">
                Lihat laporan
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
