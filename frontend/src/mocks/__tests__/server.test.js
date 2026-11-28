import { beforeEach } from 'vitest'
import { handle, resetMockDb } from '../server'
import { addDays, todayWIB } from '../../lib/format'

const call = (method, path, o = {}) => handle({ method, path, ...o })
const login = async (email, password, staff = false) => {
  await call('POST', staff ? '/staff/auth/login' : '/auth/login', { body: { email, password } })
  const r = await call('POST', staff ? '/staff/auth/otp/verify' : '/auth/otp/verify', {
    body: { email, code: '482913' },
  })
  return { Authorization: `Bearer ${r.body.data.token}` }
}
const farDate = () => addDays(todayWIB(), 5)
const book = (h, table = 'T06', extra = {}, key = 'k1') =>
  call('POST', '/reservations', {
    headers: { ...h, 'Idempotency-Key': key },
    body: { date: farDate(), slot: '19-21', table_id: table, guests: 2, purpose: 'Nongkrong', ...extra },
  })

describe('backend tiruan', () => {
  beforeEach(() => resetMockDb())
  it('login salah => 401; OTP salah menghabiskan 3 percobaan => 429', async () => {
    expect(
      (await call('POST', '/auth/login', { body: { email: 'raka@email.com', password: 'salah' } })).status,
    ).toBe(401)
    await call('POST', '/auth/login', { body: { email: 'raka@email.com', password: 'password123' } })
    const bad = () => call('POST', '/auth/otp/verify', { body: { email: 'raka@email.com', code: '000000' } })
    const r1 = await bad()
    expect(r1.status).toBe(422)
    expect(r1.body.error.meta.attempts_left).toBe(2)
    await bad()
    expect((await bad()).status).toBe(429)
  })
  it('peran dipisah: pelanggan tidak bisa membuka endpoint staf/owner', async () => {
    const h = await login('raka@email.com', 'password123')
    expect((await call('GET', '/staff/reservations', { headers: h })).status).toBe(403)
    const staf = await login('staf@gaincircle.id', 'staf12345', true)
    expect((await call('GET', '/cashflow/summary', { headers: staf })).status).toBe(403)
    expect((await call('GET', '/staff/reservations', { headers: staf })).status).toBe(200)
  })
  it('reservasi: sukses, ganda => 409, idempotency key mengembalikan hasil yang sama', async () => {
    const h = await login('raka@email.com', 'password123')
    const a = await book(h)
    expect(a.status).toBe(201)
    const again = await book(h, 'T06', {}, 'k1')
    expect(again.body.data.code).toBe(a.body.data.code)
    const dup = await book(h, 'T06', {}, 'k2')
    expect(dup.status).toBe(409)
    expect(dup.body.error.code).toBe('TABLE_ALREADY_BOOKED')
    const av = await call('GET', '/availability', { query: { date: farDate(), slot: '19-21' } })
    expect(av.body.data.tables.find((t) => t.id === 'T06').status).toBe('booked')
  })
  it('validasi: tamu melebihi kapasitas meja => 422 dengan field', async () => {
    const h = await login('raka@email.com', 'password123')
    const r = await book(h, 'T01', { guests: 4 })
    expect(r.status).toBe(422)
    expect(r.body.error.fields.guests).toMatch(/Maks. 2/)
  })
  it('no-show ditolak sebelum 15 menit, check-in menolak status yang salah', async () => {
    const staf = await login('staf@gaincircle.id', 'staf12345', true)
    const future = await call('GET', '/staff/reservations', {
      headers: staf,
      query: { date: addDays(todayWIB(), 1) },
    })
    const code = future.body.data.items[0].code
    expect(
      (await call('PATCH', `/staff/reservations/${code}`, { headers: staf, body: { action: 'no_show' } }))
        .status,
    ).toBe(422)
    expect(
      (await call('PATCH', `/staff/reservations/${code}`, { headers: staf, body: { action: 'check_in' } }))
        .body.data.status,
    ).toBe('check_in')
    expect(
      (await call('PATCH', `/staff/reservations/${code}`, { headers: staf, body: { action: 'check_in' } }))
        .status,
    ).toBe(422)
  })
  it('cek tiket: kode+4 digit benar ok, salah 404, 5x salah => 429', async () => {
    expect(
      (
        await call('GET', '/reservations/lookup', {
          query: {
            code: 'GC-2611-0187'.replace('2611', `${todayWIB().slice(2, 4)}${todayWIB().slice(5, 7)}`),
            phone4: '1234',
          },
        })
      ).status,
    ).toBe(200)
    for (let i = 0; i < 5; i++)
      await call('GET', '/reservations/lookup', { query: { code: 'GC-0000-0000', phone4: '0000' } })
    const r = await call('GET', '/reservations/lookup', { query: { code: 'GC-0000-0000', phone4: '0000' } })
    expect(r.status).toBe(429)
    expect(r.body.error.retry_after).toBeGreaterThan(0)
  })
  it('pengeluaran baru mengubah ringkasan arus kas (rasio naik, status bisa berubah)', async () => {
    const owner = await login('owner@gaincircle.id', 'owner12345', true)
    const before = (await call('GET', '/cashflow/summary', { headers: owner, query: { period: 'month' } }))
      .body.data
    expect(before.status).toBe('waspada')
    await call('POST', '/expenses', {
      headers: owner,
      body: { date: todayWIB(), category: 'Bahan baku', amount: 5_000_000 },
    })
    const after = (await call('GET', '/cashflow/summary', { headers: owner, query: { period: 'month' } }))
      .body.data
    expect(after.outflow - before.outflow).toBe(5_000_000)
    expect(after.status).toBe('kritis')
  })
  it('asisten: di luar konteks dijawab sopan; kuota AI gagal sekali lalu pulih', async () => {
    const owner = await login('owner@gaincircle.id', 'owner12345', true)
    expect(
      (await call('POST', '/assistant/messages', { headers: owner, body: { text: 'resep nasi goreng' } }))
        .body.data.intent,
    ).toBe('di_luar_konteks')
    expect(
      (
        await call('POST', '/assistant/messages', {
          headers: owner,
          body: { text: 'bandingkan dengan minggu lalu' },
        })
      ).status,
    ).toBe(503)
    expect(
      (
        await call('POST', '/assistant/messages', {
          headers: owner,
          body: { text: 'bandingkan dengan minggu lalu' },
        })
      ).status,
    ).toBe(200)
  })
})

