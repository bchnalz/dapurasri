import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronRight as Arrow,
  Package,
  ShoppingBag,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
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
  pending: {
    label: 'Menunggu',
    className: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  },
  proses: {
    label: 'Diproses',
    className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  },
  selesai: {
    label: 'Selesai',
    className: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  },
  batal: {
    label: 'Dibatalkan',
    className: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  },
}

function useAnimatedNumber(target, duration = 500) {
  const [display, setDisplay] = useState(target)
  const rafRef = useRef(null)
  const startRef = useRef({ value: target, time: 0 })

  useEffect(() => {
    const from = display
    if (from === target) return
    startRef.current = { value: from, time: performance.now() }

    function tick(now) {
      const elapsed = now - startRef.current.time
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(
        Math.round(
          startRef.current.value + (target - startRef.current.value) * eased
        )
      )
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return display
}

export default function Orders() {
  const navigate = useNavigate()
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
      .select(
        '*, customers(name), order_items(product_id, product_name, quantity, unit_price, unit)'
      )
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
        if (
          order.order_number &&
          !map[key].orders.includes(order.order_number)
        ) {
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

  const animatedTotal = useAnimatedNumber(grandTotal)

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

  function buildSalesPayloadFromOrder(order) {
    const orderItems = order?.order_items ?? []
    if (!orderItems.length) return null

    const mergedByProduct = new Map()
    for (const item of orderItems) {
      if (!item.product_id) continue
      const key = item.product_id
      const prev = mergedByProduct.get(key)
      const qty = Number(item.quantity) || 0
      const price = Number(item.unit_price) || 0
      if (prev) {
        mergedByProduct.set(key, {
          ...prev,
          quantity: prev.quantity + qty,
        })
      } else {
        mergedByProduct.set(key, {
          product_id: key,
          product_name: item.product_name ?? '',
          quantity: qty,
          unit_price: price,
          unit: item.unit ?? '',
        })
      }
    }

    const lines = [...mergedByProduct.values()].filter((line) => line.quantity > 0)
    if (!lines.length) return null

    const total = lines.reduce(
      (sum, line) => sum + Number(line.quantity) * Number(line.unit_price),
      0
    )

    return {
      transactionDate: new Date().toISOString().split('T')[0],
      paymentMethodId: '',
      lines,
      total,
      sourceOrderId: order.id,
      sourceOrderNumber: order.order_number ?? '',
    }
  }

  function addOrderToTransaction(order) {
    const payload = buildSalesPayloadFromOrder(order)
    if (!payload) {
      toast.error('Pesanan tidak memiliki item valid untuk transaksi')
      return
    }

    navigate('/transactions', {
      state: {
        salesPrefillFromOrder: payload,
        salesPrefillNonce: Date.now(),
      },
    })
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
      {/* Sticky header */}
      <div className="sticky -top-3 md:-top-5 z-10 pb-3 -mx-3 md:-mx-5 px-3 md:px-5 -mt-3 md:-mt-5 pt-3 md:pt-5 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <h2 className="text-base font-semibold text-center mb-1">Pesanan</h2>

        {/* Desktop add button */}
        <div className="hidden sm:flex items-center justify-center mb-1.5">
          <Button
            onClick={openCreate}
            size="sm"
            className="h-7 gap-1 text-xs"
          >
            <Plus className="h-3 w-3" />
            Tambah Pesanan
          </Button>
        </div>

        {/* Total nominal */}
        {!loading && orders.length > 0 && (
          <div className="flex items-center justify-center mt-1 mb-1.5">
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground">Total Nominal</p>
              <p className="text-base font-bold tabular-nums text-primary">
                Rp {animatedTotal.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}

        {/* Product summary chips */}
        {!loading && productCounts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-2">
            {productCounts.map(({ name, qty }, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedProduct(name)}
                className="animate-chip-in flex items-center gap-1 rounded-full ring-1 ring-border bg-card/80 px-2.5 py-0.5 cursor-pointer transition-all duration-200 hover:ring-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-95"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="text-[11px]">{name}</span>
                <span className="text-[11px] font-bold tabular-nums text-primary">
                  {qty}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex justify-center">
          <Input
            placeholder="Cari no. pesanan atau nama pemesan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="max-w-sm transition-all duration-200 focus:max-w-md"
          />
        </div>
      </div>

      {/* Mobile FAB — positioned above the bottom nav bar */}
      <Button
        onClick={openCreate}
        size="icon"
        className="sm:hidden fixed bottom-24 right-4 z-30 h-12 w-12 rounded-full shadow-lg transition-transform duration-200 active:scale-95"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div
            className="hidden lg:block rounded-xl border-2 border-border overflow-x-auto bg-card shadow-sm"
            data-theme-table
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold text-xs tracking-wide">
                    No. Pesanan
                  </th>
                  <th className="text-left p-3 font-semibold text-xs tracking-wide">
                    Tanggal
                  </th>
                  <th className="text-left p-3 font-semibold text-xs tracking-wide">
                    Nama Pemesan
                  </th>
                  <th className="text-left p-3 font-semibold text-xs tracking-wide">
                    Pesanan
                  </th>
                  <th className="text-left p-3 font-semibold text-xs tracking-wide">
                    Jumlah
                  </th>
                  <th className="text-right p-3 font-semibold text-xs tracking-wide">
                    Nominal
                  </th>
                  <th className="text-left p-3 font-semibold text-xs tracking-wide">
                    Status
                  </th>
                  <th className="w-20 p-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Belum ada pesanan.
                    </td>
                  </tr>
                ) : (
                  paginated.map((order, i) => {
                    const status =
                      STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                    return (
                      <tr
                        key={order.id}
                        className="animate-row-in border-b last:border-0 transition-colors duration-150 hover:bg-muted/30"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="p-3 whitespace-nowrap">
                          <button
                            type="button"
                            className="font-mono text-xs font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:text-primary/70"
                            onClick={() => setDetailOrder(order)}
                          >
                            {order.order_number ?? '-'}
                          </button>
                        </td>
                        <td className="p-3 whitespace-nowrap tabular-nums">
                          {format(
                            new Date(order.order_date),
                            'dd MMM yyyy',
                            { locale: localeId }
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          {order.customers?.name ?? '-'}
                        </td>
                        <td className="p-3 max-w-[220px] truncate text-muted-foreground">
                          {formatItems(order)}
                        </td>
                        <td className="p-3 tabular-nums">
                          {totalQuantity(order)}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap tabular-nums font-medium">
                          Rp {orderNominal(order).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-200',
                              status.className
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(order)}
                              aria-label="Edit"
                              className="h-8 w-8 transition-colors duration-150"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => addOrderToTransaction(order)}
                              aria-label="Masuk transaksi"
                              title="Masuk transaksi"
                              className="h-8 w-8 text-green-700 hover:text-green-700 transition-colors duration-150"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(order)}
                              aria-label="Hapus"
                              className="h-8 w-8 text-destructive hover:text-destructive transition-colors duration-150"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="lg:hidden divide-y divide-border/60 overflow-hidden">
            {paginated.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">
                Belum ada pesanan.
              </p>
            )}
            {paginated.map((order, i) => {
              const status =
                STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
              return (
                <button
                  key={order.id}
                  type="button"
                  className="animate-card-in w-full text-left px-1 py-3 overflow-hidden transition-colors duration-150 active:bg-muted/40"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => setDetailOrder(order)}
                >
                  <div className="flex items-center justify-between min-w-0 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] font-medium text-primary">
                        {order.order_number ?? '-'}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      Rp {orderNominal(order).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      <span className="text-xs font-medium truncate">
                        {order.customers?.name ?? '-'}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {formatItems(order)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {format(new Date(order.order_date), 'dd MMM', {
                          locale: localeId,
                        })}
                      </span>
                      <Arrow className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 animate-section-in">
              <span className="text-xs text-muted-foreground tabular-nums">
                {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari{' '}
                {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 transition-all duration-150"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 transition-all duration-150"
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

          {/* Item count */}
          {filtered.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center tabular-nums">
              {filtered.length} pesanan
            </p>
          )}
        </>
      )}

      {/* Order entry dialog */}
      <OrderEntryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingOrder(null)
        }}
        editingOrder={editingOrder}
        onSuccess={onDialogSuccess}
      />

      {/* Product customer breakdown dialog */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent compact>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Pemesan – {selectedProduct}
            </DialogTitle>
          </DialogHeader>
          {productCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Tidak ada data.
            </p>
          ) : (
            <div className="rounded-xl border overflow-hidden flex flex-col max-h-[60vh]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2.5 font-semibold text-xs">
                      Nama Pemesan
                    </th>
                    <th className="text-right p-2.5 font-semibold text-xs">
                      Jumlah
                    </th>
                    <th className="text-left p-2.5 font-semibold text-xs">
                      No. Pesanan
                    </th>
                  </tr>
                </thead>
              </table>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-xs">
                  <tbody>
                    {productCustomers.map((row, i) => (
                      <tr
                        key={row.customer}
                        className="animate-row-in border-b last:border-0 transition-colors duration-150 hover:bg-muted/30"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="p-2.5 font-medium">{row.customer}</td>
                        <td className="p-2.5 text-right font-bold tabular-nums text-primary">
                          {row.qty}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                          {row.orders.join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <table className="w-full text-xs">
                <tfoot className="sticky bottom-0">
                  <tr className="border-t bg-primary/5">
                    <td className="p-2.5 font-semibold">Total</td>
                    <td className="p-2.5 text-right font-bold tabular-nums text-primary">
                      {productCustomers.reduce((s, r) => s + r.qty, 0)}
                    </td>
                    <td className="p-2.5" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order detail dialog */}
      <Dialog
        open={!!detailOrder}
        onOpenChange={(open) => !open && setDetailOrder(null)}
      >
        <DialogContent compact>
          {detailOrder &&
            (() => {
              const status =
                STATUS_CONFIG[detailOrder.status] ?? STATUS_CONFIG.pending
              const items = detailOrder.order_items ?? []
              const nominal = orderNominal(detailOrder)
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      Detail Pesanan {detailOrder.order_number ?? ''}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                        Pemesan
                      </p>
                      <p className="font-semibold">
                        {detailOrder.customers?.name ?? '-'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                        Status
                      </p>
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                        Tanggal Pesanan
                      </p>
                      <p className="font-medium tabular-nums">
                        {format(
                          new Date(detailOrder.order_date),
                          'dd MMM yyyy',
                          { locale: localeId }
                        )}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                        Target Selesai
                      </p>
                      <p className="font-medium tabular-nums">
                        {detailOrder.target_date
                          ? format(
                              new Date(detailOrder.target_date),
                              'dd MMM yyyy',
                              { locale: localeId }
                            )
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase mb-2">
                      Daftar Barang
                    </p>
                    <div
                      className="rounded-xl border overflow-hidden"
                      data-theme-table
                    >
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2.5 font-semibold">
                              Produk
                            </th>
                            <th className="text-right p-2.5 font-semibold">
                              Qty
                            </th>
                            <th className="text-right p-2.5 font-semibold">
                              Harga
                            </th>
                            <th className="text-right p-2.5 font-semibold">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => {
                            const qty = Number(item.quantity)
                            const price = Number(item.unit_price || 0)
                            return (
                              <tr
                                key={idx}
                                className="animate-row-in border-b last:border-0 transition-colors duration-150 hover:bg-muted/30"
                                style={{ animationDelay: `${idx * 30}ms` }}
                              >
                                <td className="p-2.5 font-medium">
                                  {item.product_name}
                                </td>
                                <td className="p-2.5 text-right tabular-nums">
                                  {qty}
                                </td>
                                <td className="p-2.5 text-right whitespace-nowrap tabular-nums">
                                  Rp {price.toLocaleString('id-ID')}
                                </td>
                                <td className="p-2.5 text-right whitespace-nowrap tabular-nums font-medium">
                                  Rp{' '}
                                  {(qty * price).toLocaleString('id-ID')}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total bar matching transaksi style */}
                  <div className="flex items-center justify-between rounded-xl bg-primary/5 ring-1 ring-primary/10 px-4 py-3">
                    <span className="text-sm font-medium text-primary/80">
                      Total
                    </span>
                    <span className="text-lg font-bold tabular-nums text-primary tracking-tight">
                      Rp {nominal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Action buttons in detail */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 transition-colors duration-150"
                      onClick={() => {
                        const target = detailOrder
                        setDetailOrder(null)
                        addOrderToTransaction(target)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Masuk Transaksi
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 transition-colors duration-150"
                      onClick={() => {
                        setDetailOrder(null)
                        openEdit(detailOrder)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 transition-colors duration-150"
                      onClick={() => {
                        setDetailOrder(null)
                        setDeleteTarget(detailOrder)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Hapus
                    </Button>
                  </div>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
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
