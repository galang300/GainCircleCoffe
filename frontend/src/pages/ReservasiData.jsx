import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Head } from './Reservasi'
import { useBooking } from '../features/reservation/BookingContext'
import { useTables } from '../features/reservation/hooks'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../app/AuthContext'
import Button from '../components/ui/Button'
import { Checkbox, TextArea, TextField } from '../components/ui/Fields'
import { Chip, Pill } from '../components/ui/Pill'
import { Modal, useToast } from '../components/ui/Feedback'
import { reservationApi } from '../lib/api'
import { PURPOSES, slotById } from '../lib/constants'
import { formatDateShort } from '../lib/format'
import { toAppError, isNetwork } from '../lib/errors'
import { bookingConfirmSchema } from '../lib/schemas'
import { useDocTitle } from '../lib/hooks'

export default function ReservasiData() {
  useDocTitle('Data pemesan')
  const b = useBooking()
  const { user } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const tables = useTables()
  const [errs, setErrs] = useState({})
  const [top, setTop] = useState('')
  const [busy, setBusy] = useState(false)
  const [conflict, setConflict] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors: fe },
  } = useForm({ resolver: zodResolver(bookingConfirmSchema), defaultValues: { agree: false } })
  if (!b.table) return <Navigate to="/reservasi" replace />
  const table = tables.data?.find((t) => t.id === b.table)
  const maxG = table?.seats ?? 8
  const slot = slotById(b.slot)

  const submit = handleSubmit(async () => {
    setTop('')
    setErrs({})
    if (b.guests > maxG) return setErrs({ guests: `Maks. ${maxG} untuk meja ${b.table}` })
    setBusy(true)
    try {
      const r = await reservationApi.create(
        {
          date: b.date,
          slot: b.slot,
          table_id: b.table,
          guests: b.guests,
          purpose: b.purpose,
          note: b.note.trim() || undefined,
        },
        b.idempotencyKey(),
      )
      toast.success('Reservasi berhasil', `E-ticket ${r.code} terbit.`)
      nav(`/reservasi/tiket/${r.code}`, { replace: true })
    } catch (x) {
      const a = toAppError(x)
      if (a.code === 'TABLE_ALREADY_BOOKED') setConflict(true)
      else if (a.status === 422) {
        setErrs(a.fields || {})
        setTop(a.message)
      } else setTop(isNetwork(a) ? 'Server tidak bisa dihubungi. Data kamu aman, coba lagi.' : a.message)
    } finally {
      setBusy(false)
    }
  })
  const lock = (
    <span className="label-caps border border-ink bg-neon px-1.5 py-0.5 text-[9px]">Terisi dari akunmu</span>
  )
  return (
    <div className="pb-14">
      <Head
        step={2}
        eyebrow="Langkah 2"
        title="Data pemesan"
        text="Isi data singkat. Reservasi ini gratis, tanpa pembayaran."
      />
      <form
        onSubmit={submit}
        noValidate
        className="container-page mt-8 grid gap-6 lg:grid-cols-[1fr_380px]"
        aria-label="Data pemesan"
      >
        <div className="space-y-5 border-2 border-ink bg-card p-5 shadow-card sm:p-8">
          <h2 className="text-3xl">Isi data singkat</h2>
          {top && (
            <div role="alert" className="border-2 border-ink bg-pink/20 p-3 text-sm font-bold">
              ! {top}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Nama lengkap" required readOnly value={user.name} tag={lock} />
            <TextField label="Nomor WhatsApp" required readOnly value={user.phone} tag={lock} />
          </div>
          <TextField label="Email" readOnly value={user.email} tag={lock} />
          <div>
            <p className="label-caps mb-1.5" id="lbl-jml">
              Jumlah tamu *
            </p>
            <div className="flex items-center gap-3" role="group" aria-labelledby="lbl-jml">
              <button
                type="button"
                aria-label="Kurangi tamu"
                disabled={b.guests <= 1}
                onClick={() => b.patch({ guests: b.guests - 1 })}
                className="h-12 w-12 border-2 border-ink bg-white text-xl disabled:opacity-40"
              >
                −
              </button>
              <output className="w-10 text-center font-display text-4xl" aria-live="polite">
                {b.guests}
              </output>
              <button
                type="button"
                aria-label="Tambah tamu"
                disabled={b.guests >= maxG}
                onClick={() => b.patch({ guests: b.guests + 1 })}
                className="h-12 w-12 border-2 border-ink bg-white text-xl disabled:opacity-40"
              >
                +
              </button>
              <span className="label-caps text-[11px] text-muted">
                Maks. {maxG} untuk meja {b.table}
              </span>
            </div>
            {errs.guests && (
              <p role="alert" className="mt-1.5 text-xs font-bold text-danger">
                ! {errs.guests}
              </p>
            )}
          </div>
          <fieldset>
            <legend className="label-caps mb-1.5">Keperluan</legend>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <Chip key={p} active={b.purpose === p} onClick={() => b.patch({ purpose: p })}>
                  {p}
                </Chip>
              ))}
            </div>
          </fieldset>
          <TextArea
            label="Catatan khusus"
            placeholder="Contoh: kursi dekat colokan"
            maxLength={200}
            value={b.note}
            onChange={(e) => b.patch({ note: e.target.value })}
            error={errs.note}
            hint={`${b.note.length}/200 · opsional`}
          />
          <Checkbox
            label="Saya setuju meja ditahan 15 menit sejak jam mulai."
            error={fe.agree?.message}
            {...register('agree')}
          />
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="white" onClick={() => nav('/reservasi')}>
              ← Kembali
            </Button>
            <Button type="submit" size="lg" loading={busy} className="flex-1 sm:flex-none">
              Konfirmasi reservasi
            </Button>
          </div>
          <p className="text-[13px] text-muted">
            Sistem mengecek ulang ketersediaan meja sebelum menyimpan. Jika ada yang memesan lebih dulu, kamu
            diminta memilih meja lain.
          </p>
        </div>
        <aside
          className="h-fit border-2 border-ink bg-white shadow-card lg:sticky lg:top-20"
          aria-label="Ringkasan reservasi"
        >
          <div className="flex items-center justify-between border-b-2 border-ink bg-orange px-4 py-2.5">
            <h2 className="text-2xl">Ringkasan</h2>
            <Pill bg="#75F237">Gratis · tanpa pembayaran</Pill>
          </div>
          <dl className="divide-y divide-line px-5">
            {[
              ['Tanggal', formatDateShort(b.date)],
              ['Jam', `${slot.range} WIB`],
              ['Meja', `${b.table} · ${table?.seats ?? ''} kursi`],
              ['Tamu', `${b.guests} orang`],
              ['Nama', user.name.toUpperCase()],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="label-caps text-[11px] text-muted">{k}</dt>
                <dd className="text-right font-display text-xl uppercase">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </form>
      <Modal
        open={conflict}
        onClose={() => setConflict(false)}
        tone="pink"
        tag="Meja sudah dipesan"
        title={`Meja ${b.table} sudah dipesan`}
        actions={
          <Button
            data-autofocus
            onClick={() => {
              setConflict(false)
              b.patch({ table: null })
              nav('/reservasi')
            }}
          >
            Pilih meja lain
          </Button>
        }
      >
        Seseorang memesan {b.table} lebih dulu. Denah sudah diperbarui, pilih meja atau jam lain.
      </Modal>
    </div>
  )
}
