import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Head } from './Reservasi'
import Ticket from '../features/reservation/Ticket'
import { downloadTicketPdf } from '../features/reservation/pdf'
import Button from '../components/ui/Button'
import { ErrorState, Skeleton, useToast } from '../components/ui/Feedback'
import { reservationApi } from '../lib/api'
import { useAsync, useDocTitle } from '../lib/hooks'
import { toAppError } from '../lib/errors'

export function TicketActions({ res, extra }) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const pdf = async () => {
    setBusy(true)
    try {
      await downloadTicketPdf(res)
    } catch (e) {
      toast.error('Gagal membuat PDF', toAppError(e).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="no-print mt-6 flex flex-wrap gap-3">
      <Button variant="ink" onClick={() => window.print()}>
        Cetak e-ticket
      </Button>
      <Button variant="yellow" loading={busy} onClick={pdf}>
        Unduh PDF
      </Button>
      {extra}
    </div>
  )
}

export default function ReservasiTiket() {
  const { kode } = useParams()
  useDocTitle(`E-ticket ${kode}`)
  const q = useAsync(() => reservationApi.byCode(kode), [kode])
  return (
    <div className="pb-16">
      <div className="no-print">
        <Head step={3} eyebrow="Siap nongkrong" title="Reservasi berhasil" sticker="booked" />
      </div>
      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {q.loading ? (
            <Skeleton className="h-72 w-full" />
          ) : q.error ? (
            <ErrorState
              error={q.error}
              onRetry={q.reload}
              title={q.error.status === 404 ? 'Tiket tidak ditemukan' : undefined}
              extra={
                <Button to="/tiket-saya" variant="white">
                  Tiket saya
                </Button>
              }
            />
          ) : (
            <>
              <Ticket res={q.data} />
              <TicketActions
                res={q.data}
                extra={
                  <>
                    <Button to="/tiket-saya" variant="white">
                      Tiket saya
                    </Button>
                    <Button to="/" variant="white">
                      Beranda
                    </Button>
                  </>
                }
              />
            </>
          )}
        </div>
        <aside className="no-print h-fit border-2 border-ink bg-card p-6 shadow-card">
          <h2 className="text-3xl">Sebelum datang</h2>
          <ul className="mt-4 space-y-4 text-[15px]">
            <li>Datang maksimal 15 menit setelah jam mulai, lewat itu meja dilepas.</li>
            <li>Simpan atau cetak e-ticket. Kodenya juga bisa dicek lewat menu Cek Tiket.</li>
            <li>Pesan menu langsung di kasir. Tidak ada pembayaran online.</li>
            <li>Perlu ubah atau batalkan? Hubungi Gain Circle lewat Instagram @gain.circle.</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
