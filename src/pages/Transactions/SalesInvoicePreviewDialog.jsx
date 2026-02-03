import { useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function SalesInvoicePreviewDialog({ open, onOpenChange, payload, onSuccess, onBack }) {
  const [saving, setSaving] = useState(false)

  if (!payload) return null
  const { transactionDate, paymentMethodId, paymentMethodName, lines, total, editingTransaction } = payload
  const validLines = lines.filter((l) => l.product_id && Number(l.quantity) > 0)

  async function generateTransactionNo(dateStr) {
    const { data, error } = await supabase.rpc('generate_sales_transaction_no', {
      p_txn_date: dateStr,
    })
    if (error) {
      throw new Error(error.message)
    }
    return data
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      if (editingTransaction) {
        const { error: errHeader } = await supabase
          .from('sales_transactions')
          .update({
            transaction_date: transactionDate,
            total: Number(total),
            payment_method_id: paymentMethodId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTransaction.id)
        if (errHeader) {
          toast.error(errHeader.message)
          setSaving(false)
          return
        }
        await supabase.from('sales_details').delete().eq('sales_transaction_id', editingTransaction.id)
        const detailsToInsert = validLines.map((l) => ({
          sales_transaction_id: editingTransaction.id,
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          subtotal: Number(l.quantity) * Number(l.unit_price),
        }))
        if (detailsToInsert.length) {
          const { error: errDetails } = await supabase.from('sales_details').insert(detailsToInsert)
          if (errDetails) {
            toast.error(errDetails.message)
            setSaving(false)
            return
          }
        }
        toast.success('Penjualan diperbarui')
      } else {
        let transactionNo
        try {
          transactionNo = await generateTransactionNo(transactionDate)
        } catch (err) {
          toast.error(err?.message ?? 'Gagal generate nomor transaksi. Pastikan fungsi generate_sales_transaction_no sudah dijalankan di Supabase.')
          setSaving(false)
          return
        }
        const { data: inserted, error: errHeader } = await supabase
          .from('sales_transactions')
          .insert({
            transaction_no: transactionNo,
            transaction_date: transactionDate,
            total: Number(total),
            payment_method_id: paymentMethodId || null,
          })
          .select('id')
          .single()
        if (errHeader || !inserted) {
          toast.error(errHeader?.message ?? 'Gagal menyimpan')
          setSaving(false)
          return
        }
        const detailsToInsert = validLines.map((l) => ({
          sales_transaction_id: inserted.id,
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          subtotal: Number(l.quantity) * Number(l.unit_price),
        }))
        const { error: errDetails } = await supabase.from('sales_details').insert(detailsToInsert)
        if (errDetails) {
          toast.error(errDetails.message)
          setSaving(false)
          return
        }
        toast.success('Penjualan disimpan')
      }
      onOpenChange(false)
      onSuccess?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preview Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            Tanggal: {format(new Date(transactionDate), 'dd MMMM yyyy', { locale: id })}
          </p>
          {paymentMethodName && (
            <p>Metode pembayaran: {paymentMethodName}</p>
          )}
          <div className="rounded border overflow-hidden">
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
                {validLines.map((l, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-2">{l.product_name || '(Produk)'}</td>
                    <td className="p-2 text-right">{Number(l.quantity).toLocaleString('id-ID')}</td>
                    <td className="p-2 text-right">
                      Rp {Number(l.unit_price).toLocaleString('id-ID')}
                    </td>
                    <td className="p-2 text-right">
                      Rp {(Number(l.quantity) * Number(l.unit_price)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-medium">
            Total: Rp {Number(total).toLocaleString('id-ID')}
          </p>
        </div>
        <DialogFooter>
          {onBack && (
            <Button type="button" variant="outline" onClick={() => { onBack(); onOpenChange(false); }}>
              Kembali
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2 inline" />
                Menyimpan...
              </>
            ) : (
              'Konfirmasi'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
