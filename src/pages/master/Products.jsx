import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', price: '' },
  })

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    if (error) {
      toast.error(error.message)
      setProducts([])
    } else {
      setProducts(data ?? [])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.unit?.toLowerCase().includes(q)
      )
    }
    if (sortBy) {
      list.sort((a, b) => {
        const aVal = a[sortBy] ?? ''
        const bVal = b[sortBy] ?? ''
        const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : (aVal - bVal)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [products, search, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page]
  )

  function openCreate() {
    setEditingId(null)
    reset({ name: '', price: '' })
    setDialogOpen(true)
  }

  function openEdit(row) {
    setEditingId(row.id)
    setValue('name', row.name)
    setValue('price', String(row.price))
    setDialogOpen(true)
  }

  async function onSubmit(values) {
    setSaving(true)
    const unit = editingId
      ? (products.find((p) => p.id === editingId)?.unit ?? 'kg')
      : 'kg'
    const payload = {
      name: values.name.trim(),
      price: parseFloat(values.price) || 0,
      unit,
      updated_at: new Date().toISOString(),
    }
    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId)
      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }
      toast.success('Produk diperbarui')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }
      toast.success('Produk ditambahkan')
    }
    setDialogOpen(false)
    setSaving(false)
    loadProducts()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Produk dihapus')
      loadProducts()
    }
    setDeleteTarget(null)
  }

  function toggleSort(field) {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Cari nama atau satuan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="rounded-xl border-2 border-border overflow-x-auto bg-card shadow-sm" data-theme-table>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">
                    <button
                      type="button"
                      className="hover:underline"
                      onClick={() => toggleSort('name')}
                    >
                      Nama {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium">
                    <button
                      type="button"
                      className="hover:underline"
                      onClick={() => toggleSort('price')}
                    >
                      Harga {sortBy === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium">Satuan</th>
                  <th className="w-20 p-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-3">{row.name}</td>
                    <td className="p-3">{Number(row.price).toLocaleString('id-ID')}</td>
                    <td className="p-3">{row.unit}</td>
                    <td className="p-3 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(row)}
                        aria-label="Hapus"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari {filtered.length}
              </span>
              <div className="flex gap-2">
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
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nama</Label>
              <Input id="name" {...register('name', { required: 'Nama wajib diisi' })} className="mt-1" />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="price">Harga</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { required: 'Harga wajib diisi', min: { value: 0, message: 'Harga tidak boleh negatif' } })}
                className="mt-1"
              />
              {errors.price && (
                <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : editingId ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus produk?"
        description={deleteTarget ? `Yakin hapus "${deleteTarget.name}"?` : ''}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
