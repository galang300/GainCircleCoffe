import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scroll ke #anchor bila ada, kalau tidak ke atas (kecuali perubahan query/drawer di halaman yang sama). */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const t = setTimeout(
        () => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        60,
      )
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
    return undefined
  }, [pathname, hash])
  return null
}
