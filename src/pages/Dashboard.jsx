import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [monthlySummaries, setMonthlySummaries] = useState([])
  const [expandedMonth, setExpandedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const syncTheme = () => setIsDarkTheme(root.classList.contains('dark'))
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  function toLocalDateString(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  async function loadStats() {
    setLoading(true)

    // Only show months in 2026 (Jan–Dec)
    const year = 2026
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
    const rangeStartDate = new Date(year, 0, 1)
    const rangeEndDate = new Date(year, 11, 31)

    const rangeStart = toLocalDateString(rangeStartDate)
    const rangeEnd = toLocalDateString(rangeEndDate)

    const [salesHeadersRes, purchasesRes] = await Promise.all([
      supabase
        .from('sales_transactions')
        .select('id, transaction_date')
        .gte('transaction_date', rangeStart)
        .lte('transaction_date', rangeEnd),
      supabase
        .from('purchase_transactions')
        .select('amount, transaction_date')
        .gte('transaction_date', rangeStart)
        .lte('transaction_date', rangeEnd),
    ])

    const salesHeaders = salesHeadersRes.error ? [] : salesHeadersRes.data ?? []
    const purchases = purchasesRes.error ? [] : purchasesRes.data ?? []

    const salesIds = salesHeaders.map((r) => r.id).filter(Boolean)
    const idToMonthKey = new Map()
    for (const row of salesHeaders) {
      if (!row?.id || !row?.transaction_date) continue
      // transaction_date is DATE (YYYY-MM-DD) -> month key YYYY-MM
      idToMonthKey.set(row.id, String(row.transaction_date).slice(0, 7))
    }

    const monthToSalesTotal = new Map()
    const monthToProducts = new Map() // monthKey -> Map(product_id -> { product_id, name, units })

    if (salesIds.length) {
      const { data: details, error: detailsError } = await supabase
        .from('sales_details')
        .select('sales_transaction_id, subtotal, quantity, product_id, products(name)')
        .in('sales_transaction_id', salesIds)

      if (!detailsError) {
        for (const row of details ?? []) {
          const monthKey = idToMonthKey.get(row.sales_transaction_id)
          if (!monthKey) continue

          // Sales total (Rp)
          monthToSalesTotal.set(
            monthKey,
            (monthToSalesTotal.get(monthKey) ?? 0) + Number(row.subtotal ?? 0)
          )

          // Per-product units sold
          const pid = row.product_id
          if (!pid) continue
          const productsMap = monthToProducts.get(monthKey) ?? new Map()
          const prev = productsMap.get(pid) ?? { product_id: pid, name: '-', units: 0 }
          const name = row.products?.name ?? prev.name ?? '-'
          productsMap.set(pid, { product_id: pid, name, units: prev.units + Number(row.quantity ?? 0) })
          monthToProducts.set(monthKey, productsMap)
        }
      }
    }

    const monthToPurchasesTotal = new Map()
    for (const row of purchases) {
      if (!row?.transaction_date) continue
      const monthKey = String(row.transaction_date).slice(0, 7)
      monthToPurchasesTotal.set(
        monthKey,
        (monthToPurchasesTotal.get(monthKey) ?? 0) + Number(row.amount ?? 0)
      )
    }

    const summaries = months
      .map((m) => {
        const monthKey = format(m, 'yyyy-MM')
        const label = format(m, 'MMMM yyyy', { locale: id })
        const productMap = monthToProducts.get(monthKey) ?? new Map()
        const products = Array.from(productMap.values()).sort((a, b) => Number(b.units) - Number(a.units))

        return {
          monthKey,
          label,
          salesTotal: monthToSalesTotal.get(monthKey) ?? 0,
          purchasesTotal: monthToPurchasesTotal.get(monthKey) ?? 0,
          products,
        }
      })
      .filter((m) => m.salesTotal > 0 || m.purchasesTotal > 0)

    const currentMonthKey = format(new Date(), 'yyyy-MM')
    summaries.sort((a, b) => {
      if (a.monthKey === currentMonthKey) return -1
      if (b.monthKey === currentMonthKey) return 1
      return 0
    })

    setMonthlySummaries(summaries)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  const currentMonthKeyRender = format(new Date(), 'yyyy-MM')
  const fmtRp = (v) => `Rp ${(Number(v) || 0).toLocaleString('id-ID')}`

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center pt-6 pb-8">
        <img
          src={isDarkTheme ? '/logo-dapurasri-dark.png' : '/logo-dapurasri.png'}
          alt="Dapurasri"
          className="h-20 mb-3 drop-shadow-sm"
        />
        <p className="text-xs tracking-widest uppercase text-muted-foreground">Ringkasan Bulanan</p>
      </div>

      {monthlySummaries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          Belum ada transaksi di tahun ini.
        </p>
      ) : (
        <div className="flex flex-col gap-3 px-1">
          {monthlySummaries.map((m) => {
            const isExpanded = expandedMonth === m.monthKey
            const isCurrentMonth = m.monthKey === currentMonthKeyRender
            const profit = (Number(m.salesTotal) || 0) - (Number(m.purchasesTotal) || 0)

            return (
              <Card
                key={m.monthKey}
                className={cn(
                  'transition-all duration-300 ease-out cursor-pointer',
                  isCurrentMonth
                    ? 'border-primary/35 bg-primary/10 shadow-lg dark:border-primary/45 dark:bg-primary/12'
                    : 'border-border/70 bg-card hover:shadow-md',
                  isExpanded && 'shadow-lg'
                )}
                onClick={() => setExpandedMonth(isExpanded ? null : m.monthKey)}
              >
                {/* Card head */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold capitalize tracking-tight text-foreground">
                        {m.label}
                      </h3>
                      {isCurrentMonth && (
                        <span className="inline-block mt-0.5 text-[10px] font-medium tracking-wide uppercase text-primary bg-primary/10 rounded-full px-2 py-0.5">
                          Bulan ini
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform duration-300',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Penjualan
                      </p>
                      <p className="text-sm font-semibold text-foreground">{fmtRp(m.salesTotal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" /> Pengeluaran
                      </p>
                      <p className="text-sm font-semibold text-foreground">{fmtRp(m.purchasesTotal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                        Laba
                      </p>
                      <p className={cn(
                        'text-sm font-semibold',
                        profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {fmtRp(profit)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collapsible detail */}
                <div className="collapsible-content" data-open={isExpanded}>
                  <div>
                    <div className="px-4 pb-3 pt-2 border-t border-border/50">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        Item Terjual
                      </p>
                      {m.products.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Tidak ada data</p>
                      ) : (
                        <div className="space-y-1.5">
                          {m.products.map((row) => (
                            <div key={row.product_id} className="flex items-center justify-between text-sm">
                              <span className="text-foreground/90 truncate mr-2">{row.name}</span>
                              <span className="font-medium text-foreground tabular-nums shrink-0">
                                {(Number(row.units) || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
