import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SLOTS, MAX_GUESTS } from '../../lib/constants'
import { isValidDate, todayWIB } from '../../lib/format'
import { futureLimit } from '../../lib/validators'
import { isSlotPast, nextSlot } from '../../lib/slots'

const Ctx = createContext(null)
export const useBooking = () => useContext(Ctx)

/** Pilihan reservasi yang dibawa dari langkah 1 ke langkah 2. Nilai awal bisa datang dari URL (?tanggal=&jam=&tamu=). */
export function BookingProvider({ children }) {
  const [sp] = useSearchParams()
  const [state, setState] = useState(() => {
    const today = todayWIB()
    let date = sp.get('tanggal')
    if (!isValidDate(date) || date < today || date > futureLimit(30)) date = today
    let slot = SLOTS.find((s) => s.id === sp.get('jam'))
    if (!slot || isSlotPast(date, slot)) slot = nextSlot(date)
    const g = Number(sp.get('tamu'))
    return {
      date,
      slot: slot.id,
      guests: g >= 1 && g <= MAX_GUESTS ? g : 2,
      table: null,
      purpose: 'Nongkrong',
      note: '',
    }
  })
  const key = useRef(null)
  const patch = useCallback((p) => {
    key.current = null
    setState((s) => ({ ...s, ...p }))
  }, [])
  const idempotencyKey = useCallback(() => (key.current ||= crypto.randomUUID?.() || String(Date.now())), [])
  const reset = useCallback(() => {
    key.current = null
    setState((s) => ({ ...s, table: null, note: '' }))
  }, [])
  const value = useMemo(
    () => ({ ...state, patch, reset, idempotencyKey }),
    [state, patch, reset, idempotencyKey],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
