import { useLocation } from 'react-router-dom'
import Button from '../components/ui/Button'
import { StickerCloud } from '../components/brand/Stickers'
import { useAuth } from '../app/AuthContext'
import { homeFor } from '../app/guards'
import { useDocTitle } from '../lib/hooks'

function Screen({ code, title, text, actions, tone = 'bg-cream' }) {
  return (
    <div className={`${tone} px-5 py-16 md:py-24`}>
      <div className="container-page flex flex-col items-center text-center">
        <StickerCloud size={120} />
        <p className="mt-6 font-display text-[120px] leading-none text-orange sm:text-[180px]">{code}</p>
        <h1 className="text-5xl sm:text-7xl">{title}</h1>
        <p className="mt-3 max-w-md text-base text-muted">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
    </div>
  )
}
export function NotFound() {
  useDocTitle('Halaman tidak ditemukan')
  return (
    <Screen
      code="404"
      title="Halaman tidak ditemukan"
      text="Alamat yang kamu buka tidak ada atau sudah dipindah."
      actions={
        <>
          <Button to="/">Ke beranda</Button>
          <Button to="/reservasi" variant="white">
            Reservasi meja
          </Button>
        </>
      }
    />
  )
}
export function Forbidden() {
  useDocTitle('Akses ditolak')
  const { user } = useAuth()
  const { state } = useLocation()
  const owner = state?.to === 'staff'
  return (
    <Screen
      code="403"
      title="Akses ditolak"
      text={
        owner
          ? 'Halaman ini khusus owner. Akunmu tidak punya akses ke sini.'
          : 'Akunmu tidak punya akses ke halaman ini.'
      }
      actions={
        <>
          <Button to={user ? homeFor(user.role) : '/'}>
            {user?.role === 'customer' || !user ? 'Ke beranda' : 'Kembali ke dashboard'}
          </Button>
          {!user && (
            <Button to="/masuk" variant="white">
              Masuk
            </Button>
          )}
        </>
      }
    />
  )
}
