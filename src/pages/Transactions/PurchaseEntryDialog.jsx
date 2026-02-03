import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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

const lineShape = (categoryId, description, amount, categoryName = '') => ({
  category_id: categoryId,
  description: String(description).trim(),
  amount: parseFloat(amount) || 0,
  category_name: categoryName,
})

export function PurchaseEntryDialog({ open, onOpenChange, editingRow, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [transactionDate, setTransactionDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  )
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [lines, setLines] = useState([])

  const [currentCategoryId, setCurrentCategoryId] = useState('')
  const [currentDescription, setCurrentDescription] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')

  useEffect(() => {
    if (open) {
      loadCategories()
      loadPaymentMethods()
      if (editingRow) {
        setTransactionDate(editingRow.transaction_date)
        setPaymentMethodId(editingRow.payment_method_id ?? '')
        setLines([
          lineShape(
            editingRow.category_id,
            editingRow.description ?? '',
            editingRow.amount ?? 0,
            editingRow.category_name ?? ''
          ),
        ])
        setCurrentCategoryId('')
        setCurrentDescription('')
        setCurrentAmount('')
      } else {
        setTransactionDate(new Date().toISOString().split('T')[0])
        setPaymentMethodId('')
        setLines([])
        setCurrentCategoryId('')
        setCurrentDescription('')
        setCurrentAmount('')
      }
    }
  }, [open, editingRow?.id])

  async function loadCategories() {
    setLoadingCategories(true)
    const { data, error } = await supabase
      .from('purchase_categories')
      .select('id, name')
      .order('name')
    if (error) {
      setCategories([])
    } else {
      setCategories(data ?? [])
    }
    setLoadingCategories(false)
  }

  async function loadPaymentMethods() {
    const { data } = await supabase.from('payment_methods').select('id, name').order('name')
    setPaymentMethods(data ?? [])
  }

  function addItem() {
    if (!currentCategoryId || !String(currentDescription).trim()) return
    const cat = categories.find((c) => c.id === currentCategoryId)
    setLines((prev) => [
      ...prev,
      lineShape(currentCategoryId, currentDescription, currentAmount, cat?.name ?? ''),
    ])
    setCurrentCategoryId('')
    setCurrentDescription('')
    setCurrentAmount('')
  }

  function removeItem(index) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  function updateLine(index, field, value) {
    setLines((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === 'category_id') {
        const cat = categories.find((c) => c.id === value)
        next[index].category_name = cat?.name ?? ''
      }
      return next
    })
  }

  const validLines = lines.filter(
    (l) => l.category_id && String(l.description).trim() && (l.amount || 0) >= 0
  )

  async function handleSave() {
    if (editingRow) {
      const line = lines[0]
      const { error } = await supabase
        .from('purchase_transactions')
        .update({
          category_id: line.category_id,
          description: String(line.description).trim(),
          amount: Number(line.amount) || 0,
          transaction_date: transactionDate,
          payment_method_id: paymentMethodId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRow.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Pembelian diperbarui')
    } else {
      const toInsert = validLines.map((l) => ({
        category_id: l.category_id,
        description: String(l.description).trim(),
        amount: Number(l.amount) || 0,
        transaction_date: transactionDate,
        payment_method_id: paymentMethodId || null,
      }))
      const { error } = await supabase.from('purchase_transactions').insert(toInsert)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Pembelian disimpan')
    }
    onOpenChange(false)
    onSuccess?.()
  }

  if (!open) return null

  const isEdit = !!editingRow
  const canSubmit = validLines.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" compact>
        <DialogHeader>
          <DialogTitle>
            {editingRow ? 'Edit Pembelian' : 'Entri Pembelian Baru'}
          </DialogTitle>
        </DialogHeader>
        {loadingCategories ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Input
                id="purchase-date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="flex-1 min-w-[140px] text-sm pl-2 pr-8 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-0 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <Select
                id="purchase-payment"
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

            {isEdit ? (
              <div className="space-y-1">
                <Label>Item</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={lines[0]?.category_id ?? ''}
                    onChange={(e) => updateLine(0, 'category_id', e.target.value)}
                    className="max-w-[160px]"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Keterangan"
                    value={lines[0]?.description ?? ''}
                    onChange={(e) => updateLine(0, 'description', e.target.value)}
                    className="flex-1 min-w-[120px]"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="Jumlah"
                    value={lines[0]?.amount ?? ''}
                    onChange={(e) => updateLine(0, 'amount', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-28"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="space-y-1">
                  <Label>Tambah item</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={currentCategoryId}
                      onChange={(e) => setCurrentCategoryId(e.target.value)}
                      className="max-w-[160px]"
                    >
                      <option value="">Pilih kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      placeholder="Keterangan"
                      value={currentDescription}
                      onChange={(e) => setCurrentDescription(e.target.value)}
                      className="flex-1 min-w-[120px]"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="Jumlah"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-28"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      disabled={!currentCategoryId || !String(currentDescription).trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Daftar item</Label>
                  <div className="rounded-md border overflow-hidden h-48 overflow-y-auto">
                    {lines.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-4 text-center">
                        Belum ada item. Pilih kategori dan klik Tambah.
                      </p>
                    ) : (
                      <table className="w-full text-xs">
                        <tbody>
                          {lines.map((line, i) => (
                            <tr key={i} className="border-b last:border-b-0">
                              <td className="p-1.5">{line.category_name || '(Kategori)'}</td>
                              <td className="p-1.5">{line.description}</td>
                              <td className="p-1.5 text-right">
                                Rp {Number(line.amount).toLocaleString('id-ID')}
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
                </div>
              </div>
            )}
          </>
        )}
        <DialogFooter className="flex flex-row w-full gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={loadingCategories || !canSubmit}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
