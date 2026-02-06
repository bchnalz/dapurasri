import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

const QR_IMAGE_PATH = '/qr-payment.png'
const LOGO_IMAGE_PATH = '/logo-dapurasri.png'

function loadImageAsDataUrl(path) {
  return fetch(path)
    .then(res => res.blob())
    .then(blob => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve('')
      reader.readAsDataURL(blob)
    }))
    .catch(() => '')
}

export function SalesInvoicePreviewDialog({ open, onOpenChange, payload, onSuccess, onBack }) {
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [logoDataUrl, setLogoDataUrl] = useState('')

  useEffect(() => {
    if (open) {
      loadImageAsDataUrl(QR_IMAGE_PATH).then(setQrDataUrl)
      loadImageAsDataUrl(LOGO_IMAGE_PATH).then(setLogoDataUrl)
    }
  }, [open])

  if (!payload) return null
  const { transactionDate, paymentMethodId, paymentMethodName, lines, total, editingTransaction, isCustomInvoice } = payload
  const validLines = lines.filter((l) => l.product_id && Number(l.quantity) > 0)
  
  // For custom invoice, use custom_price; otherwise use unit_price
  const getLinePrice = (line) => isCustomInvoice ? Number(line.custom_price) : Number(line.unit_price)
  const getLineSubtotal = (line) => Number(line.quantity) * getLinePrice(line)

  async function generateTransactionNo(dateStr) {
    const { data, error } = await supabase.rpc('generate_sales_transaction_no', {
      p_txn_date: dateStr,
    })
    if (error) {
      throw new Error(error.message)
    }
    return data
  }

  async function handleDownloadImage() {
    setGenerating(true)
    
    // Create a temporary container for rendering
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '400px'
    container.style.background = '#ffffff'
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    container.style.padding = '24px'
    container.style.boxSizing = 'border-box'
    
    // Build invoice HTML
    const formattedDate = format(new Date(transactionDate), 'dd MMMM yyyy', { locale: id })
    const formattedTotal = Number(total).toLocaleString('id-ID')
    
    let itemsHtml = ''
    validLines.forEach(l => {
      const qty = Number(l.quantity).toLocaleString('id-ID')
      const subtotal = getLineSubtotal(l).toLocaleString('id-ID')
      itemsHtml += `
        <tr>
          <td style="padding: 6px 0; color: #1f2937;">${l.product_name || '(Produk)'}</td>
          <td style="padding: 6px 0; text-align: center; color: #1f2937;">${qty}</td>
          <td style="padding: 6px 0; text-align: right; color: #1f2937;">${subtotal}</td>
        </tr>
      `
    })
    
    container.innerHTML = `
      <div style="text-align: center;">
        ${logoDataUrl ? `<img src="${logoDataUrl}" style="height: 40px; object-fit: contain; margin: 0 auto;" />` : '<h2 style="margin: 0; font-size: 24px; font-weight: bold; color: #0f766e;">Dapur Asri</h2>'}
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${formattedDate}</p>
      </div>
      
      <hr style="border: none; border-top: 1px dashed #d1d5db; margin: 8px 0;" />
      
      <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <th style="text-align: left; padding: 8px 0; font-weight: 600; color: #374151;">Item</th>
            <th style="text-align: center; padding: 8px 0; font-weight: 600; color: #374151; width: 50px;">Qty</th>
            <th style="text-align: right; padding: 8px 0; font-weight: 600; color: #374151;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div style="text-align: center; padding: 12px 0 0 0;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #374151;">Scan untuk pembayaran</p>
        ${qrDataUrl ? `<img src="${qrDataUrl}" style="width: 150px; height: 150px; object-fit: contain; margin: 0 auto;" />` : '<div style="width: 150px; height: 150px; background: #f3f4f6; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #9ca3af;">QR Code</div>'}
        <p style="margin: 8px 0 0 0; font-size: 12px; font-weight: bold; color: #1f2937;">TOTAL: Rp ${formattedTotal}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #9ca3af;">Terima kasih atas kepercayaan Anda</p>
      </div>
    `
    
    document.body.appendChild(container)
    
    try {
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })
      
      document.body.removeChild(container)
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      const link = document.createElement('a')
      link.download = `invoice-${format(new Date(transactionDate), 'yyyyMMdd')}-${Date.now()}.jpg`
      link.href = dataUrl
      link.click()
      
      toast.success('Invoice berhasil diunduh')
    } catch (err) {
      console.error('html2canvas error:', err)
      document.body.removeChild(container)
      toast.error('Gagal membuat gambar invoice: ' + (err.message || 'Unknown error'))
    } finally {
      setGenerating(false)
    }
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      if (editingTransaction) {
        const { error: errHeader } = await supabase
          .from('sales_transactions')
          .update({
            transaction_date: transactionDate,
            total: Number(total),
            payment_method_id: paymentMethodId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTransaction.id)
        if (errHeader) {
          toast.error(errHeader.message)
          setSaving(false)
          return
        }
        await supabase.from('sales_details').delete().eq('sales_transaction_id', editingTransaction.id)
        const detailsToInsert = validLines.map((l) => ({
          sales_transaction_id: editingTransaction.id,
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          subtotal: Number(l.quantity) * Number(l.unit_price),
        }))
        if (detailsToInsert.length) {
          const { error: errDetails } = await supabase.from('sales_details').insert(detailsToInsert)
          if (errDetails) {
            toast.error(errDetails.message)
            setSaving(false)
            return
          }
        }
        toast.success('Penjualan diperbarui')
      } else {
        let transactionNo
        try {
          transactionNo = await generateTransactionNo(transactionDate)
        } catch (err) {
          toast.error(err?.message ?? 'Gagal generate nomor transaksi. Pastikan fungsi generate_sales_transaction_no sudah dijalankan di Supabase.')
          setSaving(false)
          return
        }
        const { data: inserted, error: errHeader } = await supabase
          .from('sales_transactions')
          .insert({
            transaction_no: transactionNo,
            transaction_date: transactionDate,
            total: Number(total),
            payment_method_id: paymentMethodId || null,
          })
          .select('id')
          .single()
        if (errHeader || !inserted) {
          toast.error(errHeader?.message ?? 'Gagal menyimpan')
          setSaving(false)
          return
        }
        const detailsToInsert = validLines.map((l) => ({
          sales_transaction_id: inserted.id,
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          subtotal: Number(l.quantity) * Number(l.unit_price),
        }))
        const { error: errDetails } = await supabase.from('sales_details').insert(detailsToInsert)
        if (errDetails) {
          toast.error(errDetails.message)
          setSaving(false)
          return
        }
        toast.success('Penjualan disimpan')
      }
      onOpenChange(false)
      onSuccess?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preview Invoice</DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="bg-white p-5 rounded-lg border text-sm">
          {/* Header */}
          <div className="text-center">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Dapur Asri" className="h-10 object-contain mx-auto" />
            ) : (
              <h2 className="text-2xl font-bold text-teal-700">Dapur Asri</h2>
            )}
            <p className="text-xs text-gray-500 mt-1">{format(new Date(transactionDate), 'dd MMMM yyyy', { locale: id })}</p>
          </div>

          <hr className="border-dashed border-gray-300 my-2" />

          {/* Items Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-700">Item</th>
                <th className="text-center py-2 font-semibold text-gray-700 w-12">Qty</th>
                <th className="text-right py-2 font-semibold text-gray-700">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {validLines.map((l, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-gray-800">{l.product_name || '(Produk)'}</td>
                  <td className="py-1.5 text-center text-gray-800">{Number(l.quantity).toLocaleString('id-ID')}</td>
                  <td className="py-1.5 text-right text-gray-800">
                    {getLineSubtotal(l).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* QR Code Section */}
          <div className="text-center pt-3">
            <p className="text-xs text-gray-700 mb-2">Scan untuk pembayaran</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Payment" className="w-36 h-36 object-contain mx-auto" />
            ) : (
              <div className="w-36 h-36 bg-gray-100 mx-auto flex items-center justify-center text-xs text-gray-400">
                QR Code
              </div>
            )}
            {/* Total */}
            <p className="text-xs font-bold text-gray-800 mt-2">
              TOTAL: Rp {Number(total).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Terima kasih atas kepercayaan Anda</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownloadImage}
            disabled={generating}
            className="w-full sm:w-auto"
          >
            {generating ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download JPG
              </>
            )}
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            {onBack && (
              <Button type="button" variant="outline" onClick={() => { onBack(); onOpenChange(false); }} className="flex-1 sm:flex-none">
                Kembali
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              {isCustomInvoice ? 'Tutup' : 'Batal'}
            </Button>
            {!isCustomInvoice && (
              <Button onClick={handleConfirm} disabled={saving} className="flex-1 sm:flex-none">
                {saving ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  'Konfirmasi'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
