import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Eye, ChevronLeft, ChevronRight, ChevronRight as Arrow } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

const PAGE_SIZE = 10

export function TransactionList({ refreshKey, onViewSalesDetail, onViewPurchaseDetail }) {
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    loadAll()
  }, [refreshKey])

  useEffect(() => {
    supabase.from('purchase_categories').select('id, name').then(({ data }) => {
      const map = {}
      ;(data ?? []).forEach((c) => { map[c.id] = c.name })
      setCategories(map)
    })
  }, [])

  async function loadAll() {
    setLoading(true)
    const [salesRes, purchasesRes] = await Promise.all([
      supabase
        .from('sales_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ])
    if (salesRes.error) toast.error(salesRes.error.message)
    if (purchasesRes.error) toast.error(purchasesRes.error.message)
    setSales(salesRes.data ?? [])
    setPurchases(purchasesRes.data ?? [])
    setLoading(false)
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

  const totalPages = Math.max(1, Math.ceil(merged.length / PAGE_SIZE))
  const paginated = merged.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
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
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted-foreground py-6">
                  Belum ada data
                </td>
              </tr>
            )}
            {paginated.map((row) => (
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
                  Rp {row._amount.toLocaleString('id-ID')}
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
      <div className="lg:hidden divide-y divide-gray-200">
        {paginated.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6">Belum ada data</p>
        )}
        {paginated.map((row, i) => (
          <button
            key={`${row._type}-${row.id}`}
            type="button"
            className="animate-card-in w-full text-left px-1 py-2.5 transition-colors active:bg-muted/40"
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => handleDetail(row)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {format(new Date(row.transaction_date), 'dd MMM yyyy', { locale: id })}
              </span>
              <span className={`text-sm font-semibold ${isSales(row) ? 'text-green-700' : 'text-red-700'}`}>
                Rp {row._amount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-center gap-1.5 min-w-0 max-w-[80%]">
                {row._type === 'purchase' && (
                  <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {categories[row.category_id] ?? '-'}
                  </span>
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {description(row)}
                </span>
              </div>
              <Arrow className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {merged.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, merged.length)} dari {merged.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
