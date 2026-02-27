import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, FolderTree, CreditCard, Receipt, ClipboardList, FileText, LogOut, Database, BarChart3, EllipsisVertical, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  function toggleTheme() {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    document.documentElement.classList.toggle('dark', nextIsDark)
    localStorage.setItem('theme', nextIsDark ? 'dark' : 'light')
    setMenuOpen(false)
  }

  const allItems = [
    ...visibleNav,
    { to: '__more', label: 'Lainnya', icon: EllipsisVertical },
  ]

  return (
    <>
      <nav className="md:hidden fixed bottom-4 inset-x-0 z-40 px-4 safe-bottom">
        <Card className="px-2 py-3 rounded-2xl bg-card/80 backdrop-blur-2xl backdrop-saturate-150 border-border/80 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          <div className="grid grid-cols-6">
            {allItems.map((item) => {
              const isMore = item.to === '__more'
              const isActive = !isMore && location.pathname === item.to
              const Icon = item.icon

              if (isMore) {
                return (
                  <div key={item.to} className="flex flex-col items-center">
                    <button
                      onClick={() => setMenuOpen(true)}
                      className="flex flex-col items-center gap-1"
                    >
                      <Icon className={cn('h-5 w-5 text-muted-foreground', menuOpen && 'stroke-[2.5]')} />
                      <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                    </button>
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
                    isActive ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'
                  )} />
                  <span className={cn(
                    'text-[10px] font-medium',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </Card>
      </nav>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          className="md:hidden top-auto bottom-0 left-0 right-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>More actions</DialogTitle>
          </DialogHeader>
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="justify-start text-card-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {isDark ? 'Tema terang' : 'Tema gelap'}
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => { setMenuOpen(false); signOut() }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
        <main className="flex-1 p-3 md:p-5 overflow-auto bg-background min-w-0 pb-36 md:pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile: sticky bottom tab bar */}
      <MobileBottomNav />
    </div>
  )
}
