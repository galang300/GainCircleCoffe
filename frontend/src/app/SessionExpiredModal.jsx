import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Modal } from '../components/ui/Feedback'
import Button from '../components/ui/Button'

/** Modal global "Sesi berakhir". Login ulang membawa `next` agar halaman tujuan tidak hilang. */
export default function SessionExpiredModal() {
  const { expired, role, dropSession } = useAuth()
  const nav = useNavigate()
  const l = useLocation()
  const go = () => {
    const to = role === 'customer' ? '/masuk' : '/staf/masuk'
    dropSession()
    nav(`${to}?next=${encodeURIComponent(l.pathname + l.search)}`, { replace: true })
  }
  return (
    <Modal
      open={expired}
      dismissible={false}
      tone="yellow"
      tag="Sesi berakhir"
      title="Kamu tidak aktif terlalu lama"
      actions={
        <Button onClick={go} data-autofocus>
          Masuk lagi
        </Button>
      }
    >
      Demi keamanan, sesi ditutup otomatis. Masuk lagi untuk melanjutkan dari halaman ini.
    </Modal>
  )
}
