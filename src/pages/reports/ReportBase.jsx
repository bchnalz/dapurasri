import { useEffect, useMemo, useRef, useState } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return display
}

/**
 * @param {{ mode: 'sales' | 'purchases' }} props
 */
export function ReportBase({ mode }) {
  const navigate = useNavigate()
  const isSales = mode === 'sales'

  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('all')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentMethodId, setPaymentMethodId] = useState('all')

  const [dateFrom, setDateFrom] = useState(() =>
    format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)

  const animatedTotal = useAnimatedNumber(total)

  useEffect(() => {
    const loaders = [
      supabase.from('payment_methods').select('id, name').order('name'),
    ]
    if (isSales) loaders.unshift(supabase.from('products').select('id, name').order('name'))

    Promise.all(loaders).then((res) => {
      if (isSales) {
        const [productsRes, paymentMethodsRes] = res
        setProducts(productsRes.data ?? [])
        setPaymentMethods(paymentMethodsRes.data ?? [])
      } else {
        const [paymentMethodsRes] = res
        setPaymentMethods(paymentMethodsRes.data ?? [])
      }
    })
  }, [isSales])

  const title = useMemo(() => {
    if (isSales) return 'Laporan Penjualan'
    return 'Laporan Pengeluaran'
  }, [isSales])

  const TitleIcon = isSales ? TrendingUp : TrendingDown

  async function applyFilter() {
    setLoading(true)
    setRows([])
    setTotal(0)
    setHasSearched(true)

    try {
      if (isSales) {
        let salesQuery = supabase
          .from('sales_transactions')
          .select('id, transaction_no, transaction_date, total')
          .gte('transaction_date', dateFrom)
          .lte('transaction_date', dateTo)
          .order('transaction_date', { ascending: true })

        if (paymentMethodId && paymentMethodId !== 'all') {
          salesQuery = salesQuery.eq('payment_method_id', paymentMethodId)
        }
        if (productId && productId !== 'all') {
          const { data: detailIds, error: detailErr } = await supabase
            .from('sales_details')
            .select('sales_transaction_id')
            .eq('product_id', productId)
          if (detailErr) {
            toast.error(detailErr.message)
            return
          }
          const ids = [...new Set((detailIds ?? []).map((d) => d.sales_transaction_id))]
          if (ids.length === 0) {
            setRows([])
            return
          }
          salesQuery = salesQuery.in('id', ids)
        }

        const salesRes = await salesQuery
        if (salesRes.error) {
          toast.error(salesRes.error.message)
          return
        }

        const sales = salesRes.data ?? []
        setTotal(sales.reduce((sum, r) => sum + Number(r.total), 0))
        setRows(
          sales
            .map((r) => ({
              date: r.transaction_date,
              description: r.transaction_no,
              amount: Number(r.total),
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        )
        return
      }

      let purchasesQuery = supabase
        .from('purchase_transactions')
        .select('id, description, amount, transaction_date')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .order('transaction_date', { ascending: true })

      if (paymentMethodId && paymentMethodId !== 'all') {
        purchasesQuery = purchasesQuery.eq('payment_method_id', paymentMethodId)
      }

      const purchasesRes = await purchasesQuery
      if (purchasesRes.error) {
        toast.error(purchasesRes.error.message)
        return
      }

      const purchases = purchasesRes.data ?? []
      setTotal(purchases.reduce((sum, r) => sum + Number(r.amount), 0))
      setRows(
        purchases
          .map((r) => ({
            date: r.transaction_date,
            description: r.description,
            amount: Number(r.amount),
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleExportExcel() {
    if (!rows.length) {
      toast.error('Tidak ada data untuk diexport')
      return
    }

    const { default: ExcelJS } = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Laporan')

    ws.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'Keterangan', key: 'keterangan', width: 32 },
      { header: 'Nominal', key: 'nominal', width: 16 },
    ]

    rows.forEach((r) => {
      ws.addRow({
        tanggal: format(new Date(r.date), 'yyyy-MM-dd'),
        keterangan: r.description,
        nominal: r.amount,
      })
    })

    ws.getRow(1).font = { bold: true }
    ws.getColumn('nominal').numFmt = '#,##0'

    const typeLabel = isSales ? 'penjualan' : 'pengeluaran'
    const filename = `laporan-${typeLabel}-${dateFrom}-${dateTo}.xlsx`

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const accent = isSales
    ? {
        iconBg: 'bg-green-100 text-green-700',
        border: 'border-green-200/50',
        text: 'text-green-700',
        bar: 'bg-green-500',
        emptyBg: 'bg-green-50 text-green-300',
      }
    : {
        iconBg: 'bg-red-100 text-red-700',
        border: 'border-red-200/50',
        text: 'text-red-700',
        bar: 'bg-red-500',
        emptyBg: 'bg-red-50 text-red-300',
      }

  const periodLabel = (() => {
    try {
      const from = format(new Date(dateFrom), 'dd MMM yyyy', { locale: idLocale })
      const to = format(new Date(dateTo), 'dd MMM yyyy', { locale: idLocale })
      return `${from} — ${to}`
    } catch {
      return ''
    }
  })()

  return (
    <div className="animate-section-in">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.iconBg} transition-transform duration-300`}>
            <TitleIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {hasSearched && periodLabel && (
              <p className="text-xs text-muted-foreground mt-0.5 animate-chip-in">
                {periodLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="animate-card-in rounded-2xl border-2 border-border bg-card p-4 shadow-sm mb-6" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter</span>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {isSales && (
            <div className="min-w-[180px]">
              <Label className="block mb-1.5 text-xs font-medium text-muted-foreground">
                Produk
              </Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua produk</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="min-w-[180px]">
            <Label className="block mb-1.5 text-xs font-medium text-muted-foreground">
              Metode Pembayaran
            </Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua metode</SelectItem>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={String(pm.id)}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="report-from" className="block mb-1.5 text-xs font-medium text-muted-foreground">
              Dari tanggal
            </Label>
            <Input
              id="report-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="report-to" className="block mb-1.5 text-xs font-medium text-muted-foreground">
              Sampai tanggal
            </Label>
            <Input
              id="report-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={applyFilter} disabled={loading} className="gap-1.5 transition-all duration-200 active:scale-95">
              {loading ? 'Memuat...' : 'Terapkan'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={loading || rows.length === 0}
              className="gap-1.5 transition-all duration-200 active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : hasSearched ? (
        <>
          {/* Summary card */}
          <div className="animate-card-in mb-5 max-w-xs" style={{ animationDelay: '80ms' }}>
            <div className={`rounded-2xl border-2 ${accent.border} bg-card p-4 shadow-sm transition-shadow duration-300 hover:shadow-md`}>
              <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                Total {isSales ? 'Penjualan' : 'Pengeluaran'}
              </p>
              <p className={`text-2xl font-bold tracking-tight ${accent.text} mt-1 tabular-nums`}>
                Rp {animatedTotal.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {rows.length} transaksi
              </p>
            </div>
          </div>

          {/* Desktop table */}
          <div
            className="hidden lg:block animate-card-in rounded-2xl border-2 border-border overflow-hidden bg-card shadow-sm"
            style={{ animationDelay: '120ms' }}
            data-theme-table
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-1 p-0" />
                  <th className="text-left p-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Tanggal</th>
                  <th className="text-left p-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Keterangan</th>
                  <th className="text-right p-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted-foreground py-10 text-sm">
                      Tidak ada data untuk periode ini
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="animate-row-in border-b last:border-0 transition-colors hover:bg-muted/30"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className={`w-1 p-0 ${accent.bar}`} />
                    <td className="p-3 whitespace-nowrap text-sm">
                      {format(new Date(r.date), 'dd MMM yyyy', { locale: idLocale })}
                    </td>
                    <td className="p-3 text-sm max-w-[300px] truncate" title={r.description}>
                      {r.description}
                    </td>
                    <td className={`p-3 text-right whitespace-nowrap font-semibold tabular-nums ${accent.text}`}>
                      Rp {r.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="lg:hidden space-y-0 divide-y divide-gray-200">
            {rows.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                Tidak ada data untuk periode ini
              </p>
            )}
            {rows.map((r, i) => (
              <div
                key={i}
                className="animate-card-in py-3 px-1"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(r.date), 'dd MMM yyyy', { locale: idLocale })}
                  </span>
                  <span className={`text-sm font-semibold tabular-nums ${accent.text}`}>
                    Rp {r.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.description}</p>
              </div>
            ))}
          </div>

          {rows.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center animate-chip-in">
              {rows.length} transaksi ditampilkan
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-section-in">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${accent.emptyBg} mb-4`}>
            <TitleIcon className="h-8 w-8" />
          </div>
          <p className="text-sm text-muted-foreground">
            Atur filter lalu tekan <span className="font-medium text-foreground">Terapkan</span> untuk melihat laporan.
          </p>
        </div>
      )}
    </div>
  )
}
