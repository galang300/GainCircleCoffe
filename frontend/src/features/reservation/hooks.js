import { useMemo } from 'react'
import { reservationApi } from '../../lib/api'
import { usePolling, useAsync } from '../../lib/hooks'

/** Daftar meja dari API (posisi, bentuk, kursi). */
export const useTables = () => useAsync(() => reservationApi.tables(), [])

/** Ketersediaan per tanggal+slot, di-poll tiap 15 detik (berhenti saat tab tidak aktif). */
export function useAvailability(date, slot, enabled = true) {
  const q = useAsync(
    () => (enabled && date && slot ? reservationApi.availability(date, slot) : Promise.resolve(null)),
    [date, slot, enabled],
  )
  usePolling(() => q.refresh(), 15000, enabled && !!date && !!slot)
  const map = useMemo(() => Object.fromEntries((q.data?.tables || []).map((t) => [t.id, t])), [q.data])
  return { ...q, map, full: q.data?.full ?? false }
}

/** Ringkasan semua slot pada satu tanggal: { slots:[{slot, free, total}] }. Dipakai untuk menandai slot penuh. */
export function useDaySlots(date) {
  const q = useAsync(() => reservationApi.availability(date), [date])
  usePolling(() => q.refresh(), 15000, !!date)
  const full = useMemo(() => (q.data?.slots || []).filter((s) => s.free === 0).map((s) => s.slot), [q.data])
  return { ...q, full, byId: Object.fromEntries((q.data?.slots || []).map((s) => [s.slot, s])) }
}
