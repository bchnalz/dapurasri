export default function Reports() {
  // Keep /reports as a simple landing page for backward compatibility.
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Laporan</h2>
      <p className="text-sm text-muted-foreground">
        Pilih jenis laporan:
      </p>
      <div className="flex flex-wrap gap-2">
        <a className="underline text-sm" href="/reports/sales">Laporan Penjualan</a>
        <a className="underline text-sm" href="/reports/expenses">Laporan Pengeluaran</a>
      </div>
    </div>
  )
}
