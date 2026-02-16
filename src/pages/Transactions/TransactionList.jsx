import { useState, useEffect, useMemo, useRef } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'
import { Eye, ChevronLeft, ChevronRight, ChevronRight as Arrow, Plus, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

function useAnimatedNumber(target, duration = 500) {
  const [display, setDisplay] = useState(target)
  const rafRef = useRef(null)
  const startRef = useRef({ value: target, time: 0 })

  useEffect(() => {
    const from = display
    if (from === target) return
    startRef.current = { value: from, time: performance.now() }

    function tick(now) {
      const elapsed = now - startRef.current.time
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startRef.current.value + (target - startRef.current.value) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return display
}

export function TransactionList({
  refreshKey,
  onViewSalesDetail,
  onViewPurchaseDetail,
  onAddSales,
  onAddPurchase,
  onCustomInvoice,
}) {
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [availableMonths, setAvailableMonths] = useState([])
  const [month, setMonth] = useState(null)

  useEffect(() => {
    supabase.from('purchase_categories').select('id, name').then(({ data }) => {
      const map = {}
      ;(data ?? []).forEach((c) => { map[c.id] = c.name })
      setCategories(map)
    })
  }, [])

  // Load available months on mount and refresh
  useEffect(() => {
    loadAvailableMonths()
  }, [refreshKey])

  async function loadAvailableMonths() {
    const [salesRes, purchasesRes] = await Promise.all([
      supabase.from('sales_transactions').select('transaction_date'),
      supabase.from('purchase_transactions').select('transaction_date'),
    ])
    const dates = [
      ...(salesRes.data ?? []).map((r) => r.transaction_date),
      ...(purchasesRes.data ?? []).map((r) => r.transaction_date),
    ]
    const monthSet = new Set(dates.map((d) => format(startOfMonth(new Date(d)), 'yyyy-MM-dd')))
    const sorted = [...monthSet].sort()
    const months = sorted.map((d) => startOfMonth(new Date(d)))
    setAvailableMonths(months)
    setMonth((prev) => {
      if (prev && months.some((m) => m.getTime() === prev.getTime())) return prev
      return months.length > 0 ? months[months.length - 1] : null
    })
  }

  // Load data for selected month
  useEffect(() => {
    if (month) loadMonthData()
  }, [month])

  async function loadMonthData() {
    setLoading(true)
    const from = format(startOfMonth(month), 'yyyy-MM-dd')
    const to = format(endOfMonth(month), 'yyyy-MM-dd')

    const [salesRes, purchasesRes] = await Promise.all([
      supabase
        .from('sales_transactions')
        .select('*')
        .gte('transaction_date', from)
        .lte('transaction_date', to)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_transactions')
        .select('*')
        .gte('transaction_date', from)
        .lte('transaction_date', to)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ])
    if (salesRes.error) toast.error(salesRes.error.message)
    if (purchasesRes.error) toast.error(purchasesRes.error.message)
    setSales(salesRes.data ?? [])
    setPurchases(purchasesRes.data ?? [])
    setLoading(false)
  }

  const monthIndex = month ? availableMonths.findIndex((m) => m.getTime() === month.getTime()) : -1
  const hasPrev = monthIndex > 0
  const hasNext = monthIndex >= 0 && monthIndex < availableMonths.length - 1

  function goPrev() {
    if (hasPrev) setMonth(availableMonths[monthIndex - 1])
  }
  function goNext() {
    if (hasNext) setMonth(availableMonths[monthIndex + 1])
  }

  const merged = useMemo(() => {
    const tagged = [
      ...sales.map((r) => ({ ...r, _type: 'sales', _amount: Number(r.total) })),
      ...purchases.map((r) => ({ ...r, _type: 'purchase', _amount: Number(r.amount) })),
    ]
    tagged.sort((a, b) => {
      const dateCmp = new Date(b.transaction_date) - new Date(a.transaction_date)
      if (dateCmp !== 0) return dateCmp
      return new Date(b.created_at) - new Date(a.created_at)
    })
    return tagged
  }, [sales, purchases])

  const totalSales = useMemo(() => sales.reduce((sum, r) => sum + Number(r.total), 0), [sales])
  const totalPurchases = useMemo(() => purchases.reduce((sum, r) => sum + Number(r.amount), 0), [purchases])

  const animatedSales = useAnimatedNumber(totalSales)
  const animatedPurchases = useAnimatedNumber(totalPurchases)

  function handleDetail(row) {
    if (row._type === 'sales') onViewSalesDetail?.(row)
    else onViewPurchaseDetail?.(row)
  }

  function description(row) {
    return row._type === 'sales' ? row.transaction_no : row.description
  }

  function category(row) {
    return row._type === 'purchase' ? (categories[row.category_id] ?? '-') : '—'
  }

  const isSales = (row) => row._type === 'sales'

  return (
    <>
      {/* Sticky header */}
      <div className="sticky -top-3 md:-top-5 z-10 pb-3 -mx-3 md:-mx-5 px-3 md:px-5 -mt-3 md:-mt-5 pt-3 md:pt-5 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <h2 className="text-base font-semibold text-center mb-1">Transaksi</h2>

        {/* Desktop action buttons */}
        <div className="hidden lg:flex items-center justify-center gap-1.5 mb-2">
          <Button size="sm" onClick={onAddSales} className="h-7 gap-1 bg-green-600 hover:bg-green-700 text-white text-xs">
            <Plus className="h-3 w-3" />
            Pemasukan
          </Button>
          <Button size="sm" onClick={onAddPurchase} className="h-7 gap-1 bg-red-600 hover:bg-red-700 text-white text-xs">
            <Plus className="h-3 w-3" />
            Pengeluaran
          </Button>
          <Button size="sm" onClick={onCustomInvoice} className="h-7 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs">
            <Copy className="h-3 w-3" />
            Custom
          </Button>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev} disabled={!hasPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium capitalize min-w-[120px] text-center">
            {month ? format(month, 'MMMM yyyy', { locale: id }) : '—'}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext} disabled={!hasNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Monthly summary */}
        <div className="flex items-center justify-center gap-6 mt-1">
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground">Pemasukan</p>
            <p className="text-base font-bold text-green-700">+ Rp {animatedSales.toLocaleString('id-ID')}</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground">Pengeluaran</p>
            <p className="text-base font-bold text-red-700">- Rp {animatedPurchases.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
      <>
      {/* Desktop table */}
      <div className="hidden lg:block rounded-xl border-2 border-border overflow-x-auto bg-card shadow-sm" data-theme-table>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="w-1 p-0" />
              <th className="text-left p-2 font-medium">Tanggal</th>
              <th className="text-left p-2 font-medium">Keterangan</th>
              <th className="text-left p-2 font-medium">Kategori</th>
              <th className="text-right p-2 font-medium whitespace-nowrap">Jumlah</th>
              <th className="w-12 p-2" />
            </tr>
          </thead>
          <tbody>
            {merged.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted-foreground py-6">
                  Belum ada data
                </td>
              </tr>
            )}
            {merged.map((row) => (
              <tr
                key={`${row._type}-${row.id}`}
                className="border-b last:border-0 transition-colors hover:bg-muted/30"
              >
                <td className={`w-1 p-0 ${isSales(row) ? 'bg-green-500' : 'bg-red-500'}`} />
                <td className="p-2 whitespace-nowrap">
                  {format(new Date(row.transaction_date), 'dd MMM yyyy', { locale: id })}
                </td>
                <td className="p-2 max-w-[200px] truncate" title={description(row)}>
                  {description(row)}
                </td>
                <td className="p-2">
                  {category(row)}
                </td>
                <td className={`p-2 text-right whitespace-nowrap font-medium ${isSales(row) ? 'text-green-700' : 'text-red-700'}`}>
                  {isSales(row) ? '+ ' : '- '}Rp {row._amount.toLocaleString('id-ID')}
                </td>
                <td className="p-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDetail(row)}
                    aria-label="Detail"
                    title="Detail"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="lg:hidden divide-y divide-gray-200 overflow-hidden">
        {merged.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6">Belum ada data</p>
        )}
        {merged.map((row, i) => (
          <button
            key={`${row._type}-${row.id}`}
            type="button"
            className="animate-card-in w-full text-left px-1 py-2.5 overflow-hidden transition-colors active:bg-muted/40"
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => handleDetail(row)}
          >
            <div className="flex items-center justify-between min-w-0">
              <span className="text-[11px] text-muted-foreground shrink-0">
                {format(new Date(row.transaction_date), 'dd MMM yyyy', { locale: id })}
              </span>
              <span className={`text-sm font-semibold shrink-0 ${isSales(row) ? 'text-green-700' : 'text-red-700'}`}>
                {isSales(row) ? '+ ' : '- '}Rp {row._amount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                {row._type === 'purchase' && (
                  <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {categories[row.category_id] ?? '-'}
                  </span>
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {description(row)}
                </span>
              </div>
              <Arrow className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 ml-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Item count */}
      {merged.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {merged.length} transaksi
        </p>
      )}
      </>
      )}
    </>
  )
}
