import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

const PAGE_SIZE = 5

export function PurchaseTable({ refreshKey, onViewDetail }) {
  const [rows, setRows] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    loadPurchases()
  }, [refreshKey])

  useEffect(() => {
    supabase.from('purchase_categories').select('id, name').then(({ data }) => {
      const map = {}
      ;(data ?? []).forEach((c) => { map[c.id] = c.name })
      setCategories(map)
    })
  }, [])

  async function loadPurchases() {
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      toast.error(error.message)
      setRows([])
    } else {
      setRows(data ?? [])
    }
    setLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const paginated = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border-2 border-border overflow-x-auto bg-card shadow-sm" data-theme-table>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-medium">Tanggal</th>
              <th className="text-left p-2 font-medium">Kategori</th>
              <th className="text-left p-2 font-medium">Keterangan</th>
              <th className="text-right p-2 font-medium">Jumlah</th>
              <th className="w-12 p-2" />
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="p-2">
                  {format(new Date(row.transaction_date), 'dd MMM yyyy', { locale: id })}
                </td>
                <td className="p-2">{categories[row.category_id] ?? '-'}</td>
                <td className="p-2">{row.description}</td>
                <td className="p-2 text-right">
                  Rp {Number(row.amount).toLocaleString('id-ID')}
                </td>
                <td className="p-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetail?.(row)}
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
      {rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} dari {rows.length}
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
