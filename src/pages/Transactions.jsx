import { useState, useCallback } from 'react'
import { Plus, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SalesTable } from './Transactions/SalesTable'
import { PurchaseTable } from './Transactions/PurchaseTable'
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
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-medium">Pemasukan</h2>
            <Button
              size="icon"
              onClick={openNewSales}
              className="h-5 w-5 min-w-[1.25rem] p-0 bg-green-600 hover:bg-green-700 text-white shrink-0"
              aria-label="Tambah pemasukan"
            >
              <Plus className="h-2.5 w-2.5" />
            </Button>
            <Button
              size="icon"
              onClick={openCustomInvoice}
              className="h-5 w-5 min-w-[1.25rem] p-0 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              aria-label="Custom Invoice"
              title="Custom Invoice"
            >
              <Copy className="h-2.5 w-2.5" />
            </Button>
          </div>
          <SalesTable
            refreshKey={refreshKey}
            onViewDetail={(row) => setDetailSalesId(row.id)}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-medium">Pengeluaran</h2>
            <Button
              size="icon"
              onClick={openNewPurchase}
              variant="destructive"
              className="h-5 w-5 min-w-[1.25rem] p-0 bg-red-600 hover:bg-red-700 shrink-0"
              aria-label="Tambah pengeluaran"
            >
              <Plus className="h-2.5 w-2.5" />
            </Button>
          </div>
          <PurchaseTable
            refreshKey={refreshKey}
            onViewDetail={(row) => setDetailPurchaseId(row.id)}
          />
        </div>
      </div>

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
    </div>
  )
}
