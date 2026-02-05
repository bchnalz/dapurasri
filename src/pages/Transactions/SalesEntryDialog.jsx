import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

const lineShape = (productId, quantity, unitPrice, productName, unit) => ({
  product_id: productId,
  quantity: Number(quantity) || 0,
  unit_price: Number(unitPrice) || 0,
  product_name: productName ?? '',
  unit: unit ?? '',
})

export function SalesEntryDialog({ open, onOpenChange, editingTransaction, returnPayload, onConsumeReturnPayload, onSuccess }) {
  const [products, setProducts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [transactionDate, setTransactionDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  )
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [lines, setLines] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [currentProductId, setCurrentProductId] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState(1)

  const currentProduct = products.find((p) => p.id === currentProductId)
  const currentUnitPrice = currentProduct ? Number(currentProduct.price) : 0
  const currentSubtotal = currentUnitPrice * (Number(currentQuantity) || 0)

  useEffect(() => {
    if (open) {
      loadProducts()
      loadPaymentMethods()
      if (returnPayload) {
        setTransactionDate(returnPayload.transactionDate ?? new Date().toISOString().split('T')[0])
        setPaymentMethodId(returnPayload.paymentMethodId ?? '')
        setLines(returnPayload.lines?.length ? [...returnPayload.lines] : [])
        onConsumeReturnPayload?.()
      } else if (editingTransaction) {
        setTransactionDate(editingTransaction.transaction_date)
        setPaymentMethodId(editingTransaction.payment_method_id ?? '')
        loadDetails(editingTransaction.id)
      } else {
        setTransactionDate(new Date().toISOString().split('T')[0])
        setPaymentMethodId('')
        setLines([])
      }
      setCurrentProductId('')
      setCurrentQuantity(1)
    }
  }, [open, editingTransaction?.id])

  async function loadProducts() {
    setLoadingProducts(true)
    const { data, error } = await supabase.from('products').select('id, name, price, unit').order('name')
    if (error) {
      setProducts([])
    } else {
      setProducts(data ?? [])
    }
    setLoadingProducts(false)
  }

  async function loadPaymentMethods() {
    const { data } = await supabase.from('payment_methods').select('id, name').order('name')
    setPaymentMethods(data ?? [])
  }

  async function loadDetails(salesTransactionId) {
    setLoadingDetails(true)
    const { data: details } = await supabase
      .from('sales_details')
      .select('*, products(name, unit)')
      .eq('sales_transaction_id', salesTransactionId)
    setLoadingDetails(false)
    if (details?.length) {
      setLines(
        details.map((d) => ({
          product_id: d.product_id,
          quantity: Number(d.quantity),
          unit_price: Number(d.unit_price),
          product_name: d.products?.name ?? '',
          unit: d.products?.unit ?? '',
        }))
      )
    } else {
      setLines([])
    }
  }

  function addItem() {
    if (!currentProductId || Number(currentQuantity) <= 0) return
    const product = products.find((p) => p.id === currentProductId)
    setLines((prev) => [
      ...prev,
      lineShape(
        currentProductId,
        currentQuantity,
        currentUnitPrice,
        product?.name ?? '',
        product?.unit ?? ''
      ),
    ])
    setCurrentProductId('')
    setCurrentQuantity(1)
  }

  function removeItem(index) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
    0
  )
  const canSubmit = lines.length > 0 && total > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" compact>
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? 'Edit Penjualan' : 'Entri Penjualan Baru'}
          </DialogTitle>
        </DialogHeader>
        {loadingProducts ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Input
                id="tx-date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="flex-1 min-w-[140px] text-sm pl-2 pr-8 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-0 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <Select
                id="tx-payment"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="flex-1 min-w-0"
              >
                <option value="">Bayar pakai ?</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <div className="space-y-1">
                <Label>Tambah barang</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={currentProductId}
                    onChange={(e) => setCurrentProductId(e.target.value)}
                    className="max-w-[160px]"
                  >
                    <option value="">Pilih produk</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} – Rp {Number(p.price).toLocaleString('id-ID')}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    min="0"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-20"
                    placeholder="Qty"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    disabled={!currentProductId || Number(currentQuantity) <= 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Daftar barang</Label>
              {loadingDetails ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden h-48 overflow-y-auto">
                  {lines.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center">
                      Belum ada item. Pilih produk dan klik Tambah.
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <tbody>
                        {lines.map((line, i) => (
                          <tr key={i} className="border-b last:border-b-0">
                            <td className="p-1.5">{line.product_name}</td>
                            <td className="p-1.5 text-right w-12">{Number(line.quantity)}</td>
                            <td className="p-1.5 text-right">
                              Rp {Number(line.unit_price).toLocaleString('id-ID')}
                            </td>
                            <td className="p-1.5 text-right">
                              Rp {(Number(line.quantity) * Number(line.unit_price)).toLocaleString('id-ID')}
                            </td>
                            <td className="p-1.5 w-10">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeItem(i)}
                                aria-label="Hapus baris"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              </div>
            </div>

            <p className="text-sm font-medium">
              Total: Rp {total.toLocaleString('id-ID')}
            </p>
          </>
        )}
        <DialogFooter className="flex flex-row w-full gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() =>
              onSuccess?.({
                transactionDate,
                paymentMethodId: paymentMethodId || null,
                paymentMethodName: paymentMethods.find((p) => p.id === paymentMethodId)?.name ?? '',
                lines,
                total,
                editingTransaction,
              })
            }
            disabled={loadingProducts || loadingDetails || !canSubmit}
          >
            Buat Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
