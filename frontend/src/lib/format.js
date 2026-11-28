import { TZ } from './constants'

const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const parts = (d) => {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const o = Object.fromEntries(f.map((p) => [p.type, p.value]))
  return { date: `${o.year}-${o.month}-${o.day}`, hour: +o.hour, minute: +o.minute }
}
/** Waktu sekarang di WIB: { date:'YYYY-MM-DD', hour, minute, minutes }. */
export function nowWIB(d = new Date()) {
  const p = parts(d)
  return { ...p, minutes: p.hour * 60 + p.minute }
}
export const todayWIB = () => nowWIB().date
const toUTC = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export const isValidDate = (s) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s || '') && toUTC(s).toISOString().slice(0, 10) === s
export const addDays = (s, n) => {
  const d = toUTC(s)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const diffDays = (a, b) => Math.round((toUTC(a) - toUTC(b)) / 86400000)
/** Indeks hari, Senin = 0. */
export const weekdayIndex = (s) => (toUTC(s).getUTCDay() + 6) % 7
export const startOfWeek = (s) => addDays(s, -weekdayIndex(s))
export const monthKey = (s) => s.slice(0, 7)
export const addMonths = (key, n) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}
export const monthLabel = (key) => MONTHS[+key.slice(5, 7) - 1]
export const monthLabelLong = (key) => `${MONTHS_LONG[+key.slice(5, 7) - 1]} ${key.slice(0, 4)}`

/** Grid kalender bulan: array minggu (Sen–Min), sel kosong = null. */
export function monthGrid(key) {
  const first = `${key}-01`
  const lead = weekdayIndex(first)
  const days = new Date(Date.UTC(+key.slice(0, 4), +key.slice(5, 7), 0)).getUTCDate()
  const cells = [
    ...Array(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => `${key}-${String(i + 1).padStart(2, '0')}`),
  ]
  while (cells.length % 7) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))
}

export const dayNumber = (s) => +s.slice(8, 10)
/** 'Jumat, 20 Nov 2026' */
export const formatDateLong = (s) => {
  const d = toUTC(s)
  return `${DAYS_LONG[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
/** 'JUM, 20 NOV 2026' */
export const formatDateShort = (s) => {
  const d = toUTC(s)
  return `${DAYS_LONG[d.getUTCDay()].slice(0, 3)}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`.toUpperCase()
}
/** '20 Nov' */
export const formatDayMonth = (s) => {
  const d = toUTC(s)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
/** 'SAB, 21 NOV' */
export const formatChipDate = (s) => {
  const d = toUTC(s)
  return `${DAYS_LONG[d.getUTCDay()].slice(0, 3)}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`.toUpperCase()
}
export const formatDateTimeID = (iso) => {
  const p = parts(new Date(iso))
  return `${formatDayMonth(p.date)} ${p.date.slice(0, 4)}, ${String(p.hour).padStart(2, '0')}.${String(p.minute).padStart(2, '0')}`
}
export const formatClock = (iso) => {
  const p = parts(new Date(iso))
  return `${String(p.hour).padStart(2, '0')}.${String(p.minute).padStart(2, '0')}`
}
export const formatDayMonthClock = (iso) => {
  const p = parts(new Date(iso))
  return `${formatDayMonth(p.date)}, ${String(p.hour).padStart(2, '0')}.${String(p.minute).padStart(2, '0')}`
}
export const dmyInput = (s) => (s ? s.split('-').reverse().join(' / ') : '')

const nf = new Intl.NumberFormat('id-ID')
/** 1250000 -> 'Rp 1.250.000' */
export const rupiah = (n) => `Rp ${nf.format(Math.round(Number(n) || 0))}`
/** 41500000 -> 'Rp 41,5 jt' */
export function rupiahJt(n) {
  const v = (Number(n) || 0) / 1e6
  return `Rp ${(Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)).replace('.', ',')} jt`
}
export const number = (n) => nf.format(n)
export const percent = (r, d = 0) => `${(r * 100).toFixed(d).replace('.', ',')}%`
export const juta = (n) => (n / 1e6).toFixed(1).replace(/\.0$/, '')

/** Normalisasi nomor WA Indonesia ke format 08xx. Mengembalikan '' bila tidak valid. */
export function normalizePhone(raw) {
  const d = String(raw || '').replace(/[\s\-().]/g, '')
  let n = d
  if (n.startsWith('+62')) n = '0' + n.slice(3)
  else if (n.startsWith('62')) n = '0' + n.slice(2)
  return /^08\d{8,11}$/.test(n) ? n : ''
}
export const maskPhone = (p) => (p && p.length >= 8 ? `${p.slice(0, 4)}-••••-${p.slice(-4)}` : p || '')
export const maskEmail = (e) => {
  const [u, d] = String(e || '').split('@')
  return u && d ? `${u.slice(0, 2)}***@${d}` : e
}
export const initialOf = (name) => (String(name || '?').trim()[0] || '?').toUpperCase()
export const firstName = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)[0] || ''
