import {
  addDays,
  formatDateLong,
  monthGrid,
  nowWIB,
  normalizePhone,
  maskPhone,
  rupiah,
  rupiahJt,
  weekdayIndex,
  isValidDate,
} from '../format'

describe('format', () => {
  it('rupiah memakai pemisah titik', () => {
    expect(rupiah(1250000)).toBe('Rp 1.250.000')
    expect(rupiah(null)).toBe('Rp 0')
  })
  it('rupiahJt selalu satu desimal (sesuai desain)', () => {
    expect(rupiahJt(34_000_000)).toBe('Rp 34,0 jt')
    expect(rupiahJt(41_500_000)).toBe('Rp 41,5 jt')
    expect(rupiahJt(120_000_000)).toBe('Rp 120 jt')
  })
  it('nowWIB mengonversi UTC ke WIB (UTC+7) termasuk lintas hari', () => {
    expect(nowWIB(new Date('2026-11-20T12:00:00Z'))).toMatchObject({
      date: '2026-11-20',
      hour: 19,
      minutes: 19 * 60,
    })
    expect(nowWIB(new Date('2026-11-20T18:30:00Z'))).toMatchObject({
      date: '2026-11-21',
      hour: 1,
      minute: 30,
    })
  })
  it('tanggal: addDays, weekdayIndex, validasi, format', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(weekdayIndex('2026-11-20')).toBe(4) // Jumat
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('2026-11-20')).toBe(true)
    expect(formatDateLong('2026-11-20')).toBe('Jumat, 20 Nov 2026')
  })
  it('monthGrid mulai Senin dan seluruh minggu berisi 7 sel', () => {
    const g = monthGrid('2026-11')
    expect(g.every((w) => w.length === 7)).toBe(true)
    expect(g[0][6]).toBe('2026-11-01') // 1 Nov 2026 = Minggu
  })
  it('normalizePhone menerima 08, 62, +62 dan menolak yang salah', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('081234567890')
    expect(normalizePhone('+6281234567890')).toBe('081234567890')
    expect(normalizePhone('6281234567890')).toBe('081234567890')
    expect(normalizePhone('12345')).toBe('')
    expect(normalizePhone('abc')).toBe('')
    expect(maskPhone('081234567890')).toBe('0812-••••-7890')
  })
})
