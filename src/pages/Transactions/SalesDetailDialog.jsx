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

export function SalesDetailDialog({ open, onOpenChange, transactionId, onEdit, onDeleted }) {
  const [transaction, setTransaction] = useState(null)
  const [details, setDetails] = useState([])
  const [paymentMethodName, setPaymentMethodName] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (open && transactionId) {
      loadDetail()
    } else {
      setTransaction(null)
      setDetails([])
      setPaymentMethodName('')
    }
    setConfirmDeleteOpen(false)
  }, [open, transactionId])

  async function loadDetail() {
    setLoading(true)
    const { data: tx, error: txErr } = await supabase
      .from('sales_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()
    if (txErr || !tx) {
      setTransaction(null)
      setDetails([])
      setLoading(false)
      return
    }
    setTransaction(tx)

    if (tx.payment_method_id) {
      const { data: pm } = await supabase
        .from('payment_methods')
        .select('name')
        .eq('id', tx.payment_method_id)
        .single()
      setPaymentMethodName(pm?.name ?? '')
    } else {
      setPaymentMethodName('')
    }

    const { data: lines } = await supabase
      .from('sales_details')
      .select('*, products(name, unit)')
      .eq('sales_transaction_id', transactionId)
    setDetails(lines ?? [])
    setLoading(false)
  }

  function handleEdit() {
    if (!transaction) return
    onEdit?.(transaction)
    onOpenChange?.(false)
  }

  async function handleDelete() {
    if (!transaction) return
    const { error } = await supabase.from('sales_transactions').delete().eq('id', transaction.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Transaksi penjualan dihapus')
    onOpenChange?.(false)
    onDeleted?.()
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Penjualan</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : transaction ? (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">No. Transaksi</span>
              <span className="font-medium">{transaction.transaction_no}</span>
              <span className="text-muted-foreground">Tanggal</span>
              <span className="font-medium">{format(new Date(transaction.transaction_date), 'dd MMMM yyyy', { locale: id })}</span>
              {paymentMethodName && (
                <>
                  <span className="text-muted-foreground">Pembayaran</span>
                  <span className="font-medium">{paymentMethodName}</span>
                </>
              )}
            </div>

            {/* Items table */}
            <div className="rounded-xl border overflow-hidden" data-theme-table>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2.5 font-semibold">Produk</th>
                    <th className="text-right p-2.5 font-semibold">Qty</th>
                    <th className="text-right p-2.5 font-semibold">Harga</th>
                    <th className="text-right p-2.5 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                      <td className="p-2.5">{d.products?.name ?? '-'}</td>
                      <td className="p-2.5 text-right">{Number(d.quantity).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-right">Rp {Number(d.unit_price).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-right font-medium">Rp {Number(d.subtotal).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
              <span className="text-sm text-green-800">Total</span>
              <span className="text-lg font-bold text-green-700">Rp {Number(transaction.total).toLocaleString('id-ID')}</span>
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
          {transaction && (
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
        title="Hapus transaksi penjualan?"
        description={transaction ? `Yakin hapus "${transaction.transaction_no}"?` : 'Yakin hapus transaksi ini?'}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </Dialog>
  )
}
