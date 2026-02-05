import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [monthlySummaries, setMonthlySummaries] = useState([])

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

  return (
    <div>
      {monthlySummaries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada transaksi di tahun ini.</p>
      ) : (
        <div className="flex flex-wrap gap-4 items-start">
          {monthlySummaries.map((m) => (
            <div key={m.monthKey} className="w-[16rem]">
              <div className="rounded-xl border bg-card px-3 py-2 space-y-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <div className="text-sm text-foreground/90 space-y-1">
                    <p>
                      <span className="text-muted-foreground">Penjualan:</span>{' '}
                      Rp {(Number(m.salesTotal) || 0).toLocaleString('id-ID')}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Pengeluaran:</span>{' '}
                      Rp {(Number(m.purchasesTotal) || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Item terjual</p>
                  {m.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">-</p>
                  ) : (
                    <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1">
                      {m.products.map((row) => (
                        <li key={row.product_id}>
                          {row.name} ={' '}
                          {(Number(row.units) || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
