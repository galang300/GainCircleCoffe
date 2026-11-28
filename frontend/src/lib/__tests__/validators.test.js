import { cashStatus, formatAmountInput, parseAmount, validateSalesFile } from '../validators'
import {
  expenseSchema,
  loginSchema,
  otpSchema,
  registerSchema,
  salesSchema,
  ticketLookupSchema,
} from '../schemas'
import { todayWIB, addDays } from '../format'

const msgs = (r) => (r.success ? [] : r.error.issues.map((i) => i.message))

describe('skema form (zod)', () => {
  it('login: email dan sandi wajib', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
    expect(msgs(loginSchema.safeParse({ email: 'a@b', password: '' }))).toEqual([
      'Format email tidak valid',
      'Kata sandi wajib diisi',
    ])
  })
  it('daftar: nama, HP, sandi 8+, dan persetujuan', () => {
    const ok = {
      name: 'Raka',
      email: 'raka@email.com',
      phone: '0812-3456-7890',
      password: '12345678',
      agree: true,
    }
    expect(registerSchema.safeParse(ok).success).toBe(true)
    expect(
      msgs(registerSchema.safeParse({ ...ok, name: 'R', phone: '123', password: '1234567', agree: false })),
    ).toEqual([
      'Nama minimal 2 huruf',
      'Format nomor HP tidak valid. Contoh: 0812xxxxxxxx',
      'Minimal 8 karakter',
      'Setujui aturan reservasi untuk lanjut',
    ])
  })
  it('cek tiket: format kode dan 4 digit', () => {
    expect(ticketLookupSchema.safeParse({ code: 'gc-2611-0187', phone4: '1234' }).success).toBe(true)
    expect(msgs(ticketLookupSchema.safeParse({ code: 'GC-2611-187', phone4: '12a4' }))).toHaveLength(2)
  })
  it('OTP harus 6 digit angka', () => {
    expect(otpSchema.safeParse('123456').success).toBe(true)
    expect(otpSchema.safeParse('12345').success).toBe(false)
    expect(otpSchema.safeParse('12345a').success).toBe(false)
  })
  it('pengeluaran: kategori, nominal > 0, tanggal tidak di masa depan', () => {
    const base = { date: todayWIB(), category: 'Bahan baku', amount: '1.250.000' }
    expect(expenseSchema.safeParse(base).success).toBe(true)
    expect(msgs(expenseSchema.safeParse({ ...base, category: '' }))).toEqual(['Kategori wajib dipilih'])
    expect(msgs(expenseSchema.safeParse({ ...base, amount: '0' }))).toEqual(['Nominal harus lebih dari 0'])
    expect(msgs(expenseSchema.safeParse({ ...base, amount: '' }))).toContain('Nominal wajib diisi')
    expect(msgs(expenseSchema.safeParse({ ...base, date: addDays(todayWIB(), 1) }))).toEqual([
      'Tanggal tidak boleh di masa depan',
    ])
  })
  it('omzet: tanggal valid dan nominal', () => {
    expect(salesSchema.safeParse({ date: todayWIB(), amount: '2.600.000' }).success).toBe(true)
    expect(salesSchema.safeParse({ date: '2026-02-30', amount: '1' }).success).toBe(false)
  })
})

describe('helper nominal dan status kas', () => {
  it('format dan parse nominal dengan titik ribuan', () => {
    expect(parseAmount('1.250.000')).toBe(1250000)
    expect(formatAmountInput('1250000')).toBe('1.250.000')
    expect(formatAmountInput('x')).toBe('')
  })
  it('status kas: batas 70% dan 90% (rasio persis di batas masuk kelas bawah)', () => {
    expect(cashStatus(0.5)).toBe('sehat')
    expect(cashStatus(0.7)).toBe('sehat')
    expect(cashStatus(0.7001)).toBe('waspada')
    expect(cashStatus(0.9)).toBe('waspada')
    expect(cashStatus(0.9001)).toBe('kritis')
    expect(cashStatus(null)).toBe('belum')
    expect(cashStatus(NaN)).toBe('belum')
  })
  it('file impor: tipe, ukuran, kosong', () => {
    const f = (name, size) => ({ name, size })
    expect(validateSalesFile(f('a.csv', 100))).toBe('')
    expect(validateSalesFile(f('a.xlsx', 100))).toBe('')
    expect(validateSalesFile(f('a.pdf', 100))).toMatch(/tidak didukung/i)
    expect(validateSalesFile(f('a.csv', 3 * 1024 * 1024))).toMatch(/2 MB/)
    expect(validateSalesFile(f('a.csv', 0))).toMatch(/kosong/i)
    expect(validateSalesFile(null)).not.toBe('')
  })
})
