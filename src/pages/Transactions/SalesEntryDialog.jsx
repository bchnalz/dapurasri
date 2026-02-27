import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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

const PAYMENT_TOGGLE_OPTIONS = ['QRIS', 'CASH']

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
  const paymentMethodByName = Object.fromEntries(
    paymentMethods.map((pm) => [String(pm.name ?? '').trim().toUpperCase(), pm.id])
  )
  const selectedPaymentName = PAYMENT_TOGGLE_OPTIONS.find(
    (name) => paymentMethodByName[name] === paymentMethodId
  ) ?? ''

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

  useEffect(() => {
    if (!open || paymentMethodId) return
    const fallbackId = paymentMethodByName.QRIS ?? paymentMethodByName.CASH ?? ''
    if (fallbackId) setPaymentMethodId(fallbackId)
  }, [open, paymentMethodId, paymentMethodByName])

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

  function adjustCurrentQuantity(delta) {
    setCurrentQuantity((prev) => {
      const next = (Number(prev) || 0) + delta
      return next < 0 ? 0 : next
    })
  }

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
    0
  )
  const canSubmit = lines.length > 0 && total > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" compact>
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
              <DatePicker
                value={transactionDate}
                onChange={setTransactionDate}
                placeholder="Pilih tanggal"
                className="h-9 flex-1 min-w-[140px]"
              />
              <div className="flex-1 min-w-0">
                <ToggleGroup
                  type="single"
                  value={selectedPaymentName}
                  onValueChange={(value) => {
                    const id = paymentMethodByName[value]
                    if (id) setPaymentMethodId(id)
                  }}
                  variant="outline"
                  spacing={1}
                  size="default"
                  className="w-full"
                >
                  {PAYMENT_TOGGLE_OPTIONS.map((name) => (
                    <ToggleGroupItem
                      key={name}
                      value={name}
                      disabled={!paymentMethodByName[name]}
                      className="h-9 flex-1 text-xs data-[state=on]:font-bold"
                      aria-label={name}
                    >
                      {name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            <div className="space-y-1">
              <div className="space-y-1">
                <Label>Tambah barang</Label>
                <div className="flex flex-wrap items-center gap-2">
                <Select value={currentProductId} onValueChange={setCurrentProductId}>
                  <SelectTrigger className="h-9 w-[200px]">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} – Rp {Number(p.price).toLocaleString('id-ID')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="inline-flex h-9 items-center overflow-hidden rounded-md border border-input bg-background">
                  <button
                    type="button"
                    className="h-full w-8 text-muted-foreground transition-colors hover:bg-accent"
                    onClick={() => adjustCurrentQuantity(-1)}
                    aria-label="Kurangi jumlah"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    min="0"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-full w-12 rounded-none border-0 bg-transparent px-0 text-center [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:ring-0"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    className="h-full w-8 text-muted-foreground transition-colors hover:bg-accent"
                    onClick={() => adjustCurrentQuantity(1)}
                    aria-label="Tambah jumlah"
                  >
                    +
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
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
                <div className="rounded-xl border overflow-hidden h-48 overflow-y-auto" data-theme-table>
                  {lines.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center">
                      Belum ada item. Pilih produk dan klik Tambah.
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-semibold">Item</th>
                          <th className="text-right p-2 font-semibold w-10">Qty</th>
                          <th className="text-right p-2 font-semibold">Harga</th>
                          <th className="text-right p-2 font-semibold">Subtotal</th>
                          <th className="w-10 p-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line, i) => (
                          <tr key={i} className="border-b last:border-b-0 transition-colors hover:bg-muted/30">
                            <td className="p-2">{line.product_name}</td>
                            <td className="p-2 text-right w-10">{Number(line.quantity)}</td>
                            <td className="p-2 text-right">
                              Rp {Number(line.unit_price).toLocaleString('id-ID')}
                            </td>
                            <td className="p-2 text-right font-medium">
                              Rp {(Number(line.quantity) * Number(line.unit_price)).toLocaleString('id-ID')}
                            </td>
                            <td className="p-2 w-10">
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

            <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
              <span className="text-sm text-green-800">Total</span>
              <span className="text-base font-bold text-green-700">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            </div>
          </>
        )}
        <DialogFooter className="flex flex-row w-full gap-2">
          <Button type="button" variant="outline" className="h-9 flex-1" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            className="h-9 flex-1"
            onClick={() =>
              onSuccess?.({
                transactionDate,
                paymentMethodId: paymentMethodId || null,
                paymentMethodName: selectedPaymentName,
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
