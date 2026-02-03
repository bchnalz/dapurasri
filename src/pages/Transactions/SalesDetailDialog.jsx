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
          <div className="space-y-3 text-sm">
            <p><span className="font-medium">No. Transaksi:</span> {transaction.transaction_no}</p>
            <p><span className="font-medium">Tanggal:</span> {format(new Date(transaction.transaction_date), 'dd MMMM yyyy', { locale: id })}</p>
            {paymentMethodName && (
              <p><span className="font-medium">Metode pembayaran:</span> {paymentMethodName}</p>
            )}
            <div className="rounded border overflow-hidden mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-2 font-medium">Produk</th>
                    <th className="text-right p-2 font-medium">Qty</th>
                    <th className="text-right p-2 font-medium">Harga</th>
                    <th className="text-right p-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="p-2">{d.products?.name ?? '-'}</td>
                      <td className="p-2 text-right">{Number(d.quantity).toLocaleString('id-ID')}</td>
                      <td className="p-2 text-right">Rp {Number(d.unit_price).toLocaleString('id-ID')}</td>
                      <td className="p-2 text-right">Rp {Number(d.subtotal).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-semibold pt-2">
              Total: Rp {Number(transaction.total).toLocaleString('id-ID')}
            </p>
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
