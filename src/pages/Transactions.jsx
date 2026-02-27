import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Copy, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TransactionList } from './Transactions/TransactionList'
import { SalesEntryDialog } from './Transactions/SalesEntryDialog'
import { SalesInvoicePreviewDialog } from './Transactions/SalesInvoicePreviewDialog'
import { SalesDetailDialog } from './Transactions/SalesDetailDialog'
import { PurchaseEntryDialog } from './Transactions/PurchaseEntryDialog'
import { PurchaseDetailDialog } from './Transactions/PurchaseDetailDialog'
import { CustomInvoiceDialog } from './Transactions/CustomInvoiceDialog'

export default function Transactions() {
  const location = useLocation()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [salesEntryOpen, setSalesEntryOpen] = useState(false)
  const [salesPreviewOpen, setSalesPreviewOpen] = useState(false)
  const [salesPreviewPayload, setSalesPreviewPayload] = useState(null)
  const [salesReturnPayload, setSalesReturnPayload] = useState(null)
  const [editingSales, setEditingSales] = useState(null)
  const [detailSalesId, setDetailSalesId] = useState(null)
  const [purchaseEntryOpen, setPurchaseEntryOpen] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState(null)
  const [detailPurchaseId, setDetailPurchaseId] = useState(null)
  const [customInvoiceOpen, setCustomInvoiceOpen] = useState(false)
  const [customInvoiceReturnPayload, setCustomInvoiceReturnPayload] = useState(null)
  const [fabOpen, setFabOpen] = useState(false)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    const prefill = location.state?.salesPrefillFromOrder
    if (!prefill) return

    setSalesPreviewOpen(false)
    setSalesPreviewPayload(null)
    setEditingSales(null)
    setSalesReturnPayload(prefill)
    setSalesEntryOpen(true)

    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  function openNewSales() {
    setEditingSales(null)
    setSalesEntryOpen(true)
  }

  function openEditSales(row) {
    setEditingSales(row)
    setSalesEntryOpen(true)
  }

  function onSalesGenerateInvoice(payload) {
    setSalesEntryOpen(false)
    setSalesPreviewPayload(payload)
    setSalesPreviewOpen(true)
  }

  function onSalesConfirm() {
    setSalesPreviewOpen(false)
    setSalesPreviewPayload(null)
    setSalesReturnPayload(null)
    setEditingSales(null)
    refresh()
  }

  function onSalesPreviewBack() {
    if (!salesPreviewPayload) return
    setSalesPreviewOpen(false)
    setSalesReturnPayload(salesPreviewPayload)
    setEditingSales(salesPreviewPayload.editingTransaction ?? null)
    setSalesEntryOpen(true)
  }

  function openNewPurchase() {
    setEditingPurchase(null)
    setPurchaseEntryOpen(true)
  }

  function openEditPurchase(row) {
    setEditingPurchase(row)
    setPurchaseEntryOpen(true)
  }

  function onPurchaseSaved() {
    setPurchaseEntryOpen(false)
    setEditingPurchase(null)
    refresh()
  }

  function openCustomInvoice() {
    setCustomInvoiceOpen(true)
  }

  function onCustomInvoiceGenerateInvoice(payload) {
    setCustomInvoiceOpen(false)
    setSalesPreviewPayload(payload)
    setSalesPreviewOpen(true)
  }

  function onCustomInvoicePreviewBack() {
    if (!salesPreviewPayload?.isCustomInvoice) return
    setSalesPreviewOpen(false)
    setCustomInvoiceReturnPayload(salesPreviewPayload)
    setCustomInvoiceOpen(true)
  }

  return (
    <div>
      <TransactionList
        refreshKey={refreshKey}
        onViewSalesDetail={(row) => setDetailSalesId(row.id)}
        onViewPurchaseDetail={(row) => setDetailPurchaseId(row.id)}
        onAddSales={openNewSales}
        onAddPurchase={openNewPurchase}
        onCustomInvoice={openCustomInvoice}
      />

      <SalesEntryDialog
        open={salesEntryOpen}
        onOpenChange={(open) => {
          setSalesEntryOpen(open)
          if (!open) setSalesReturnPayload(null)
        }}
        editingTransaction={editingSales}
        returnPayload={salesReturnPayload}
        onConsumeReturnPayload={() => setSalesReturnPayload(null)}
        onSuccess={onSalesGenerateInvoice}
      />
      <SalesInvoicePreviewDialog
        open={salesPreviewOpen}
        onOpenChange={setSalesPreviewOpen}
        payload={salesPreviewPayload}
        onSuccess={onSalesConfirm}
        onBack={salesPreviewPayload?.isCustomInvoice ? onCustomInvoicePreviewBack : onSalesPreviewBack}
      />
      <CustomInvoiceDialog
        open={customInvoiceOpen}
        onOpenChange={(open) => {
          setCustomInvoiceOpen(open)
          if (!open) setCustomInvoiceReturnPayload(null)
        }}
        returnPayload={customInvoiceReturnPayload}
        onConsumeReturnPayload={() => setCustomInvoiceReturnPayload(null)}
        onSuccess={onCustomInvoiceGenerateInvoice}
      />
      <PurchaseEntryDialog
        open={purchaseEntryOpen}
        onOpenChange={setPurchaseEntryOpen}
        editingRow={editingPurchase}
        onSuccess={onPurchaseSaved}
      />
      <SalesDetailDialog
        open={!!detailSalesId}
        onOpenChange={(open) => !open && setDetailSalesId(null)}
        transactionId={detailSalesId}
        onEdit={(row) => {
          openEditSales(row)
          setDetailSalesId(null)
        }}
        onDeleted={() => {
          setDetailSalesId(null)
          refresh()
        }}
      />
      <PurchaseDetailDialog
        open={!!detailPurchaseId}
        onOpenChange={(open) => !open && setDetailPurchaseId(null)}
        transactionId={detailPurchaseId}
        onEdit={(row) => {
          openEditPurchase(row)
          setDetailPurchaseId(null)
        }}
        onDeleted={() => {
          setDetailPurchaseId(null)
          refresh()
        }}
      />

      {/* Mobile FAB backdrop */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] fab-backdrop lg:hidden"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Mobile FAB */}
      <div className="fixed bottom-24 right-4 z-50 lg:hidden">
        <Popover open={fabOpen} onOpenChange={setFabOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className={`h-12 w-12 rounded-full text-white transition-all duration-300 active:scale-95 ${
                fabOpen
                  ? 'border border-red-700 bg-red-600 shadow-[0_8px_24px_rgba(220,38,38,0.35)] hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600'
                  : 'bg-primary text-primary-foreground shadow-xl hover:bg-primary/90'
              }`}
              aria-label="Tambah Data"
            >
              <Plus className={`h-5 w-5 transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" sideOffset={12} className="w-52 p-2 rounded-2xl border-border/50 shadow-xl">
            <div className="flex flex-col gap-1">
              <button
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-emerald-500/10 active:bg-emerald-500/15 dark:hover:bg-emerald-400/15 dark:active:bg-emerald-400/20"
                onClick={() => { setFabOpen(false); openNewSales() }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <TrendingUp className="h-4 w-4" />
                </span>
                Pemasukan
              </button>
              <button
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-rose-500/10 active:bg-rose-500/15 dark:hover:bg-rose-400/15 dark:active:bg-rose-400/20"
                onClick={() => { setFabOpen(false); openNewPurchase() }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                  <TrendingDown className="h-4 w-4" />
                </span>
                Pengeluaran
              </button>
              <button
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-sky-500/10 active:bg-sky-500/15 dark:hover:bg-sky-400/15 dark:active:bg-sky-400/20"
                onClick={() => { setFabOpen(false); openCustomInvoice() }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                  <Copy className="h-4 w-4" />
                </span>
                Custom Invoice
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
