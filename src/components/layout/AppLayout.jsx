import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, FolderTree, CreditCard, Receipt, ClipboardList, FileText, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/master/products', label: 'Produk', icon: Package },
  { to: '/master/categories', label: 'Kategori Pembelian', icon: FolderTree },
  { to: '/master/payment-methods', label: 'Metode Pembayaran', icon: CreditCard },
  { to: '/transactions', label: 'Transaksi', icon: Receipt },
  { to: '/orders', label: 'Daftar Pesanan', icon: ClipboardList },
  { to: '/reports/sales', label: 'Laporan Penjualan', icon: FileText },
  { to: '/reports/expenses', label: 'Laporan Pengeluaran', icon: FileText },
]

function SidebarContent({ onNavigate, className }) {
  const location = useLocation()
  const { signOut } = useAuth()

  return (
    <div className={cn('flex flex-col gap-1.5 h-full', className)}>
      <div className="flex-1 flex flex-col gap-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
              location.pathname === to
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        onClick={() => signOut()}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Keluar
      </Button>
    </div>
  )
}

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile: overlay drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <aside className="md:hidden fixed top-0 left-0 z-40 w-56 h-full bg-sidebar text-sidebar-foreground shadow-lg p-3 flex flex-col transition-transform duration-200 ease-out">
            <Button
              variant="ghost"
              size="icon"
              className="self-end -mr-1 -mt-1"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
            <SidebarContent onNavigate={() => setMobileMenuOpen(false)} className="pt-2" />
          </aside>
        </>
      )}

      {/* Desktop: full-height sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-shrink-0 bg-sidebar text-sidebar-foreground shadow-[4px_0_15px_rgba(0,0,0,0.1)] p-3 flex-col z-10">
        <span className="text-sm font-semibold text-foreground mb-4">Dapurasri</span>
        <SidebarContent />
      </aside>

      {/* Right side: header (mobile) + main content */}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="md:hidden flex-shrink-0 h-10 bg-sidebar text-sidebar-foreground flex items-center gap-2 px-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">Dapurasri</span>
        </header>

        <main className="flex-1 p-3 md:p-5 overflow-auto bg-background min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
