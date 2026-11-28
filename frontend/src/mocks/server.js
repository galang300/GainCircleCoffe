import Papa from 'papaparse'
import { createDb, OTP_CODE } from './db'
import * as cash from './cash'
import {
  CATEGORIES,
  MAX_GUESTS,
  PURPOSES,
  SLOTS,
  TABLE_LAYOUT,
  TABLE_STATUS,
  slotById,
} from '../lib/constants'
import { addDays, isValidDate, maskEmail, normalizePhone, nowWIB, todayWIB } from '../lib/format'
import { canMarkNoShow, isSlotPast } from '../lib/slots'
import { cashStatus, futureLimit } from '../lib/validators'

let db = createDb()
export const resetMockDb = () => {
  db = createDb()
}

class Fail extends Error {
  constructor(status, code, message, extra = {}) {
    super(message)
    this.status = status
    this.code = code
    this.extra = extra
  }
}
const ok = (data, status = 200) => ({ status, body: { success: true, data } })
const BLOCKING = ['dikonfirmasi', 'check_in', 'selesai']
const blocked = (date, slot, table) =>
  db.reservations.some(
    (r) => r.date === date && r.slot === slot && r.table === table && BLOCKING.includes(r.status),
  )
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role })
const first = (n) => n.split(' ')[0]
const iso = () => new Date().toISOString()

function currentSlotId() {
  const n = nowWIB()
  return SLOTS.find((s) => n.minutes >= s.start * 60 && n.minutes < s.end * 60)?.id
}
function availability(date, slotId) {
  const live = date === todayWIB() && slotId === currentSlotId()
  return TABLE_LAYOUT.map((t) => {
    const phys = db.tableStatus[t.id]
    const busy = live && (phys === 'terisi' || phys === 'perlu_disiapkan')
    return { id: t.id, status: blocked(date, slotId, t.id) || busy ? 'booked' : 'free' }
  })
}

const needAuth = (ctx, roles) => {
  if (!ctx.user) throw new Fail(401, 'UNAUTHORIZED', 'Sesi berakhir. Masuk lagi untuk melanjutkan.')
  if (roles && !roles.includes(ctx.user.role))
    throw new Fail(403, 'FORBIDDEN', 'Akunmu tidak punya akses ke halaman ini.')
}
const staffOnly = (c) => needAuth(c, ['staff', 'owner'])
const ownerOnly = (c) => needAuth(c, ['owner'])
const resItem = (r) => ({
  code: r.code,
  name: r.name,
  table: r.table,
  slot: r.slot,
  date: r.date,
  guests: r.guests,
  status: r.status,
})
const resFull = (r) => ({
  ...resItem(r),
  purpose: r.purpose,
  note: r.note,
  phone: r.phone,
  email: r.email,
  history: r.history,
})
const paginate = (arr, page, size) => {
  const p = Math.max(1, +page || 1)
  const s = +size || 10
  return {
    items: arr.slice((p - 1) * s, p * s),
    page: p,
    page_size: s,
    total: arr.length,
    total_pages: Math.max(1, Math.ceil(arr.length / s)),
  }
}
const slotIdx = (id) => SLOTS.findIndex((s) => s.id === id)
const byTime = (a, b) =>
  a.date === b.date
    ? slotIdx(a.slot) - slotIdx(b.slot) || a.code.localeCompare(b.code)
    : a.date < b.date
      ? -1
      : 1

