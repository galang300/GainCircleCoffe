// Konstanta domain Gain Circle. Sumber: KonteksMaster v2.1 (bagian 5, 8, 11) dan PromptMaster.
export const ENV = {
  apiBase: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'Gain Circle Reservasi',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  mainSite: import.meta.env.VITE_MAIN_SITE_URL || 'https://gaincoffeecircle.com',
  instagram: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/gain.circle/',
  maps:
    import.meta.env.VITE_MAPS_URL ||
    'https://www.google.com/maps/search/?api=1&query=Gain+Circle+Coffee+Jl.+Pacar+No.+2+Surabaya',
}

export const TZ = 'Asia/Jakarta'
export const OPEN_TEXT = '07.00 – 00.00 WIB'
export const HOLD_MINUTES = 15 // meja ditahan 15 menit dari awal slot, lalu no-show
export const MAX_GUESTS = 8
export const ADDRESS = 'Jl. Pacar No. 2, Surabaya'

/** 9 slot, 2 jam per sesi, buka 07.00–00.00 (keputusan final #1). */
export const SLOTS = [
  [7, 9],
  [9, 11],
  [11, 13],
  [13, 15],
  [15, 17],
  [17, 19],
  [19, 21],
  [21, 23],
  [23, 24],
].map(([start, end]) => {
  const pad = (n) => String(n % 24).padStart(2, '0')
  return {
    id: `${pad(start)}-${pad(end)}`,
    start,
    end,
    label: `${pad(start)}.00–${pad(end)}.00`,
    range: `${pad(start)}.00 – ${pad(end)}.00`,
    short: `${pad(start)}.00`,
  }
})
export const slotById = (id) => SLOTS.find((s) => s.id === id)

export const CATEGORIES = [
  'Bahan baku',
  'Gaji & upah',
  'Sewa & utilitas',
  'Marketing & event',
  'Peralatan & perawatan',
  'Lainnya',
]
export const CATEGORY_COLORS = {
  'Bahan baku': '#CA5C34',
  'Gaji & upah': '#171210',
  'Sewa & utilitas': '#2649D2',
  'Marketing & event': '#FDD923',
  'Peralatan & perawatan': '#75F237',
  Lainnya: '#D5CAB4',
}

/** Ambang status kas: rasio pengeluaran / omzet (keputusan final #4; menunggu validasi owner). */
export const THRESHOLDS = { sehat: 0.7, kritis: 0.9 }
export const PURPOSES = ['Nongkrong', 'Komunitas', 'Ulang tahun', 'Meeting / kerja']

export const RES_STATUS = {
  dikonfirmasi: { label: 'Dikonfirmasi', bg: '#FDD923', fg: '#171210' },
  check_in: { label: 'Check-in', bg: '#75F237', fg: '#171210' },
  selesai: { label: 'Selesai', bg: '#D5CAB4', fg: '#171210' },
  no_show: { label: 'No-show', bg: '#E01E78', fg: '#ffffff' },
  dibatalkan: { label: 'Dibatalkan', bg: '#D5CAB4', fg: '#171210' },
}
export const CASH_STATUS = {
  sehat: { label: 'Sehat', bg: '#75F237', fg: '#171210' },
  waspada: { label: 'Waspada', bg: '#FDD923', fg: '#171210' },
  kritis: { label: 'Kritis', bg: '#FC2685', fg: '#171210' },
  belum: { label: 'Belum ada data', bg: '#D5CAB4', fg: '#171210' },
}
/** Status fisik meja (dipakai staf). Warna sesuai peta status meja di desain. */
export const TABLE_STATUS = {
  kosong: { label: 'Kosong', bg: '#F2EDDE', fg: '#171210', border: '#171210' },
  dipesan: { label: 'Dipesan', bg: '#CA5C34', fg: '#171210', border: '#171210' },
  terisi: { label: 'Terisi', bg: '#171210', fg: '#75F237', border: '#171210' },
  perlu_disiapkan: { label: 'Perlu disiapkan', bg: '#FDD923', fg: '#171210', border: '#171210' },
  dipilih: { label: 'Dipilih', bg: '#75F237', fg: '#171210', border: '#171210' },
}

/** Denah: [id, cx, cy, bentuk(c=bulat, r=persegi), w, h, kursi, area]. Koordinat dari desain 02/08. */
export const FLOOR = { width: 640, height: 430 }
export const TABLE_LAYOUT = [
  ['T01', 80, 150, 'c', 44, 44, 2, 'Sisi kiri'],
  ['T02', 80, 250, 'c', 44, 44, 2, 'Sisi kiri'],
  ['T03', 80, 350, 'c', 44, 44, 2, 'Sisi kiri'],
  ['T04', 230, 160, 'r', 96, 64, 4, 'Area tengah'],
  ['T05', 230, 290, 'r', 96, 64, 4, 'Area tengah'],
  ['T06', 390, 160, 'r', 96, 64, 4, 'Area tengah'],
  ['T07', 390, 290, 'r', 96, 64, 4, 'Area tengah'],
  ['T08', 545, 150, 'c', 44, 44, 2, 'Sisi kanan'],
  ['T09', 545, 250, 'c', 44, 44, 2, 'Sisi kanan'],
  ['T10', 500, 360, 'r', 190, 48, 8, 'Meja komunal'],
].map(([id, x, y, shape, w, h, seats, area]) => ({ id, x, y, shape, w, h, seats, area }))

export const ROLES = { customer: 'customer', staff: 'staff', owner: 'owner' }
export const OTP_LENGTH = 6
export const OTP_RESEND_SECONDS = 60
export const SALES_MAX_BYTES = 2 * 1024 * 1024
