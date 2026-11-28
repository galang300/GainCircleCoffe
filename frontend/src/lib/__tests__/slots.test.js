import { SLOTS, slotById } from '../constants'
import { canMarkNoShow, isSlotPast, noShowOpensAt, nextSlot } from '../slots'

const at = (date, h, m = 0) => ({ date, hour: h, minute: m, minutes: h * 60 + m })
describe('slots', () => {
  it('ada 9 slot 2 jam, slot terakhir 23.00–00.00', () => {
    expect(SLOTS).toHaveLength(9)
    expect(SLOTS[0].label).toBe('07.00–09.00')
    expect(SLOTS[8].id).toBe('23-00')
    expect(SLOTS[8].range).toBe('23.00 – 00.00')
  })
  it('slot lewat: tanggal lalu, slot yang sudah mulai, dan masa depan', () => {
    const s19 = slotById('19-21')
    expect(isSlotPast('2026-11-19', s19, at('2026-11-20', 8))).toBe(true)
    expect(isSlotPast('2026-11-20', s19, at('2026-11-20', 19, 0))).toBe(true)
    expect(isSlotPast('2026-11-20', s19, at('2026-11-20', 18, 59))).toBe(false)
    expect(isSlotPast('2026-11-21', s19, at('2026-11-20', 23, 59))).toBe(false)
  })
  it('no-show baru aktif tepat 15 menit setelah jam mulai', () => {
    const r = { status: 'dikonfirmasi', date: '2026-11-20', slot: '19-21' }
    expect(canMarkNoShow(r, at('2026-11-20', 19, 14))).toBe(false)
    expect(canMarkNoShow(r, at('2026-11-20', 19, 15))).toBe(true)
    expect(canMarkNoShow({ ...r, date: '2026-11-21' }, at('2026-11-20', 23, 0))).toBe(false)
    expect(canMarkNoShow({ ...r, date: '2026-11-19' }, at('2026-11-20', 8))).toBe(true)
    expect(canMarkNoShow({ ...r, status: 'check_in' }, at('2026-11-20', 20))).toBe(false)
    expect(noShowOpensAt(r)).toBe('19.15')
  })
  it('nextSlot memilih slot terdekat yang belum mulai', () => {
    expect(nextSlot('2026-11-20', at('2026-11-20', 19, 40)).id).toBe('21-23')
    expect(nextSlot('2026-11-21', at('2026-11-20', 22)).id).toBe('07-09')
  })
})
