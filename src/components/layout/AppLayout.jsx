import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, FolderTree, CreditCard, Receipt, ClipboardList, FileText, LogOut, Database, BarChart3, EllipsisVertical, Moon, Sun } from 'lucide-react'
import { LayoutGroup, motion } from 'framer-motion'
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
              'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-normal transition-colors',
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
    ...visibleNav.filter((item) => item.to !== '/reports'),
    { to: '__more', label: 'Lainnya', icon: EllipsisVertical },
  ]

  const selectedIconAnimation = { scale: [1, 1.12, 1], y: [0, -0.5, 0] }
  const idleIconAnimation = { scale: 1, y: 0 }

  function isRouteActive(to) {
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-5 inset-x-0 z-40 px-4 safe-bottom">
        <Card className="pointer-events-auto mx-auto w-full max-w-lg rounded-[2rem] border border-border/70 bg-transparent px-2 py-2 ring-1 ring-foreground/10 backdrop-blur-xl backdrop-saturate-150 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
          <LayoutGroup id="mobile-bottom-nav">
            <div
              className="relative z-10 grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${allItems.length}, minmax(0, 1fr))` }}
            >
              {allItems.map((item) => {
                const isMore = item.to === '__more'
                const isActive = isMore ? menuOpen : isRouteActive(item.to)
                const Icon = item.icon

                const baseItemClass = cn(
                  'group relative isolate flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-[1.45rem] px-1.5 py-1 text-muted-foreground transition-all duration-150',
                  'hover:bg-muted/50 hover:text-foreground',
                  'active:translate-y-px active:brightness-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )

                const content = (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="mobile-bottom-active-chip"
                        transition={{ type: 'spring', stiffness: 450, damping: 34, mass: 0.85 }}
                        className="pointer-events-none absolute -inset-0.5 z-0 rounded-[1.45rem] border border-white/45 bg-background/35 ring-1 ring-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_rgba(0,0,0,0.14)] backdrop-blur-md"
                      />
                    )}
                    <motion.span
                      className="relative z-10 flex items-center justify-center"
                      animate={isActive ? selectedIconAnimation : idleIconAnimation}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-colors duration-150',
                          isActive ? 'text-foreground stroke-[2.5]' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                    </motion.span>
                    <span
                      className={cn(
                        'relative z-10 text-[8px] font-normal uppercase tracking-wide transition-colors duration-150',
                        isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )

                if (isMore) {
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => setMenuOpen(true)}
                      className={baseItemClass}
                    >
                      {content}
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={baseItemClass}
                  >
                    {content}
                  </Link>
                )
              })}
            </div>
          </LayoutGroup>
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
            <Link
              to="/reports"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-9 items-center justify-start whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-card-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Laporan
            </Link>
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
    <div className="flex min-h-screen h-dvh bg-background overflow-hidden">
      {/* Desktop: full-height sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-shrink-0 bg-sidebar text-sidebar-foreground shadow-[4px_0_15px_rgba(0,0,0,0.1)] p-3 flex-col min-h-0 z-10">
        <span className="text-sm font-semibold text-foreground mb-4">Dapurasri</span>
        <SidebarContent className="min-h-0 overflow-y-auto pr-1" />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background min-w-0 p-3 md:p-5 pb-36 md:pb-5">
          <Outlet />
        </main>
      </div>

      {/* Mobile: sticky bottom tab bar */}
      <MobileBottomNav />
    </div>
  )
}
