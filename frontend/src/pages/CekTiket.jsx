import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Ticket from '../features/reservation/Ticket'
import { TicketActions } from './ReservasiTiket'
import Button from '../components/ui/Button'
import { TextField } from '../components/ui/Fields'
import { StickerCalendar } from '../components/brand/Stickers'
import { reservationApi } from '../lib/api'
import { ENV } from '../lib/constants'
import { mmss, useCountdown, useDocTitle } from '../lib/hooks'
import { toAppError } from '../lib/errors'
import { ticketLookupSchema } from '../lib/schemas'

export default function CekTiket() {
  useDocTitle('Cek e-ticket')
  const [state, setState] = useState({ kind: 'idle' }) // idle | loading | found | missing | limited | error
  const [wait] = useCountdown(
    state.kind === 'limited' ? state.retry : 0,
    state.kind === 'limited' ? state.at : 0,
  )
  useEffect(() => {
    if (state.kind === 'limited' && wait === 0) setState({ kind: 'idle' })
  }, [wait, state.kind])
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ticketLookupSchema), defaultValues: { code: '', phone4: '' } })

  const onSubmit = handleSubmit(async (v) => {
    setState({ kind: 'loading' })
    try {
      setState({ kind: 'found', res: await reservationApi.lookup(v.code.trim().toUpperCase(), v.phone4) })
    } catch (x) {
      const a = toAppError(x)
      if (a.status === 404) setState({ kind: 'missing' })
      else if (a.status === 429) setState({ kind: 'limited', retry: a.retryAfter || 30, at: Date.now() })
      else setState({ kind: 'error', message: a.message })
    }
  })
  const busy = state.kind === 'loading'
  const digits = register('phone4')

  return (
    <div className="container-page py-10 pb-20 md:py-14">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-serif text-xl">Lupa atau hilang tiketmu?</p>
          <h1 className="mt-1 text-[64px] leading-[.95] sm:text-[104px]">Cek e-ticket</h1>
          <p className="mt-3 max-w-md">
            Masukkan kode reservasi dan 4 digit terakhir nomor WhatsApp yang kamu pakai.
          </p>
        </div>
        <div className="hidden sm:block">
          <StickerCalendar size={112} />
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Cek e-ticket"
          className="space-y-5 border-2 border-ink bg-card p-6 shadow-card sm:p-8"
        >
          <TextField
            label="Kode reservasi"
            required
            placeholder="GC-2611-0187"
            autoCapitalize="characters"
            error={errors.code?.message || (state.kind === 'missing' ? 'Kode tidak ditemukan' : '')}
            {...register('code')}
          />
          <TextField
            label="4 digit terakhir WhatsApp"
            required
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            error={errors.phone4?.message}
            {...digits}
            onChange={(e) => {
              setValue('phone4', e.target.value.replace(/\D/g, ''), { shouldValidate: !!errors.phone4 })
            }}
          />
          <Button type="submit" size="lg" block loading={busy} disabled={state.kind === 'limited'}>
            {busy ? 'Memeriksa…' : 'Cek tiket'}
          </Button>
        </form>
        <div aria-live="polite">
          {state.kind === 'found' && (
            <>
              <Ticket res={state.res} />
              <TicketActions res={state.res} />
              {state.res.status === 'dibatalkan' && (
                <p role="status" className="mt-4 border-2 border-ink bg-card p-3 text-sm font-bold">
                  Reservasi ini dibatalkan. Buat reservasi baru lewat menu Reservasi meja.
                </p>
              )}
            </>
          )}
          {state.kind === 'missing' && (
            <div role="alert" className="border-2 border-ink bg-pink/20 p-6 shadow-card">
              <h2 className="text-4xl">Tiket tidak ditemukan</h2>
              <p className="mt-2 text-sm">
                Periksa kembali kode di e-ticket atau pesan konfirmasi. Pastikan 4 digit terakhir nomor
                WhatsApp sesuai.
              </p>
              <Button href={ENV.instagram} variant="white" className="mt-4">
                Hubungi Gain Circle
              </Button>
            </div>
          )}
          {state.kind === 'limited' && (
            <div role="alert" className="border-2 border-ink bg-yellow p-6 shadow-card">
              <h2 className="text-4xl">Terlalu banyak percobaan</h2>
              <p className="mt-2 text-sm">
                Tunggu <b>{mmss(wait)}</b> lalu coba lagi.
              </p>
            </div>
          )}
          {state.kind === 'error' && (
            <div role="alert" className="border-2 border-ink bg-pink/20 p-6">
              <h2 className="text-3xl">Gagal memeriksa</h2>
              <p className="mt-2 text-sm">{state.message}</p>
              <Button className="mt-3" variant="orange" onClick={onSubmit}>
                Coba lagi
              </Button>
            </div>
          )}
          {(state.kind === 'idle' || state.kind === 'loading') && (
            <div className="hidden min-h-64 place-items-center border-2 border-dashed border-line text-center text-sm text-muted lg:grid">
              {busy ? 'Memeriksa tiketmu…' : 'Hasil pencarian tampil di sini.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