describe('impor sales (parser CSV di backend tiruan)', () => {
  const upload = (text, name = 'omzet.csv') => {
    const fd = new FormData()
    fd.append('file', new File([text], name, { type: 'text/csv' }))
    return fd
  }
  it('memisahkan baris valid dan error dengan alasan yang jelas, tanpa menyimpan saat preview', async () => {
    const staf = await login('staf@gaincircle.id', 'staf12345', true)
    const t = todayWIB()
    const csv = `tanggal,total_omzet\n${addDays(t, -30)},2400000\n${addDays(t, -29)},abc\n2099-01-01,100\n${addDays(t, -28)},0\n${addDays(t, -30)},5\n`
    const r = (await call('POST', '/sales/import/preview', { headers: staf, body: upload(csv) })).body.data
    expect(r.valid).toBe(1)
    expect(r.errors.map((e) => e.reason)).toEqual([
      'Nilai omzet bukan angka',
      'Tanggal di masa depan',
      'Nilai omzet harus lebih dari 0',
      'Tanggal ganda di dalam file',
    ])
    expect(r.errors.map((e) => e.row)).toEqual([3, 4, 5, 6])
    const list = (await call('GET', '/sales/daily', { headers: staf, query: { limit: 60 } })).body.data
    expect(list.some((x) => x.date === addDays(t, -30))).toBe(false)
  })
  it('commit menyimpan baris valid dan menandai yang menimpa', async () => {
    const staf = await login('staf@gaincircle.id', 'staf12345', true)
    const t = todayWIB()
    const csv = `tanggal,total_omzet\n${t},9000000\n${addDays(t, -40)},1000000\n`
    const r = (await call('POST', '/sales/import/commit', { headers: staf, body: upload(csv) })).body.data
    expect(r).toMatchObject({ imported: 2, overwritten: 1, skipped: 0 })
  })
  it('menolak file tanpa kolom wajib atau format tidak didukung', async () => {
    const staf = await login('staf@gaincircle.id', 'staf12345', true)
    expect(
      (await call('POST', '/sales/import/preview', { headers: staf, body: upload('a,b\n1,2\n') })).status,
    ).toBe(422)
    expect(
      (await call('POST', '/sales/import/preview', { headers: staf, body: upload('x', 'catatan.txt') }))
        .status,
    ).toBe(422)
  })
})
