import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Minus, Trash2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

async function generateOrderNumber(dateStr) {
  const prefix = `PO-${dateStr.replace(/-/g, '')}`
  const { data } = await supabase
    .from('orders')
    .select('order_number')
    .like('order_number', `${prefix}-%`)
    .order('order_number', { ascending: false })
    .limit(1)
    .single()

  let seq = 1
  if (data?.order_number) {
    const lastSeq = parseInt(data.order_number.split('-').pop(), 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }
  return `${prefix}-${String(seq).padStart(3, '0')}`
}

export function OrderEntryDialog({
  open,
  onOpenChange,
  editingOrder,
  onSuccess,
}) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [customerId, setCustomerId] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [addingCustomer, setAddingCustomer] = useState(false)

  const [orderDate, setOrderDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [targetDate, setTargetDate] = useState('')

  const [lines, setLines] = useState([])
  const [currentProductId, setCurrentProductId] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState(1)

  const dropdownRef = useRef(null)
  const isEditing = !!editingOrder

  useEffect(() => {
    if (open) {
      loadData()
      if (editingOrder) {
        setCustomerId(editingOrder.customer_id)
        setCustomerSearch(editingOrder.customers?.name ?? '')
        setOrderDate(editingOrder.order_date)
        setTargetDate(editingOrder.target_date ?? '')
        loadOrderItems(editingOrder.id)
      } else {
        setCustomerId(null)
        setCustomerSearch('')
        setOrderDate(new Date().toISOString().split('T')[0])
        setTargetDate('')
        setLines([])
      }
      setCustomerDropdownOpen(false)
      setCurrentProductId('')
      setCurrentQuantity(1)
    }
  }, [open, editingOrder?.id])

  async function loadData() {
    setLoading(true)
    const [customersRes, productsRes] = await Promise.all([
      supabase.from('customers').select('id, name').order('name'),
      supabase.from('products').select('id, name, price, unit').order('name'),
    ])
    if (customersRes.error) toast.error(customersRes.error.message)
    if (productsRes.error) toast.error(productsRes.error.message)
    setCustomers(customersRes.data ?? [])
    setProducts(productsRes.data ?? [])
    setLoading(false)
  }

  async function loadOrderItems(orderId) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(name, unit)')
      .eq('order_id', orderId)

    if (error) {
      toast.error(error.message)
      setLines([])
      return
    }

    setLines(
      (data ?? []).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name ?? item.products?.name ?? '',
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        unit: item.unit ?? item.products?.unit ?? '',
      }))
    )
  }

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers
    const q = customerSearch.trim().toLowerCase()
    return customers.filter((c) => c.name.toLowerCase().includes(q))
  }, [customers, customerSearch])

  const hasExactMatch = useMemo(
    () =>
      customerSearch.trim() &&
      customers.some(
        (c) => c.name.toLowerCase() === customerSearch.trim().toLowerCase()
      ),
    [customers, customerSearch]
  )

  function selectCustomer(customer) {
    setCustomerId(customer.id)
    setCustomerSearch(customer.name)
    setCustomerDropdownOpen(false)
  }

  async function addNewCustomer() {
    const name = customerSearch.trim()
    if (!name) return
    setAddingCustomer(true)
    const { data, error } = await supabase
      .from('customers')
      .insert({ name })
      .select('id, name')
      .single()
    setAddingCustomer(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setCustomers((prev) =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
    )
    setCustomerId(data.id)
    setCustomerSearch(data.name)
    setCustomerDropdownOpen(false)
    toast.success(`Pemesan "${name}" ditambahkan`)
  }

  function addItem() {
    if (!currentProductId || Number(currentQuantity) <= 0) return
    const product = products.find((p) => p.id === currentProductId)
    setLines((prev) => [
      ...prev,
      {
        product_id: currentProductId,
        product_name: product?.name ?? '',
        quantity: Number(currentQuantity),
        unit_price: Number(product?.price) || 0,
        unit: product?.unit ?? '',
      },
    ])
    setCurrentProductId('')
    setCurrentQuantity(1)
  }

  function removeItem(index) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const total = lines.reduce(
    (sum, l) => sum + l.quantity * (l.unit_price || 0),
    0
  )
  const canSubmit = customerId && lines.length > 0 && targetDate

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          customer_id: customerId,
          target_date: targetDate,
        })
        .eq('id', editingOrder.id)

      if (updateError) {
        toast.error(updateError.message)
        setSaving(false)
        return
      }

      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', editingOrder.id)

      if (deleteItemsError) {
        toast.error(deleteItemsError.message)
        setSaving(false)
        return
      }

      const items = lines.map((line) => ({
        order_id: editingOrder.id,
        product_id: line.product_id,
        product_name: line.product_name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        unit: line.unit,
      }))

      const { error: insertItemsError } = await supabase
        .from('order_items')
        .insert(items)

      if (insertItemsError) {
        toast.error(insertItemsError.message)
        setSaving(false)
        return
      }

      toast.success('Pesanan berhasil diperbarui')
    } else {
      const orderNumber = await generateOrderNumber(orderDate)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          order_date: orderDate,
          target_date: targetDate,
          status: 'pending',
        })
        .select('id')
        .single()

      if (orderError) {
        toast.error(orderError.message)
        setSaving(false)
        return
      }

      const items = lines.map((line) => ({
        order_id: order.id,
        product_id: line.product_id,
        product_name: line.product_name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        unit: line.unit,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items)

      if (itemsError) {
        toast.error(itemsError.message)
        await supabase.from('orders').delete().eq('id', order.id)
        setSaving(false)
        return
      }

      toast.success('Pesanan berhasil dibuat')
    }

    setSaving(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" compact>
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Edit Pesanan ${editingOrder.order_number ?? ''}`
              : 'Pesanan Baru'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Customer search */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                Nama Pemesan
              </Label>
              <div className="relative" ref={dropdownRef}>
                <Input
                  placeholder="Cari nama pemesan..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    if (customerId) setCustomerId(null)
                    setCustomerDropdownOpen(true)
                  }}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setCustomerDropdownOpen(false), 200)
                  }
                />
                {customerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-lg ring-1 ring-black/5">
                    {filteredCustomers.length === 0 &&
                      !customerSearch.trim() && (
                        <p className="px-3 py-2.5 text-xs text-muted-foreground">
                          Ketik nama untuk mencari pemesan.
                        </p>
                      )}
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm transition-colors duration-100 hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectCustomer(c)}
                      >
                        {c.name}
                      </button>
                    ))}
                    {customerSearch.trim() && !hasExactMatch && (
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm transition-colors duration-100 hover:bg-accent hover:text-accent-foreground text-primary font-medium border-t"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={addNewCustomer}
                        disabled={addingCustomer}
                      >
                        {addingCustomer
                          ? 'Menambahkan...'
                          : `+ Tambah "${customerSearch.trim()}"`}
                      </button>
                    )}
                    {filteredCustomers.length === 0 &&
                      customerSearch.trim() &&
                      hasExactMatch && (
                        <p className="px-3 py-2.5 text-xs text-muted-foreground">
                          Tidak ada hasil lainnya.
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                  Tanggal Pesanan
                </Label>
                <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed opacity-60">
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="tabular-nums">
                    {format(new Date(orderDate), 'dd MMM yyyy', {
                      locale: localeId,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                  Target Selesai
                </Label>
                <DatePicker
                  value={targetDate}
                  onChange={setTargetDate}
                  placeholder="Pilih tanggal"
                />
              </div>
            </div>

            {/* Add item */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                Tambah Barang
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={currentProductId}
                  onValueChange={setCurrentProductId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-r-none shrink-0 transition-colors duration-100"
                    onClick={() =>
                      setCurrentQuantity((q) =>
                        Math.max(1, Number(q) - 1)
                      )
                    }
                    disabled={Number(currentQuantity) <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="1"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-14 rounded-none border-x-0 text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    placeholder="Qty"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-l-none shrink-0 transition-colors duration-100"
                    onClick={() =>
                      setCurrentQuantity((q) => Number(q) + 1)
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={
                    !currentProductId || Number(currentQuantity) <= 0
                  }
                  className="transition-colors duration-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                Daftar Barang
              </Label>
              <div
                className="rounded-xl border overflow-hidden max-h-48 overflow-y-auto"
                data-theme-table
              >
                {lines.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-6 text-center">
                    Belum ada item. Pilih produk dan klik Tambah.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Item</th>
                        <th className="text-right p-2 font-semibold w-16">
                          Qty
                        </th>
                        <th className="text-right p-2 font-semibold">
                          Subtotal
                        </th>
                        <th className="w-10 p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, i) => (
                        <tr
                          key={i}
                          className="animate-row-in border-b last:border-b-0 transition-colors duration-150 hover:bg-muted/30"
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <td className="p-2 font-medium">
                            {line.product_name}
                          </td>
                          <td className="p-2 text-right tabular-nums">
                            {line.quantity}
                          </td>
                          <td className="p-2 text-right tabular-nums font-medium whitespace-nowrap">
                            Rp{' '}
                            {(
                              line.quantity * line.unit_price
                            ).toLocaleString('id-ID')}
                          </td>
                          <td className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 transition-colors duration-100"
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
            </div>

            {/* Total bar */}
            {lines.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-primary/5 ring-1 ring-primary/10 px-4 py-3">
                <span className="text-sm font-medium text-primary/80">
                  Total
                </span>
                <span className="text-base font-bold tabular-nums text-primary tracking-tight">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-row w-full gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 transition-colors duration-150"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="flex-1 transition-colors duration-150"
            onClick={handleSubmit}
            disabled={loading || saving || !canSubmit}
          >
            {saving
              ? 'Menyimpan...'
              : isEditing
                ? 'Simpan Perubahan'
                : 'Simpan Pesanan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
