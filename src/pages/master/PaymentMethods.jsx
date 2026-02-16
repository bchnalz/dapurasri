import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowLeft, CreditCard } from 'lucide-react'
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

const PAGE_SIZE = 10

export default function PaymentMethods() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { name: '' },
  })

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name')
    if (error) {
      toast.error(error.message)
      setItems([])
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let list = [...items]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => c.name?.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const aVal = a[sortBy] ?? ''
      const bVal = b[sortBy] ?? ''
      return (sortDir === 'asc' ? 1 : -1) * String(aVal).localeCompare(String(bVal))
    })
    return list
  }, [items, search, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  function openCreate() {
    setEditingId(null)
    reset({ name: '' })
    setDialogOpen(true)
  }

  function openEdit(row) {
    setEditingId(row.id)
    setValue('name', row.name)
    setDialogOpen(true)
  }

  async function onSubmit(values) {
    setSaving(true)
    const payload = {
      name: values.name.trim(),
      updated_at: new Date().toISOString(),
    }
    if (editingId) {
      const { error } = await supabase.from('payment_methods').update(payload).eq('id', editingId)
      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }
      toast.success('Metode pembayaran diperbarui')
    } else {
      const { error } = await supabase.from('payment_methods').insert(payload)
      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }
      toast.success('Metode pembayaran ditambahkan')
    }
    setDialogOpen(false)
    setSaving(false)
    loadItems()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await supabase.from('payment_methods').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Metode pembayaran dihapus')
      loadItems()
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
    <div className="animate-section-in">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/master')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 transition-transform duration-300">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Metode Pembayaran</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} metode ditemukan
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="animate-card-in flex flex-col sm:flex-row sm:items-center gap-3 mb-5" style={{ animationDelay: '60ms' }}>
        <Input
          placeholder="Cari nama..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="max-w-sm"
        />
        <Button onClick={openCreate} className="gap-1.5 transition-all duration-200 active:scale-95 sm:ml-auto">
          <Plus className="h-4 w-4" />
          Tambah Metode Pembayaran
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div
            className="hidden sm:block animate-card-in rounded-2xl border-2 border-border overflow-hidden bg-card shadow-sm"
            style={{ animationDelay: '100ms' }}
            data-theme-table
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    <button type="button" className="hover:text-foreground transition-colors" onClick={() => toggleSort('name')}>
                      Nama {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="w-24 p-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center text-muted-foreground py-10 text-sm">
                      Tidak ada metode pembayaran ditemukan
                    </td>
                  </tr>
                )}
                {paginated.map((row, i) => (
                  <tr
                    key={row.id}
                    className="animate-row-in border-b last:border-0 transition-colors hover:bg-muted/30"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                          className="h-8 w-8 transition-all duration-200 hover:scale-110"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(row)}
                          aria-label="Hapus"
                          className="h-8 w-8 text-destructive hover:text-destructive transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-0 divide-y divide-border">
            {paginated.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                Tidak ada metode pembayaran ditemukan
              </p>
            )}
            {paginated.map((row, i) => (
              <div
                key={row.id}
                className="animate-card-in flex items-center justify-between py-3 px-1"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-sm font-medium">{row.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(row)}
                    aria-label="Edit"
                    className="h-7 w-7"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(row)}
                    aria-label="Hapus"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 animate-chip-in">
              <span className="text-xs text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="transition-all duration-200 active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="transition-all duration-200 active:scale-95"
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
            <DialogTitle>{editingId ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="pm-name">Nama</Label>
              <Input id="pm-name" {...register('name', { required: 'Nama wajib diisi' })} className="mt-1" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="transition-all duration-200 active:scale-95">
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="transition-all duration-200 active:scale-95">
                {saving ? 'Menyimpan...' : editingId ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus metode pembayaran?"
        description={deleteTarget ? `Yakin hapus "${deleteTarget.name}"?` : ''}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
