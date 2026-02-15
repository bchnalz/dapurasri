import { useState, useCallback } from 'react'
import { Plus, Copy, TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TransactionList } from './Transactions/TransactionList'
import { SalesEntryDialog } from './Transactions/SalesEntryDialog'
import { SalesInvoicePreviewDialog } from './Transactions/SalesInvoicePreviewDialog'
import { SalesDetailDialog } from './Transactions/SalesDetailDialog'
import { PurchaseEntryDialog } from './Transactions/PurchaseEntryDialog'
import { PurchaseDetailDialog } from './Transactions/PurchaseDetailDialog'
import { CustomInvoiceDialog } from './Transactions/CustomInvoiceDialog'

export default function Transactions() {
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
      <Card className="border border-border/40">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-4 w-4" />
            </span>
            <CardTitle>Transaksi</CardTitle>
          </div>
          <div className="hidden lg:flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={openNewSales}
              className="h-7 gap-1 bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              <Plus className="h-3 w-3" />
              Pemasukan
            </Button>
            <Button
              size="sm"
              onClick={openNewPurchase}
              className="h-7 gap-1 bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              <Plus className="h-3 w-3" />
              Pengeluaran
            </Button>
            <Button
              size="sm"
              onClick={openCustomInvoice}
              className="h-7 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              <Copy className="h-3 w-3" />
              Custom
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <TransactionList
            refreshKey={refreshKey}
            onViewSalesDetail={(row) => setDetailSalesId(row.id)}
            onViewPurchaseDetail={(row) => setDetailPurchaseId(row.id)}
          />
        </CardContent>
      </Card>

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
      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 lg:hidden">
        <Popover open={fabOpen} onOpenChange={setFabOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-all duration-300 active:scale-95"
              aria-label="Tambah Data"
            >
              <Plus className={`h-6 w-6 transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" sideOffset={12} className="w-52 p-2 rounded-2xl border-border/50 shadow-xl">
            <div className="flex flex-col gap-1">
              <button
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-green-50 active:bg-green-100 text-foreground"
                onClick={() => { setFabOpen(false); openNewSales() }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <TrendingUp className="h-4 w-4" />
                </span>
                Pemasukan
              </button>
              <button
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-red-50 active:bg-red-100 text-foreground"
                onClick={() => { setFabOpen(false); openNewPurchase() }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                  <TrendingDown className="h-4 w-4" />
                </span>
                Pengeluaran
              </button>
              <button
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-blue-50 active:bg-blue-100 text-foreground"
                onClick={() => { setFabOpen(false); openCustomInvoice() }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
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
