import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function Reports() {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [dateFrom, setDateFrom] = useState(() =>
    format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState(() =>
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [salesTotal, setSalesTotal] = useState(0)
  const [purchasesTotal, setPurchasesTotal] = useState(0)

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name')
      .order('name')
      .then(({ data }) => setProducts(data ?? []))
  }, [])

  async function applyFilter() {
    setLoading(true)
    setRows([])
    setSalesTotal(0)
    setPurchasesTotal(0)

    try {
      let salesQuery = supabase
        .from('sales_transactions')
        .select('id, transaction_no, transaction_date, total')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .order('transaction_date', { ascending: true })

      if (productId) {
        const { data: detailIds } = await supabase
          .from('sales_details')
          .select('sales_transaction_id')
          .eq('product_id', productId)
        const ids = [...new Set((detailIds ?? []).map((d) => d.sales_transaction_id))]
        if (ids.length === 0) {
          setRows([])
          setLoading(false)
          return
        }
        salesQuery = salesQuery.in('id', ids)
      }

      const [salesRes, purchasesRes] = await Promise.all([
        salesQuery,
        supabase
          .from('purchase_transactions')
          .select('id, description, amount, transaction_date')
          .gte('transaction_date', dateFrom)
          .lte('transaction_date', dateTo)
          .order('transaction_date', { ascending: true }),
      ])

      if (salesRes.error) {
        toast.error(salesRes.error.message)
        setLoading(false)
        return
      }
      if (purchasesRes.error) {
        toast.error(purchasesRes.error.message)
        setLoading(false)
        return
      }

      const sales = salesRes.data ?? []
      const purchases = purchasesRes.data ?? []

      const salesTotalVal = sales.reduce((sum, r) => sum + Number(r.total), 0)
      const purchasesTotalVal = purchases.reduce((sum, r) => sum + Number(r.amount), 0)
      setSalesTotal(salesTotalVal)
      setPurchasesTotal(purchasesTotalVal)

      const combined = [
        ...sales.map((r) => ({
          date: r.transaction_date,
          type: 'Penjualan',
          description: r.transaction_no,
          debit: 0,
          credit: Number(r.total),
        })),
        ...purchases.map((r) => ({
          date: r.transaction_date,
          type: 'Pembelian',
          description: r.description,
          debit: Number(r.amount),
          credit: 0,
        })),
      ].sort((a, b) => new Date(a.date) - new Date(b.date))

      setRows(combined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>

      <div className="flex flex-wrap gap-4 items-end mb-6 p-4 rounded-xl border-2 border-border bg-card shadow-sm">
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
        <Button onClick={applyFilter} disabled={loading}>
          {loading ? 'Memuat...' : 'Terapkan Filter'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="rounded-xl border-2 border-border overflow-x-auto mb-6 bg-card shadow-sm" data-theme-table>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Tanggal</th>
                  <th className="text-left p-3 font-medium">Tipe</th>
                  <th className="text-left p-3 font-medium">Keterangan</th>
                  <th className="text-right p-3 font-medium">Debit</th>
                  <th className="text-right p-3 font-medium">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-3">
                      {format(new Date(r.date), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="p-3">{r.type}</td>
                    <td className="p-3">{r.description}</td>
                    <td className="p-3 text-right">
                      {r.debit ? `Rp ${Number(r.debit).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-3 text-right">
                      {r.credit ? `Rp ${Number(r.credit).toLocaleString('id-ID')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-xl">
            <div className="rounded-xl border-2 border-primary/20 bg-card p-4 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Total Penjualan (periode)</p>
              <p className="text-xl font-semibold text-primary">
                Rp {Number(salesTotal).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="rounded-xl border-2 border-secondary-foreground/20 bg-card p-4 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Total Pembelian (periode)</p>
              <p className="text-xl font-semibold text-secondary-foreground">
                Rp {Number(purchasesTotal).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
