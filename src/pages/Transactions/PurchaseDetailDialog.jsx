import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'

export function PurchaseDetailDialog({ open, onOpenChange, transactionId, onEdit, onDeleted }) {
  const [row, setRow] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [paymentMethodName, setPaymentMethodName] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (open && transactionId) {
      loadDetail()
    } else {
      setRow(null)
    }
    setConfirmDeleteOpen(false)
  }, [open, transactionId])

  async function loadDetail() {
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()
    if (error || !data) {
      setRow(null)
      setLoading(false)
      return
    }
    setRow(data)

    if (data.category_id) {
      const { data: cat } = await supabase
        .from('purchase_categories')
        .select('name')
        .eq('id', data.category_id)
        .single()
      setCategoryName(cat?.name ?? '')
    } else {
      setCategoryName('')
    }

    if (data.payment_method_id) {
      const { data: pm } = await supabase
        .from('payment_methods')
        .select('name')
        .eq('id', data.payment_method_id)
        .single()
      setPaymentMethodName(pm?.name ?? '')
    } else {
      setPaymentMethodName('')
    }
    setLoading(false)
  }

  function handleEdit() {
    if (!row) return
    onEdit?.(row)
    onOpenChange?.(false)
  }

  async function handleDelete() {
    if (!row) return
    const { error } = await supabase.from('purchase_transactions').delete().eq('id', row.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Transaksi pembelian dihapus')
    onOpenChange?.(false)
    onDeleted?.()
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Pembelian</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : row ? (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Tanggal</span>
              <span className="font-medium">{format(new Date(row.transaction_date), 'dd MMMM yyyy', { locale: id })}</span>
              <span className="text-muted-foreground">Kategori</span>
              <span className="font-medium">{categoryName || '-'}</span>
              <span className="text-muted-foreground">Keterangan</span>
              <span className="font-medium">{row.description}</span>
              {paymentMethodName && (
                <>
                  <span className="text-muted-foreground">Pembayaran</span>
                  <span className="font-medium">{paymentMethodName}</span>
                </>
              )}
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
              <span className="text-sm text-red-800">Jumlah</span>
              <span className="text-lg font-bold text-red-700">Rp {Number(row.amount).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Data tidak ditemukan.</p>
        )}
        <DialogFooter className="gap-2 pt-2 sm:flex-row sm:justify-between sm:items-center">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Tutup
            </Button>
          </DialogClose>
          {row && (
            <div className="flex w-full sm:w-auto gap-2">
              <Button variant="secondary" className="flex-1 sm:flex-none" onClick={handleEdit}>
                Edit
              </Button>
              <Button
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Hapus
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Hapus transaksi pembelian?"
        description={row ? `Yakin hapus transaksi tanggal ${format(new Date(row.transaction_date), 'dd MMM yyyy', { locale: id })}?` : 'Yakin hapus transaksi ini?'}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </Dialog>
  )
}