/* ---------- Auth ---------- */
function issueOtp(email) {
  db.otps.set(email.toLowerCase(), { attempts: 3, expires: Date.now() + 5 * 60000 })
}
const challenge = (email) => ({ email_masked: maskEmail(email), resend_in: 60, demo_hint: OTP_CODE })
function verify(ctx, scope) {
  const email = String(ctx.body.email || '').toLowerCase()
  const o = db.otps.get(email)
  const u = db.users.find((x) => x.email === email)
  if (!o || !u) throw new Fail(410, 'OTP_EXPIRED', 'Kode kedaluwarsa. Kirim ulang kode.')
  if (Date.now() > o.expires) throw new Fail(410, 'OTP_EXPIRED', 'Kode kedaluwarsa. Kirim ulang kode.')
  if (o.attempts <= 0) throw new Fail(429, 'OTP_TOO_MANY', 'Percobaan habis. Kirim ulang kode baru.')
  if (String(ctx.body.code) !== OTP_CODE) {
    o.attempts -= 1
    if (o.attempts <= 0) throw new Fail(429, 'OTP_TOO_MANY', 'Percobaan habis. Kirim ulang kode baru.')
    throw new Fail(422, 'OTP_INVALID', 'Kode salah.', { meta: { attempts_left: o.attempts } })
  }
  db.otps.delete(email)
  if ((scope === 'staff') === (u.role === 'customer'))
    throw new Fail(403, 'FORBIDDEN', 'Akun ini tidak bisa masuk lewat pintu ini.')
  return ok({ token: `tk.${u.id}`, user: publicUser(u) })
}
const login = (scope) => (ctx) => {
  const { email = '', password = '' } = ctx.body
  const u = db.users.find(
    (x) =>
      x.email === String(email).toLowerCase() &&
      x.password === password &&
      (scope === 'staff' ? x.role !== 'customer' : x.role === 'customer'),
  )
  if (!u) throw new Fail(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah')
  issueOtp(u.email)
  return ok(challenge(u.email))
}

/* ---------- Impor sales ---------- */
const readText = (f) =>
  f.text
    ? f.text()
    : new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result)
        r.onerror = rej
        r.readAsText(f)
      })
async function parseSales(file) {
  if (!file || typeof file === 'string') throw new Fail(422, 'FILE_INVALID', 'File tidak ditemukan.')
  const name = (file.name || '').toLowerCase()
  let rows = []
  try {
    if (name.endsWith('.csv'))
      rows = Papa.parse(await readText(file), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
      }).data
    else if (name.endsWith('.xlsx')) {
      const { readSheet } = await import('read-excel-file/browser')
      const arr = await readSheet(file)
      const head = (arr[0] || []).map((h) => String(h).trim().toLowerCase())
      rows = arr.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])))
    } else throw new Fail(422, 'FILE_INVALID', 'File tidak didukung. Gunakan .csv atau .xlsx')
  } catch (e) {
    if (e instanceof Fail) throw e
    throw new Fail(422, 'FILE_INVALID', 'File tidak bisa dibaca. Pastikan formatnya benar.')
  }
  const sample = rows[0] || {}
  const dk = ['tanggal', 'date'].find((k) => k in sample)
  const vk = ['total_omzet', 'omzet', 'revenue'].find((k) => k in sample)
  if (!dk || !vk) throw new Fail(422, 'FILE_INVALID', 'Kolom wajib tidak ditemukan: tanggal, total_omzet.')
  const seen = new Set()
  const valid = []
  const errors = []
  const today = todayWIB()
  rows.forEach((r, i) => {
    const row = i + 2
    let d = r[dk]
    if (d instanceof Date) d = d.toISOString().slice(0, 10)
    d = String(d ?? '').trim()
    const raw = r[vk]
    const text = String(raw ?? '')
      .replace(/[^\d.,-]/g, '')
      .replace(/\.(?=\d{3}\b)/g, '')
      .replace(',', '.')
    // Teks tanpa satu pun angka (mis. "abc") bukan 0: itu "bukan angka".
    const value = typeof raw === 'number' ? raw : text === '' ? NaN : Number(text)
    const bad = (reason) => errors.push({ row, date: d, value: raw ?? '', reason })
    if (!isValidDate(d)) return bad('Format tanggal salah (gunakan YYYY-MM-DD)')
    if (d > today) return bad('Tanggal di masa depan')
    if (!Number.isFinite(value)) return bad('Nilai omzet bukan angka')
    if (value <= 0) return bad('Nilai omzet harus lebih dari 0')
    if (seen.has(d)) return bad('Tanggal ganda di dalam file')
    seen.add(d)
    valid.push({ row, date: d, value, overwrite: db.sales.has(d) })
  })
  return { valid, errors }
}
function upsertSales(date, revenue, source) {
  const old = db.sales.get(date)?.revenue || 0
  db.sales.set(date, { date, revenue, source })
  db.adj.push({ kind: 'in', date, amount: revenue - old })
}
const outOn = (d) => db.expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0)

