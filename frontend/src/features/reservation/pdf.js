import QRCode from 'qrcode'
import { slotById } from '../../lib/constants'
import { formatDateLong } from '../../lib/format'

/** Unduh e-ticket PDF di klien. jsPDF dimuat malas (hanya saat tombol diklik). */
export async function downloadTicketPdf(res) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: [150, 100] })
  doc.setFillColor(253, 217, 35)
  doc.rect(0, 0, 150, 100, 'F')
  doc.setDrawColor(23, 18, 16)
  doc.setLineWidth(0.8)
  doc.rect(3, 3, 144, 94)
  doc.setTextColor(23, 18, 16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('GAIN CIRCLE COFFEE · E-TICKET', 10, 13)
  doc.setFontSize(64)
  doc.text(res.table, 10, 48)
  doc.setFontSize(9)
  doc.text('KODE RESERVASI', 10, 58)
  doc.setFontSize(16)
  doc.text(res.code, 10, 66)
  const rows = [
    ['NAMA', res.name],
    ['TANGGAL', formatDateLong(res.date)],
    ['JAM', `${slotById(res.slot)?.range} WIB`],
    ['TAMU', `${res.guests} orang · meja ${res.table}`],
  ]
  rows.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(k, 62, 24 + i * 13)
    doc.setFontSize(11)
    doc.text(String(v), 62, 30 + i * 13)
  })
  const qr = await QRCode.toDataURL(res.code, { margin: 1, width: 240 })
  doc.addImage(qr, 'PNG', 108, 64, 30, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Tunjukkan e-ticket ke kasir. Meja ditahan 15 menit dari jam mulai.', 10, 82)
  doc.text('Pesan menu langsung di kasir. Tidak ada pembayaran online.', 10, 87)
  doc.save(`e-ticket-${res.code}.pdf`)
}
