import { useEffect, useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

/**
 * @param {{ mode: 'sales' | 'purchases' }} props
 */
export function ReportBase({ mode }) {
  const isSales = mode === 'sales'
  const isPurchases = mode === 'purchases'

  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentMethodId, setPaymentMethodId] = useState('')

  const [dateFrom, setDateFrom] = useState(() =>
    format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [salesTotal, setSalesTotal] = useState(0)
  const [purchasesTotal, setPurchasesTotal] = useState(0)

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
    if (isPurchases) return 'Laporan Pengeluaran'
    return 'Laporan'
  }, [isSales, isPurchases])

  async function applyFilter() {
    setLoading(true)
    setRows([])
    setSalesTotal(0)
    setPurchasesTotal(0)

    try {
      if (isSales) {
        let salesQuery = supabase
          .from('sales_transactions')
          .select('id, transaction_no, transaction_date, total')
          .gte('transaction_date', dateFrom)
          .lte('transaction_date', dateTo)
          .order('transaction_date', { ascending: true })

        if (paymentMethodId) {
          salesQuery = salesQuery.eq('payment_method_id', paymentMethodId)
        }
        if (productId) {
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
        const salesTotalVal = sales.reduce((sum, r) => sum + Number(r.total), 0)
        setSalesTotal(salesTotalVal)
        setPurchasesTotal(0)

        setRows(
          sales
            .map((r) => ({
              date: r.transaction_date,
              type: 'Penjualan',
              description: r.transaction_no,
              debit: 0,
              credit: Number(r.total),
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

      if (paymentMethodId) {
        purchasesQuery = purchasesQuery.eq('payment_method_id', paymentMethodId)
      }

      const purchasesRes = await purchasesQuery
      if (purchasesRes.error) {
        toast.error(purchasesRes.error.message)
        return
      }

      const purchases = purchasesRes.data ?? []
      const purchasesTotalVal = purchases.reduce((sum, r) => sum + Number(r.amount), 0)
      setSalesTotal(0)
      setPurchasesTotal(purchasesTotalVal)

      setRows(
        purchases
          .map((r) => ({
            date: r.transaction_date,
            type: 'Pengeluaran',
            description: r.description,
            debit: Number(r.amount),
            credit: 0,
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
      const nominal = isSales ? Number(r.credit) || 0 : Number(r.debit) || 0
      ws.addRow({
        tanggal: format(new Date(r.date), 'yyyy-MM-dd'),
        keterangan: r.description,
        nominal,
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

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-medium">{title}</h2>
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-6 p-4 rounded-xl border-2 border-border bg-card shadow-sm">
        {isSales && (
          <div>
            <Label htmlFor="report-product" className="block mb-1 text-sm">
              Filter produk (hanya penjualan)
            </Label>
            <Select
              id="report-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-48"
            >
              <option value="">Semua</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="report-payment-method" className="block mb-1 text-sm">
            Metode pembayaran
          </Label>
          <Select
            id="report-payment-method"
            value={paymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
            className="w-48"
          >
            <option value="">Semua</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="report-from" className="block mb-1 text-sm">
            Dari
          </Label>
          <Input
            id="report-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label htmlFor="report-to" className="block mb-1 text-sm">
            Sampai
          </Label>
          <Input
            id="report-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={applyFilter} disabled={loading}>
            {loading ? 'Memuat...' : 'Terapkan Filter'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={loading || rows.length === 0}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div
            className="rounded-xl border-2 border-border overflow-x-auto mb-6 bg-card shadow-sm"
            data-theme-table
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Tanggal</th>
                  <th className="text-left p-3 font-medium">Keterangan</th>
                  <th className="text-right p-3 font-medium">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-3">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                    <td className="p-3">{r.description}</td>
                    <td className="p-3 text-right">
                      Rp{' '}
                      {Number(isSales ? r.credit : r.debit).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-xl">
            {isSales ? (
              <div className="rounded-xl border-2 border-primary/20 bg-card p-4 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Penjualan (periode)
                </p>
                <p className="text-xl font-semibold text-primary">
                  Rp {Number(salesTotal).toLocaleString('id-ID')}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-secondary-foreground/20 bg-card p-4 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Pengeluaran (periode)
                </p>
                <p className="text-xl font-semibold text-secondary-foreground">
                  Rp {Number(purchasesTotal).toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

