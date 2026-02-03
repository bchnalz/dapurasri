import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { id } from 'date-fns/locale'
import { ShoppingCart, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [salesTotal, setSalesTotal] = useState(0)
  const [purchasesTotal, setPurchasesTotal] = useState(0)
  const [salesPrev, setSalesPrev] = useState(0)
  const [purchasesPrev, setPurchasesPrev] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  function toLocalDateString(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  async function loadStats() {
    setLoading(true)
    const now = new Date()
    const start = toLocalDateString(startOfMonth(now))
    const end = toLocalDateString(endOfMonth(now))
    const prevMonth = subMonths(now, 1)
    const startPrev = toLocalDateString(startOfMonth(prevMonth))
    const endPrev = toLocalDateString(endOfMonth(prevMonth))

    const [salesHeadersRes, purchasesRes, salesHeadersPrevRes, purchasesPrevRes] = await Promise.all([
      supabase
        .from('sales_transactions')
        .select('id')
        .gte('transaction_date', start)
        .lte('transaction_date', end),
      supabase
        .from('purchase_transactions')
        .select('amount')
        .gte('transaction_date', start)
        .lte('transaction_date', end),
      supabase
        .from('sales_transactions')
        .select('id')
        .gte('transaction_date', startPrev)
        .lte('transaction_date', endPrev),
      supabase
        .from('purchase_transactions')
        .select('amount')
        .gte('transaction_date', startPrev)
        .lte('transaction_date', endPrev),
    ])

    let salesSum = 0
    if (!salesHeadersRes.error && salesHeadersRes.data?.length) {
      const ids = salesHeadersRes.data.map((r) => r.id).filter(Boolean)
      if (ids.length) {
        const { data: details } = await supabase
          .from('sales_details')
          .select('subtotal')
          .in('sales_transaction_id', ids)
        salesSum = (details ?? []).reduce((sum, r) => sum + Number(r.subtotal ?? 0), 0)
      }
    }
    setSalesTotal(salesSum)

    if (purchasesRes.error) setPurchasesTotal(0)
    else setPurchasesTotal((purchasesRes.data ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0))

    let salesPrevSum = 0
    if (!salesHeadersPrevRes.error && salesHeadersPrevRes.data?.length) {
      const idsPrev = salesHeadersPrevRes.data.map((r) => r.id).filter(Boolean)
      if (idsPrev.length) {
        const { data: detailsPrev } = await supabase
          .from('sales_details')
          .select('subtotal')
          .in('sales_transaction_id', idsPrev)
        salesPrevSum = (detailsPrev ?? []).reduce((sum, r) => sum + Number(r.subtotal ?? 0), 0)
      }
    }
    setSalesPrev(salesPrevSum)

    if (purchasesPrevRes.error) setPurchasesPrev(0)
    else setPurchasesPrev((purchasesPrevRes.data ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0))

    setLoading(false)
  }

  const monthLabel = format(new Date(), 'MMMM yyyy', { locale: id })
  const prevMonthLabel = format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: id })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-muted-foreground mb-4">{monthLabel}</p>
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div
            className={cn(
              'rounded-xl border-2 border-primary/20 bg-card p-6 shadow-md shadow-primary/5',
              'flex items-center gap-4'
            )}
          >
            <div className="rounded-xl bg-primary/15 p-3">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Penjualan bulan ini</p>
              <p className="text-2xl font-semibold text-foreground">
                Rp {(Number(salesTotal) || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'rounded-xl border-2 border-secondary-foreground/20 bg-card p-6 shadow-md',
              'flex items-center gap-4'
            )}
          >
            <div className="rounded-xl bg-secondary p-3">
              <ShoppingBag className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pembelian bulan ini</p>
              <p className="text-2xl font-semibold text-foreground">
                Rp {(Number(purchasesTotal) || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="text-muted-foreground mb-4">{prevMonthLabel}</p>
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div
            className={cn(
              'rounded-xl border border-border bg-card p-6 shadow-sm',
              'flex items-center gap-4'
            )}
          >
            <div className="rounded-xl bg-muted p-3">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Penjualan {prevMonthLabel}</p>
              <p className="text-2xl font-semibold text-foreground">
                Rp {(Number(salesPrev) || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'rounded-xl border border-border bg-card p-6 shadow-sm',
              'flex items-center gap-4'
            )}
          >
            <div className="rounded-xl bg-muted p-3">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pembelian {prevMonthLabel}</p>
              <p className="text-2xl font-semibold text-foreground">
                Rp {(Number(purchasesPrev) || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
