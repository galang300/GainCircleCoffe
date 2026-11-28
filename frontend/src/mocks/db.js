// Basis data tiruan di memori. SEMUA DATA FIKTIF. Tanggal dibuat relatif terhadap hari ini (WIB) agar demo selalu terisi.
import { SLOTS, TABLE_LAYOUT } from '../lib/constants'
import { addDays, nowWIB, todayWIB } from '../lib/format'

const yymm = (d) => d.slice(2, 4) + d.slice(5, 7)
const iso = (date, h = 8, m = 0) =>
  `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07:00`

export const users = [
  {
    id: 'u1',
    name: 'Raka Pratama',
    email: 'raka@email.com',
    phone: '081200001234',
    password: 'password123',
    role: 'customer',
  },
  {
    id: 's1',
    name: 'Sari Wulandari',
    email: 'staf@gaincircle.id',
    phone: '081200005678',
    password: 'staf12345',
    role: 'staff',
  },
  {
    id: 'o1',
    name: 'Bayu Anggoro',
    email: 'owner@gaincircle.id',
    phone: '081200009012',
    password: 'owner12345',
    role: 'owner',
  },
]
export const OTP_CODE = '482913'

export function createDb() {
  const today = todayWIB()
  const tomorrow = addDays(today, 1)
  const db = {
    today,
    seq: 193,
    reservations: [],
    taken: new Set(),
    idem: new Map(),
    tableStatus: {},
    tableLog: [],
    expenses: [],
    sales: new Map(),
    adj: [],
    assistant: [],
    expSeq: 100,
    otps: new Map(),
    lookupFail: { n: 0, until: 0 },
    aiFailedOnce: false,
    users: users.map((u) => ({ ...u })),
  }
  const mk = (n, name, date, slot, table, guests, status, extra = {}) => {
    const code = `GC-${yymm(date)}-${String(n).padStart(4, '0')}`
    const created = iso(addDays(date, -2), 10, 15)
    const history = [{ at: created, text: 'Reservasi dibuat lewat website' }]
    if (status === 'check_in')
      history.push({ at: iso(date, SLOTS.find((s) => s.id === slot).start, 5), text: 'Check-in oleh Sari' })
    if (status === 'no_show')
      history.push({
        at: iso(date, SLOTS.find((s) => s.id === slot).start, 16),
        text: 'Ditandai no-show oleh Sari',
      })
    if (status === 'dibatalkan') history.push({ at: iso(addDays(date, -1), 9, 0), text: 'Dibatalkan' })
    if (status === 'selesai')
      history.push({ at: iso(date, SLOTS.find((s) => s.id === slot).end - 1, 30), text: 'Selesai' })
    db.reservations.push({
      code,
      name,
      date,
      slot,
      table,
      guests,
      status,
      purpose: 'Nongkrong',
      note: '',
      phone: `0812000${String(n).padStart(5, '0')}`,
      email: `${name
        .split(' ')[0]
        .toLowerCase()
        .replace(/[^a-z]/g, '')}@email.com`,
      userId: null,
      createdAt: created,
      history,
      ...extra,
    })
  }
  const R = { phone: users[0].phone, email: users[0].email, userId: 'u1' }
  mk(181, 'Dina Safitri', today, '17-19', 'T01', 2, 'selesai')
  mk(182, 'Komunitas Vespa SBY', today, '17-19', 'T10', 8, 'selesai', { purpose: 'Komunitas' })
  mk(183, 'Bagas Wicaksono', today, '17-19', 'T06', 4, 'selesai')
  mk(186, 'Salsa & Tim', today, '17-19', 'T09', 2, 'no_show')
  mk(187, 'Raka Pratama', today, '19-21', 'T05', 4, 'dikonfirmasi', { ...R, note: 'Kursi dekat colokan' })
  mk(184, 'Nadia Putri', today, '19-21', 'T02', 2, 'check_in')
  mk(185, 'Fikri Ramadhan', today, '19-21', 'T07', 4, 'check_in')
  mk(188, 'Event Kreatif Pacar', today, '21-23', 'T10', 8, 'dikonfirmasi', {
    purpose: 'Komunitas',
    note: 'Butuh area untuk gigs kecil',
  })
  mk(189, 'Yoga Aditya', today, '21-23', 'T03', 2, 'dibatalkan')
  const late = [
    'Ayu Lestari',
    'Bima Santoso',
    'Citra Dewi',
    'Dimas Pratama',
    'Eka Wijaya',
    'Farah Nabila',
    'Galih Saputra',
    'Hana Putri',
    'Indra Kusuma',
    'Joko Susilo',
  ]
  TABLE_LAYOUT.forEach((t, i) =>
    mk(300 + i, late[i], today, '23-00', t.id, Math.min(t.seats, 2 + (i % 3)), 'dikonfirmasi'),
  )
  ;[
    ['T02', 'Kania Rahma'],
    ['T03', 'Laras Ayu'],
    ['T07', 'Mario Dwi'],
    ['T09', 'Nadya Sari'],
  ].forEach(([t, n], i) => mk(320 + i, n, tomorrow, '19-21', t, 2, 'dikonfirmasi'))
  mk(330, 'Oka Mahendra', tomorrow, '13-15', 'T04', 4, 'dikonfirmasi')
  mk(143, 'Raka Pratama', addDays(today, -10), '19-21', 'T03', 2, 'selesai', R)
  mk(98, 'Raka Pratama', addDays(today, -20), '17-19', 'T10', 8, 'dibatalkan', { ...R, purpose: 'Komunitas' })
  mk(192, 'Raka Pratama', addDays(today, 7), '21-23', 'T08', 2, 'dikonfirmasi', R)

  const n = nowWIB()
  db.tableStatus = Object.fromEntries(TABLE_LAYOUT.map((t) => [t.id, 'kosong']))
  Object.assign(db.tableStatus, { T01: 'perlu_disiapkan', T02: 'terisi', T05: 'dipesan', T07: 'terisi' })
  const ago = (min) => new Date(Date.now() - min * 60000).toISOString()
  db.tableLog = [
    { id: 1, at: ago(6), table: 'T07', status: 'terisi', by: 'Sari' },
    { id: 2, at: ago(14), table: 'T02', status: 'terisi', by: 'Sari' },
    { id: 3, at: ago(30), table: 'T01', status: 'perlu_disiapkan', by: 'Sari' },
  ]

  // Keuangan harian 14 hari terakhir
  for (let i = 13; i >= 0; i--) {
    const d = addDays(today, -i)
    db.sales.set(d, {
      date: d,
      revenue: i === 0 ? 2600000 : 2200000 + ((i * 7919) % 9) * 100000,
      source: i % 5 === 0 ? 'Impor' : 'Manual',
    })
    const add = (cat, amount, note) =>
      db.expenses.push({ id: ++db.expSeq, date: d, category: cat, amount, note })
    if (i === 0) {
      add('Bahan baku', 1200000, 'Biji kopi 5 kg + susu')
      add('Peralatan & perawatan', 400000, 'Servis grinder')
    } else {
      add('Bahan baku', 900000 + ((i * 3571) % 7) * 100000, 'Belanja harian')
      if (i % 3 === 0) add('Marketing & event', 250000 + (i % 4) * 50000, 'Cetak flyer')
      if (i % 4 === 1) add('Sewa & utilitas', 300000, 'Listrik & air')
    }
  }
  db.expenses.sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1))
  db.assistant = []
  db.created = n
  return db
}