/* ---------- Tabel rute ---------- */
const routes = [
  [
    'POST',
    '/auth/register',
    (c) => {
      const { name, email, phone, password } = c.body
      const fields = {}
      if (!name || name.trim().length < 2) fields.name = 'Nama minimal 2 huruf'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email || '')) fields.email = 'Format email tidak valid'
      if (!normalizePhone(phone)) fields.phone = 'Format nomor HP tidak valid. Contoh: 0812xxxxxxxx'
      if ((password || '').length < 8) fields.password = 'Minimal 8 karakter'
      if (Object.keys(fields).length)
        throw new Fail(422, 'VALIDATION', 'Ada isian yang perlu diperbaiki.', { fields })
      if (db.users.some((u) => u.email === email.toLowerCase()))
        throw new Fail(409, 'EMAIL_ALREADY_REGISTERED', 'Email sudah terdaftar')
      db.users.push({
        id: `u${db.users.length + 1}`,
        name: name.trim(),
        email: email.toLowerCase(),
        phone: normalizePhone(phone),
        password,
        role: 'customer',
      })
      issueOtp(email)
      return ok(challenge(email), 201)
    },
  ],
  ['POST', '/auth/login', login('customer')],
  ['POST', '/staff/auth/login', login('staff')],
  ['POST', '/auth/otp/verify', (c) => verify(c, 'customer')],
  ['POST', '/staff/auth/otp/verify', (c) => verify(c, 'staff')],
  [
    'POST',
    '/auth/otp/resend',
    (c) => {
      issueOtp(c.body.email || '')
      return ok({ resend_in: 60 })
    },
  ],
  ['POST', '/auth/logout', () => ok({})],
  [
    'GET',
    '/auth/me',
    (c) => {
      needAuth(c)
      return ok(publicUser(c.user))
    },
  ],

  ['GET', '/tables', () => ok(TABLE_LAYOUT)],
  [
    'GET',
    '/availability',
    (c) => {
      const { date, slot } = c.query
      if (!isValidDate(date)) throw new Fail(422, 'VALIDATION', 'Tanggal tidak valid.')
      if (slot) {
        if (!slotById(slot)) throw new Fail(422, 'VALIDATION', 'Slot tidak valid.')
        const t = availability(date, slot)
        return ok({ date, slot, tables: t, full: t.every((x) => x.status !== 'free') })
      }
      return ok({
        date,
        slots: SLOTS.map((s) => ({
          slot: s.id,
          total: TABLE_LAYOUT.length,
          free: availability(date, s.id).filter((x) => x.status === 'free').length,
        })),
      })
    },
  ],
  [
    'POST',
    '/reservations',
    (c) => {
      needAuth(c, ['customer'])
      const b = c.body
      const key = c.headers['idempotency-key']
      if (key && db.idem.has(key)) return db.idem.get(key)
      const fields = {}
      const slot = slotById(b.slot)
      const table = TABLE_LAYOUT.find((t) => t.id === b.table_id)
      if (!isValidDate(b.date) || b.date < todayWIB() || b.date > futureLimit(30))
        fields.date = 'Tanggal harus hari ini sampai 30 hari ke depan'
      if (!slot) fields.slot = 'Slot tidak valid'
      if (!table) fields.table_id = 'Meja tidak valid'
      if (!Number.isInteger(b.guests) || b.guests < 1 || b.guests > MAX_GUESTS)
        fields.guests = `Jumlah tamu 1–${MAX_GUESTS}`
      else if (table && b.guests > table.seats) fields.guests = `Maks. ${table.seats} untuk meja ${table.id}`
      if (!PURPOSES.includes(b.purpose)) fields.purpose = 'Keperluan tidak valid'
      if ((b.note || '').length > 200) fields.note = 'Catatan maks. 200 karakter'
      if (Object.keys(fields).length)
        throw new Fail(422, 'VALIDATION', 'Ada isian yang perlu diperbaiki.', { fields })
      if (isSlotPast(b.date, slot))
        throw new Fail(422, 'SLOT_PAST', 'Slot ini sudah lewat. Pilih slot berikutnya.')
      const k = `${b.date}|${b.slot}`
      if (b.table_id === 'T04' && !db.taken.has(k)) {
        // simulasi pemesan lain menyambar meja (hanya mode contoh)
        db.taken.add(k)
        db.reservations.push({
          code: `GC-${b.date.slice(2, 4)}${b.date.slice(5, 7)}-${String(db.seq++).padStart(4, '0')}`,
          name: 'Pemesan lain',
          date: b.date,
          slot: b.slot,
          table: 'T04',
          guests: 2,
          status: 'dikonfirmasi',
          purpose: 'Nongkrong',
          note: '',
          phone: '081200000000',
          email: 'lain@email.com',
          userId: null,
          createdAt: iso(),
          history: [{ at: iso(), text: 'Reservasi dibuat lewat website' }],
        })
        throw new Fail(409, 'TABLE_ALREADY_BOOKED', 'Meja sudah dipesan. Pilih meja atau jam lain.')
      }
      if (blocked(b.date, b.slot, b.table_id))
        throw new Fail(409, 'TABLE_ALREADY_BOOKED', 'Meja sudah dipesan. Pilih meja atau jam lain.')
      const u = c.user
      const r = {
        code: `GC-${b.date.slice(2, 4)}${b.date.slice(5, 7)}-${String(db.seq++).padStart(4, '0')}`,
        name: u.name,
        phone: u.phone,
        email: u.email,
        userId: u.id,
        date: b.date,
        slot: b.slot,
        table: b.table_id,
        guests: b.guests,
        status: 'dikonfirmasi',
        purpose: b.purpose,
        note: b.note || '',
        createdAt: iso(),
        history: [{ at: iso(), text: 'Reservasi dibuat lewat website' }],
      }
      db.reservations.push(r)
      const res = ok(resItem(r), 201)
      if (key) db.idem.set(key, res)
      return res
    },
  ],
  [
    'GET',
    '/reservations/mine',
    (c) => {
      needAuth(c, ['customer'])
      const t = todayWIB()
      const mine = db.reservations.filter((r) => r.userId === c.user.id)
      const up = (r) => ['dikonfirmasi', 'check_in'].includes(r.status) && r.date >= t
      const list =
        c.query.status === 'history'
          ? mine.filter((r) => !up(r)).sort((a, b) => -byTime(a, b))
          : mine.filter(up).sort(byTime)
      const p = paginate(list.map(resItem), c.query.page, 5)
      return ok(p)
    },
  ],
  [
    'GET',
    '/reservations/lookup',
    (c) => {
      if (Date.now() < db.lookupFail.until)
        throw new Fail(429, 'RATE_LIMITED', 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.', {
          retry_after: Math.ceil((db.lookupFail.until - Date.now()) / 1000),
        })
      const r = db.reservations.find(
        (x) => x.code === String(c.query.code).toUpperCase() && x.phone.slice(-4) === String(c.query.phone4),
      )
      if (!r) {
        db.lookupFail.n += 1
        if (db.lookupFail.n >= 5) {
          db.lookupFail = { n: 0, until: Date.now() + 30000 }
        }
        throw new Fail(404, 'TICKET_NOT_FOUND', 'Tiket tidak ditemukan. Periksa kode dan 4 digit WhatsApp.')
      }
      db.lookupFail.n = 0
      return ok(resItem(r))
    },
  ],
  [
    'GET',
    '/reservations/:code',
    (c) => {
      needAuth(c, ['customer'])
      const r = db.reservations.find((x) => x.code === c.params.code && x.userId === c.user.id)
      if (!r) throw new Fail(404, 'NOT_FOUND', 'Tiket tidak ditemukan.')
      return ok(resItem(r))
    },
  ],

  [
    'GET',
    '/staff/reservations',
    (c) => {
      staffOnly(c)
      const { date = todayWIB(), status, q, page, page_size } = c.query
      const day = db.reservations.filter((r) => r.date === date)
      let list = day
        .filter(
          (r) =>
            (!status || r.status === status) &&
            (!q || `${r.name} ${r.code}`.toLowerCase().includes(String(q).toLowerCase())),
        )
        .sort(byTime)
      const fullSlots = SLOTS.filter((s) => TABLE_LAYOUT.every((t) => blocked(date, s.id, t.id)))
      const today = date === todayWIB()
      const kpi = {
        total: day.length,
        guests: day.filter((r) => r.status !== 'dibatalkan').reduce((s, r) => s + r.guests, 0),
        occupied: today ? Object.values(db.tableStatus).filter((v) => v === 'terisi').length : 0,
        tables: TABLE_LAYOUT.length,
        full_slots: fullSlots.length,
        full_slot_labels: fullSlots.map((s) => s.short),
        delta: today ? day.length - 15 : null,
      }
      return ok({ ...paginate(list.map(resItem), page, page_size || 9), kpi })
    },
  ],
  [
    'GET',
    '/staff/reservations/:code',
    (c) => {
      staffOnly(c)
      const r = db.reservations.find((x) => x.code === c.params.code)
      if (!r) throw new Fail(404, 'NOT_FOUND', 'Reservasi tidak ditemukan.')
      return ok(resFull(r))
    },
  ],
  [
    'PATCH',
    '/staff/reservations/:code',
    (c) => {
      staffOnly(c)
      const r = db.reservations.find((x) => x.code === c.params.code)
      if (!r) throw new Fail(404, 'NOT_FOUND', 'Reservasi tidak ditemukan.')
      const { action, reason } = c.body
      const by = first(c.user.name)
      const deny = (m) => {
        throw new Fail(422, 'NOT_ALLOWED', m)
      }
      if (action === 'check_in') {
        if (r.status !== 'dikonfirmasi') deny('Hanya reservasi berstatus Dikonfirmasi yang bisa check-in.')
        r.status = 'check_in'
        r.history.push({ at: iso(), text: `Check-in oleh ${by}` })
      } else if (action === 'no_show') {
        if (!canMarkNoShow(r)) deny('No-show baru bisa ditandai 15 menit setelah jam mulai.')
        r.status = 'no_show'
        r.history.push({ at: iso(), text: `Ditandai no-show oleh ${by}` })
      } else if (action === 'cancel') {
        if (!['dikonfirmasi', 'check_in'].includes(r.status)) deny('Reservasi ini tidak bisa dibatalkan.')
        r.status = 'dibatalkan'
        r.history.push({ at: iso(), text: `Dibatalkan oleh ${by}${reason ? `: ${reason}` : ''}` })
      } else deny('Aksi tidak dikenal.')
      return ok(resFull(r))
    },
  ],
  [
    'GET',
    '/staff/tables/status',
    (c) => {
      staffOnly(c)
      const n = currentSlotId()
      return ok(
        TABLE_LAYOUT.map((t) => {
          const nxt = db.reservations.find(
            (r) =>
              r.date === todayWIB() &&
              r.table === t.id &&
              r.status === 'dikonfirmasi' &&
              slotIdx(r.slot) >= (n ? slotIdx(n) : 0),
          )
          return { id: t.id, status: db.tableStatus[t.id], next: nxt ? slotById(nxt.slot).short : null }
        }),
      )
    },
  ],
  [
    'PATCH',
    '/staff/tables/:id/status',
    (c) => {
      staffOnly(c)
      const id = c.params.id
      const s = c.body.status
      if (!(id in db.tableStatus)) throw new Fail(404, 'NOT_FOUND', 'Meja tidak ditemukan.')
      if (!TABLE_STATUS[s] || s === 'dipilih') throw new Fail(422, 'VALIDATION', 'Status tidak valid.')
      db.tableStatus[id] = s
      db.tableLog.unshift({ id: Date.now(), at: iso(), table: id, status: s, by: first(c.user.name) })
      return ok({ id, status: s })
    },
  ],
  [
    'GET',
    '/staff/tables/log',
    (c) => {
      staffOnly(c)
      return ok(db.tableLog)
    },
  ],

  [
    'GET',
    '/expenses',
    (c) => {
      staffOnly(c)
      const l = db.expenses.filter((e) => !c.query.category || e.category === c.query.category)
      return ok(paginate(l, c.query.page, c.query.page_size || 6))
    },
  ],
  [
    'GET',
    '/expenses/summary',
    (c) => {
      staffOnly(c)
      const t = todayWIB()
      const rev = db.sales.get(t)?.revenue ?? null
      const out = outOn(t)
      const ratio = rev ? out / rev : null
      return ok({
        today: { revenue: rev, outflow: out, ratio, status: rev ? cashStatus(ratio) : null },
        month: cash.categories(db, { period: 'month' }),
      })
    },
  ],
  [
    'POST',
    '/expenses',
    (c) => {
      staffOnly(c)
      const b = c.body
      const f = {}
      if (!isValidDate(b.date) || b.date > todayWIB()) f.date = 'Tanggal tidak boleh di masa depan'
      if (!CATEGORIES.includes(b.category)) f.category = 'Kategori wajib dipilih'
      if (!(Number(b.amount) > 0)) f.amount = 'Nominal harus lebih dari 0'
      if (Object.keys(f).length)
        throw new Fail(422, 'VALIDATION', 'Ada isian yang perlu diperbaiki.', { fields: f })
      const e = {
        id: ++db.expSeq,
        date: b.date,
        category: b.category,
        amount: Number(b.amount),
        note: b.note || '',
      }
      db.expenses.unshift(e)
      db.expenses.sort((a, z) => (a.date === z.date ? z.id - a.id : a.date < z.date ? 1 : -1))
      db.adj.push({ kind: 'out', date: e.date, cat: e.category, amount: e.amount })
      return ok(e, 201)
    },
  ],
  [
    'PATCH',
    '/expenses/:id',
    (c) => {
      staffOnly(c)
      const e = db.expenses.find((x) => x.id === +c.params.id)
      if (!e) throw new Fail(404, 'NOT_FOUND', 'Catatan tidak ditemukan.')
      const b = c.body
      const f = {}
      if (!isValidDate(b.date) || b.date > todayWIB()) f.date = 'Tanggal tidak boleh di masa depan'
      if (!CATEGORIES.includes(b.category)) f.category = 'Kategori wajib dipilih'
      if (!(Number(b.amount) > 0)) f.amount = 'Nominal harus lebih dari 0'
      if (Object.keys(f).length)
        throw new Fail(422, 'VALIDATION', 'Ada isian yang perlu diperbaiki.', { fields: f })
      db.adj.push(
        { kind: 'out', date: e.date, cat: e.category, amount: -e.amount },
        { kind: 'out', date: b.date, cat: b.category, amount: Number(b.amount) },
      )
      Object.assign(e, { date: b.date, category: b.category, amount: Number(b.amount), note: b.note || '' })
      return ok(e)
    },
  ],
  [
    'GET',
    '/sales/daily',
    (c) => {
      staffOnly(c)
      const t = todayWIB()
      const n = +c.query.limit || 14
      return ok(
        Array.from({ length: n }, (_, i) => addDays(t, -i))
          .filter((d) => db.sales.has(d))
          .map((d) => {
            const s = db.sales.get(d)
            const o = outOn(d)
            const ratio = s.revenue ? o / s.revenue : null
            return {
              date: d,
              revenue: s.revenue,
              outflow: o,
              ratio,
              status: cashStatus(ratio),
              source: s.source,
            }
          }),
      )
    },
  ],
  [
    'POST',
    '/sales/daily',
    (c) => {
      staffOnly(c)
      const { date, revenue } = c.body
      const f = {}
      if (!isValidDate(date) || date > todayWIB()) f.date = 'Tanggal tidak boleh di masa depan'
      if (!(Number(revenue) > 0)) f.amount = 'Nominal harus lebih dari 0'
      if (Object.keys(f).length)
        throw new Fail(422, 'VALIDATION', 'Ada isian yang perlu diperbaiki.', { fields: f })
      upsertSales(date, Number(revenue), 'Manual')
      return ok({ date, revenue: Number(revenue) }, 201)
    },
  ],
  [
    'POST',
    '/sales/import/preview',
    async (c) => {
      staffOnly(c)
      const { valid, errors } = await parseSales(c.body.get?.('file'))
      return ok({
        valid: valid.length,
        overwrite: valid.filter((v) => v.overwrite).length,
        errors,
        rows: valid,
      })
    },
  ],
  [
    'POST',
    '/sales/import/commit',
    async (c) => {
      staffOnly(c)
      const { valid, errors } = await parseSales(c.body.get?.('file'))
      valid.forEach((v) => upsertSales(v.date, v.value, 'Impor'))
      return ok({
        imported: valid.length,
        overwritten: valid.filter((v) => v.overwrite).length,
        skipped: errors.length,
      })
    },
  ],

  [
    'GET',
    '/cashflow/summary',
    (c) => {
      ownerOnly(c)
      return ok(cash.summary(db, c.query))
    },
  ],
  [
    'GET',
    '/cashflow/series',
    (c) => {
      ownerOnly(c)
      return ok(cash.series(db, c.query))
    },
  ],
  [
    'GET',
    '/cashflow/categories',
    (c) => {
      ownerOnly(c)
      return ok(cash.categories(db, c.query))
    },
  ],
  [
    'GET',
    '/cashflow/shap',
    (c) => {
      ownerOnly(c)
      return ok(cash.shap(db, c.query))
    },
  ],
  [
    'GET',
    '/cashflow/history',
    (c) => {
      ownerOnly(c)
      return ok(cash.history(db))
    },
  ],
  [
    'GET',
    '/notifications',
    (c) => {
      ownerOnly(c)
      return ok(cash.notifications(db))
    },
  ],
  [
    'GET',
    '/assistant/history',
    (c) => {
      ownerOnly(c)
      return ok(db.assistant)
    },
  ],
  [
    'POST',
    '/assistant/messages',
    (c) => {
      ownerOnly(c)
      const text = String(c.body.text || '').trim()
      if (!text) throw new Fail(422, 'VALIDATION', 'Pertanyaan tidak boleh kosong.')
      const a = cash.answer(db, text)
      if (a.error) {
        const s = cash.summary(db, { period: 'month' })
        throw new Fail(503, 'AI_UNAVAILABLE', 'Asisten sedang sibuk (kuota API). Coba lagi sebentar ya.', {
          meta: { fallback: `Status kas ${s.status}, rasio ${Math.round((s.ratio || 0) * 100)}%.` },
        })
      }
      const now = iso()
      db.assistant.push({ role: 'user', text, at: now }, { role: 'assistant', ...a, at: now })
      return ok({ ...a, created_at: now })
    },
  ],
]

const compiled = routes.map(([m, p, h]) => ({
  m,
  h,
  re: new RegExp(`^${p.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`),
}))

/** Jalankan satu permintaan terhadap backend tiruan. */
export async function handle({ method, path, query = {}, body, headers = {} }) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])) // header tidak peka huruf besar/kecil
  const auth = h.authorization || ''
  const user = auth.startsWith('Bearer tk.') ? db.users.find((u) => u.id === auth.slice(10)) : null
  for (const r of compiled) {
    if (r.m !== method) continue
    const m = path.match(r.re)
    if (!m) continue
    try {
      return await r.h({ params: m.groups || {}, query, body, user, headers: h })
    } catch (e) {
      if (e instanceof Fail)
        return {
          status: e.status,
          body: { success: false, error: { code: e.code, message: e.message, ...e.extra } },
        }
      console.error('[mock] error tak terduga', e)
      return {
        status: 500,
        body: { success: false, error: { code: 'SERVER_ERROR', message: 'Server sedang bermasalah.' } },
      }
    }
  }
  return {
    status: 404,
    body: { success: false, error: { code: 'NOT_FOUND', message: 'Endpoint tidak ada.' } },
  }
}
