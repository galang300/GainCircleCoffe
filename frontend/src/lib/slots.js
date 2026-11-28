import { HOLD_MINUTES, SLOTS, slotById } from './constants'
import { nowWIB } from './format'

/** Slot tidak bisa dipesan jika sudah dimulai (atau tanggalnya sudah lewat). Sesuai state "slot lewat" (layar 13). */
export function isSlotPast(date, slot, now = nowWIB()) {
  if (date < now.date) return true
  if (date > now.date) return false
  return now.minutes >= slot.start * 60
}
/** Waktu mulai reservasi dalam menit sejak 00.00 pada tanggalnya. */
export const slotStartMinutes = (slotId) => (slotById(slotId)?.start ?? 0) * 60
/** No-show baru aktif 15 menit setelah jam mulai (layar 15). */
export function noShowOpensAt(res) {
  const m = slotStartMinutes(res.slot) + HOLD_MINUTES
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`
}
export function canMarkNoShow(res, now = nowWIB()) {
  if (res.status !== 'dikonfirmasi') return false
  if (res.date < now.date) return true
  if (res.date > now.date) return false
  return now.minutes >= slotStartMinutes(res.slot) + HOLD_MINUTES
}
export const canCheckIn = (res) => res.status === 'dikonfirmasi'
export const isActive = (res) => res.status === 'dikonfirmasi' || res.status === 'check_in'
/** Slot paling dekat yang masih bisa dipesan hari ini (atau slot pertama bila belum ada). */
export function nextSlot(date, now = nowWIB()) {
  return SLOTS.find((s) => !isSlotPast(date, s, now)) || SLOTS[SLOTS.length - 1]
}
/** Meja muat tamu? */
export const fitsGuests = (table, guests) => table.seats >= guests
export const maxGuestsFor = (table) => table?.seats ?? 8
