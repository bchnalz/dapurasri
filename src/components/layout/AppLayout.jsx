import { useRef, useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, FolderTree, CreditCard, Receipt, ClipboardList, FileText, LogOut, Database, BarChart3, EllipsisVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/master', label: 'Master', icon: Database },
  { to: '/master/products', label: 'Produk', icon: Package, hidden: true },
  { to: '/master/categories', label: 'Kategori Pembelian', icon: FolderTree, hidden: true },
  { to: '/master/payment-methods', label: 'Metode Pembayaran', icon: CreditCard, hidden: true },
  { to: '/transactions', label: 'Transaksi', icon: Receipt },
  { to: '/orders', label: 'Pesanan', icon: ClipboardList },
  { to: '/reports', label: 'Laporan', icon: BarChart3 },
  { to: '/reports/sales', label: 'Laporan Penjualan', icon: FileText, hidden: true },
  { to: '/reports/expenses', label: 'Laporan Pengeluaran', icon: FileText, hidden: true },
]

const visibleNav = nav.filter(item => !item.hidden)

function SidebarContent({ className }) {
  const location = useLocation()
  const { signOut } = useAuth()

  return (
    <div className={cn('flex flex-col gap-1.5 h-full', className)}>
      <div className="flex-1 flex flex-col gap-1">
        {visibleNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
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

function MobileBottomNav() {
  const location = useLocation()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [menuOpen])

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#BCD9A2] border-t border-[#a8c98e] safe-bottom">
      <div className="flex items-stretch justify-around">
        {visibleNav.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-[#1b3a12]'
                  : 'text-[#4a6340] active:text-[#1b3a12]'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              {label}
            </Link>
          )
        })}
        <div className="relative flex flex-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium text-[#4a6340] active:text-[#1b3a12] transition-colors"
          >
            <EllipsisVertical className="h-5 w-5" />
            Lainnya
          </button>
          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-2 mr-1 min-w-36 rounded-lg bg-card shadow-lg border border-border py-1">
              <button
                onClick={() => { setMenuOpen(false); signOut() }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export function AppLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop: full-height sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-shrink-0 bg-sidebar text-sidebar-foreground shadow-[4px_0_15px_rgba(0,0,0,0.1)] p-3 flex-col z-10">
        <span className="text-sm font-semibold text-foreground mb-4">Dapurasri</span>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 p-3 md:p-5 overflow-auto bg-background min-w-0 pb-20 md:pb-5">
          <Outlet />
        </main>
      </div>

      {/* Mobile: sticky bottom tab bar */}
      <MobileBottomNav />
    </div>
  )
}
