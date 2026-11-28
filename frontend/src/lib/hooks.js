import { useCallback, useEffect, useRef, useState } from 'react'
import { toAppError } from './errors'

/** Ambil data async dengan state loading/error. `deps` memicu muat ulang. */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: immediate })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const seq = useRef(0)
  const run = useCallback(async (silent = false) => {
    const id = ++seq.current
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fnRef.current()
      if (id === seq.current) setState({ data, error: null, loading: false })
      return data
    } catch (e) {
      if (id === seq.current)
        setState((s) => ({ data: silent ? s.data : null, error: toAppError(e), loading: false }))
      return null
    }
  }, [])
  useEffect(() => {
    if (immediate) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  const setData = useCallback(
    (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    [],
  )
  return { ...state, reload: run, refresh: () => run(true), setData }
}

/** Polling yang berhenti saat tab tidak aktif (denah real-time, lihat PromptMaster bagian 6). */
export function usePolling(cb, ms = 15000, enabled = true) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (!enabled) return undefined
    const tick = () => {
      if (!document.hidden) ref.current()
    }
    const id = setInterval(tick, ms)
    return () => clearInterval(id)
  }, [ms, enabled])
}

export function useCountdown(seconds, key) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    setLeft(seconds)
    if (!seconds) return undefined
    const id = setInterval(() => setLeft((v) => (v <= 1 ? (clearInterval(id), 0) : v - 1)), 1000)
    return () => clearInterval(id)
  }, [seconds, key])
  return [left, setLeft]
}
export const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const a = () => setOn(true),
      b = () => setOn(false)
    window.addEventListener('online', a)
    window.addEventListener('offline', b)
    return () => {
      window.removeEventListener('online', a)
      window.removeEventListener('offline', b)
    }
  }, [])
  return on
}

export function useDocTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Gain Circle` : 'Gain Circle · Reservasi Meja'
  }, [title])
}
export function useMedia(q) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setM(mq.matches)
    mq.addEventListener('change', f)
    f()
    return () => mq.removeEventListener('change', f)
  }, [q])
  return m
}
