import { SALES_MAX_BYTES, THRESHOLDS } from './constants'
import { todayWIB } from './format'

/** Parsing nominal tampilan ('1.250.000') ke angka. */
export const parseAmount = (v) =>
  Number(
    String(v ?? '')
      .replace(/[^\d,-]/g, '')
      .replace(',', '.'),
  ) || 0
/** Format nominal saat mengetik: 1250000 -> '1.250.000'. */
export const formatAmountInput = (v) => {
  const digits = String(v ?? '').replace(/\D/g, '')
  return digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : ''
}

/** Validasi file impor data sales di sisi klien (tipe dan ukuran). Validasi resmi tetap di server. */
export function validateSalesFile(file) {
  if (!file) return 'Pilih file terlebih dulu'
  const name = file.name.toLowerCase()
  if (!(name.endsWith('.csv') || name.endsWith('.xlsx')))
    return 'File tidak didukung. Gunakan .csv atau .xlsx (maks 2 MB)'
  if (file.size > SALES_MAX_BYTES) return 'Ukuran file melebihi 2 MB. Pecah menjadi beberapa file.'
  if (file.size === 0) return 'File kosong'
  return ''
}

/** Status kas dari rasio. rasio null / omzet 0 => 'belum' (jangan membuat label palsu). */
export function cashStatus(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return 'belum'
  if (ratio <= THRESHOLDS.sehat) return 'sehat'
  if (ratio <= THRESHOLDS.kritis) return 'waspada'
  return 'kritis'
}
export const futureLimit = (days = 30) => {
  const t = todayWIB()
  const d = new Date(`${t}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
