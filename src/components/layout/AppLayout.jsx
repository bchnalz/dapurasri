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

  const allItems = [
    ...visibleNav,
    { to: '__more', label: 'Lainnya', icon: EllipsisVertical },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-4 safe-bottom">
      <div className="bg-white rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.12)] px-2 py-3">
        <div className="grid grid-cols-6">
          {allItems.map((item) => {
            const isMore = item.to === '__more'
            const isActive = !isMore && location.pathname === item.to
            const Icon = item.icon

            if (isMore) {
              return (
                <div key={item.to} className="relative flex flex-col items-center" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(prev => !prev)}
                    className="flex flex-col items-center gap-1"
                  >
                    <Icon className={cn('h-5 w-5 text-[#4a6340]', menuOpen && 'stroke-[2.5]')} />
                    <span className="text-[10px] font-medium text-[#4a6340]">{item.label}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 min-w-36 rounded-xl bg-white shadow-lg border border-gray-100 py-1">
                      <button
                        onClick={() => { setMenuOpen(false); signOut() }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-gray-50 transition-colors rounded-xl"
                      >
                        <LogOut className="h-4 w-4" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-1"
              >
                <Icon className={cn(
                  'h-5 w-5 transition-all',
                  isActive ? 'text-[#3d6b2e] stroke-[2.5]' : 'text-[#4a6340]'
                )} />
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'text-[#3d6b2e] font-semibold' : 'text-[#4a6340]'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export function AppLayout() {
  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop: full-height sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-shrink-0 bg-sidebar text-sidebar-foreground shadow-[4px_0_15px_rgba(0,0,0,0.1)] p-3 flex-col z-10">
        <span className="text-sm font-semibold text-foreground mb-4">Dapurasri</span>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <main className="flex-1 p-3 md:p-5 overflow-auto bg-background min-w-0 pb-28 md:pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile: sticky bottom tab bar */}
      <MobileBottomNav />
    </div>
  )
}
