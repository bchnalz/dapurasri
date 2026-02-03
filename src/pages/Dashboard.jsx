import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'
import { ShoppingCart, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [salesTotal, setSalesTotal] = useState(0)
  const [purchasesTotal, setPurchasesTotal] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    const now = new Date()
    const start = startOfMonth(now).toISOString().split('T')[0]
    const end = endOfMonth(now).toISOString().split('T')[0]

    const [salesRes, purchasesRes] = await Promise.all([
      supabase
        .from('sales_transactions')
        .select('total')
        .gte('transaction_date', start)
        .lte('transaction_date', end),
      supabase
        .from('purchase_transactions')
        .select('amount')
        .gte('transaction_date', start)
        .lte('transaction_date', end),
    ])

    if (salesRes.error) setSalesTotal(0)
    else setSalesTotal((salesRes.data ?? []).reduce((sum, r) => sum + Number(r.total), 0))

    if (purchasesRes.error) setPurchasesTotal(0)
    else setPurchasesTotal((purchasesRes.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0))

    setLoading(false)
  }

  const monthLabel = format(new Date(), 'MMMM yyyy', { locale: id })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <p className="text-muted-foreground mb-6">{monthLabel}</p>

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
              Rp {Number(salesTotal).toLocaleString('id-ID')}
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
              Rp {Number(purchasesTotal).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
