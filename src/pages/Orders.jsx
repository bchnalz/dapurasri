import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { OrderEntryDialog } from './Orders/OrderEntryDialog'

const PAGE_SIZE = 10

const STATUS_CONFIG = {
  pending: { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-800' },
  proses: { label: 'Diproses', className: 'bg-blue-100 text-blue-800' },
  selesai: { label: 'Selesai', className: 'bg-green-100 text-green-800' },
  batal: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(name), order_items(product_name, quantity, unit_price)')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(error.message)
      setOrders([])
    } else {
      setOrders(data ?? [])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.trim().toLowerCase()
    return orders.filter(
      (o) =>
        o.customers?.name?.toLowerCase().includes(q) ||
        o.order_number?.toLowerCase().includes(q)
    )
  }, [orders, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page]
  )

  const productCounts = useMemo(() => {
    const map = {}
    for (const order of orders) {
      if (!order.order_items?.length) continue
      for (const item of order.order_items) {
        const name = item.product_name
        if (!name) continue
        map[name] = (map[name] || 0) + Number(item.quantity)
      }
    }
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
  }, [orders])

  const productCustomers = useMemo(() => {
    if (!selectedProduct) return []
    const map = {}
    for (const order of orders) {
      if (!order.order_items?.length) continue
      const customerName = order.customers?.name ?? '-'
      for (const item of order.order_items) {
        if (item.product_name !== selectedProduct) continue
        const key = customerName
        if (!map[key]) {
          map[key] = { customer: customerName, qty: 0, orders: [] }
        }
        map[key].qty += Number(item.quantity)
        if (order.order_number && !map[key].orders.includes(order.order_number)) {
          map[key].orders.push(order.order_number)
        }
      }
    }
    return Object.values(map).sort((a, b) => b.qty - a.qty)
  }, [orders, selectedProduct])

  function orderNominal(order) {
    if (!order.order_items?.length) return 0
    return order.order_items.reduce(
      (sum, item) =>
        sum + Number(item.quantity) * Number(item.unit_price || 0),
      0
    )
  }

  const grandTotal = useMemo(
    () => orders.reduce((sum, order) => sum + orderNominal(order), 0),
    [orders]
  )

  function formatItems(order) {
    if (!order.order_items?.length) return '-'
    return order.order_items
      .map((item) => `${item.product_name} ×${Number(item.quantity)}`)
      .join(', ')
  }

  function totalQuantity(order) {
    if (!order.order_items?.length) return 0
    return order.order_items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    )
  }

  function openCreate() {
    setEditingOrder(null)
    setDialogOpen(true)
  }

  function openEdit(order) {
    setEditingOrder(order)
    setDialogOpen(true)
  }

  function onDialogSuccess() {
    setDialogOpen(false)
    setEditingOrder(null)
    loadOrders()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Pesanan dihapus')
      loadOrders()
    }
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Daftar Pesanan</h1>
        <Button onClick={openCreate} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pesanan
        </Button>
      </div>

      {/* Mobile FAB */}
      <Button
        onClick={openCreate}
        size="icon"
        className="sm:hidden fixed bottom-5 right-5 z-30 h-12 w-12 rounded-full shadow-lg"
      >
        <Plus className="h-5 w-5" />
      </Button>

      <div className="mb-4">
        <Input
          placeholder="Cari no. pesanan atau nama pemesan..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="max-w-sm"
        />
      </div>

      {!loading && orders.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm inline-block">
            <p className="text-xs text-muted-foreground">Total Nominal Pesanan</p>
            <p className="text-lg font-semibold text-primary">
              Rp {grandTotal.toLocaleString('id-ID')}
            </p>
          </div>

          {productCounts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Ringkasan pesanan per produk
              </p>
              <div className="flex flex-wrap gap-2">
                {productCounts.map(({ name, qty }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedProduct(name)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm cursor-pointer transition-colors hover:bg-accent hover:border-primary/30"
                  >
                    <span className="text-xs">{name}</span>
                    <span className="text-xs font-semibold text-primary">
                      {qty}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div
            className="rounded-xl border-2 border-border overflow-x-auto bg-card shadow-sm"
            data-theme-table
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">No. Pesanan</th>
                  <th className="text-left p-3 font-medium">Tanggal</th>
                  <th className="text-left p-3 font-medium">Nama Pemesan</th>
                  <th className="text-left p-3 font-medium">Pesanan</th>
                  <th className="text-left p-3 font-medium">Jumlah</th>
                  <th className="text-right p-3 font-medium">Nominal</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="w-20 p-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-muted-foreground"
                    >
                      Belum ada pesanan.
                    </td>
                  </tr>
                ) : (
                  paginated.map((order) => {
                    const status =
                      STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                    return (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="p-3 whitespace-nowrap font-mono text-xs">
                          <button
                            type="button"
                            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                            onClick={() => setDetailOrder(order)}
                          >
                            {order.order_number ?? '-'}
                          </button>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {format(new Date(order.order_date), 'dd MMM yyyy', {
                            locale: localeId,
                          })}
                        </td>
                        <td className="p-3">
                          {order.customers?.name ?? '-'}
                        </td>
                        <td className="p-3 max-w-[220px] truncate">
                          {formatItems(order)}
                        </td>
                        <td className="p-3">{totalQuantity(order)}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          Rp {orderNominal(order).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                              status.className
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="p-3 flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(order)}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(order)}
                            aria-label="Hapus"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari{' '}
                {filtered.length}
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
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <OrderEntryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingOrder(null)
        }}
        editingOrder={editingOrder}
        onSuccess={onDialogSuccess}
      />

      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent compact>
          <DialogHeader>
            <DialogTitle>Pemesan – {selectedProduct}</DialogTitle>
          </DialogHeader>
          {productCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tidak ada data.
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden flex flex-col max-h-[60vh]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Nama Pemesan</th>
                    <th className="text-right p-2 font-medium">Jumlah</th>
                    <th className="text-left p-2 font-medium">No. Pesanan</th>
                  </tr>
                </thead>
              </table>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-xs">
                  <tbody>
                    {productCustomers.map((row) => (
                      <tr key={row.customer} className="border-b last:border-0">
                        <td className="p-2">{row.customer}</td>
                        <td className="p-2 text-right font-semibold">
                          {row.qty}
                        </td>
                        <td className="p-2 font-mono text-muted-foreground">
                          {row.orders.join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <table className="w-full text-xs">
                <tfoot className="sticky bottom-0">
                  <tr className="border-t bg-muted/50">
                    <td className="p-2 font-medium">Total</td>
                    <td className="p-2 text-right font-semibold">
                      {productCustomers.reduce((s, r) => s + r.qty, 0)}
                    </td>
                    <td className="p-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detailOrder}
        onOpenChange={(open) => !open && setDetailOrder(null)}
      >
        <DialogContent compact>
          {detailOrder && (() => {
            const status = STATUS_CONFIG[detailOrder.status] ?? STATUS_CONFIG.pending
            const items = detailOrder.order_items ?? []
            const nominal = orderNominal(detailOrder)
            return (
              <>
                <DialogHeader>
                  <DialogTitle>
                    Detail Pesanan {detailOrder.order_number ?? ''}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Pemesan</p>
                    <p className="font-medium">{detailOrder.customers?.name ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', status.className)}>
                      {status.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal Pesanan</p>
                    <p className="font-medium">
                      {format(new Date(detailOrder.order_date), 'dd MMM yyyy', { locale: localeId })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Target Selesai</p>
                    <p className="font-medium">
                      {detailOrder.target_date
                        ? format(new Date(detailOrder.target_date), 'dd MMM yyyy', { locale: localeId })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Daftar Barang</p>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium">Produk</th>
                          <th className="text-right p-2 font-medium">Qty</th>
                          <th className="text-right p-2 font-medium">Harga</th>
                          <th className="text-right p-2 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => {
                          const qty = Number(item.quantity)
                          const price = Number(item.unit_price || 0)
                          return (
                            <tr key={i} className="border-b last:border-0">
                              <td className="p-2">{item.product_name}</td>
                              <td className="p-2 text-right">{qty}</td>
                              <td className="p-2 text-right whitespace-nowrap">
                                Rp {price.toLocaleString('id-ID')}
                              </td>
                              <td className="p-2 text-right whitespace-nowrap">
                                Rp {(qty * price).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/50">
                          <td className="p-2 font-medium" colSpan={3}>Total</td>
                          <td className="p-2 text-right font-semibold whitespace-nowrap">
                            Rp {nominal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus pesanan?"
        description={
          deleteTarget
            ? `Yakin hapus pesanan ${deleteTarget.order_number ?? ''} dari "${deleteTarget.customers?.name ?? '-'}"?`
            : ''
        }
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
