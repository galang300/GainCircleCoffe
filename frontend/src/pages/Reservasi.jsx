import { useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookingProvider, useBooking } from '../features/reservation/BookingContext'
import Calendar from '../features/reservation/Calendar'
import SlotPicker from '../features/reservation/SlotPicker'
import FloorPlan, { Legend } from '../features/reservation/FloorPlan'
import { useAvailability, useDaySlots, useTables } from '../features/reservation/hooks'
import { Stepper } from '../components/ui/Fields'
import Button from '../components/ui/Button'
import { ErrorState, Skeleton, Banner } from '../components/ui/Feedback'
import { StickerBooked, StickerCalendar } from '../components/brand/Stickers'
import { ENV, SLOTS, slotById, MAX_GUESTS } from '../lib/constants'
import { formatDateLong } from '../lib/format'
import { isSlotPast } from '../lib/slots'
import { useDocTitle } from '../lib/hooks'

export function Head({ step, eyebrow, title, text, sticker = 'cal' }) {
  return (
    <div className="container-page pt-10 md:pt-14">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-serif text-xl md:text-2xl">{eyebrow}</p>
          <h1 className="mt-1 text-[56px] leading-[.95] sm:text-[88px] lg:text-[112px]">{title}</h1>
        </div>
        <div className="flex items-start gap-8">
          {text && <p className="hidden max-w-[260px] pt-8 text-base lg:block">{text}</p>}
          <div className="hidden sm:block">
            {sticker === 'cal' ? <StickerCalendar size={124} /> : <StickerBooked size={124} />}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Stepper step={step} />
      </div>
    </div>
  )
}

/** Layout rute /reservasi: menyediakan BookingProvider untuk langkah 1 dan 2. */
export default function ReservasiLayout() {
  return (
    <BookingProvider>
      <Outlet />
    </BookingProvider>
  )
}

export function PilihMeja() {
  useDocTitle('Pilih meja')
  const b = useBooking()
  const nav = useNavigate()
  const tables = useTables()
  const av = useAvailability(b.date, b.slot)
  const day = useDaySlots(b.date)
  const slot = slotById(b.slot)
  const table = tables.data?.find((t) => t.id === b.table)

  // Jaga konsistensi pilihan: slot lewat/penuh, meja jadi dipesan, atau kapasitas tidak cukup.
  // Slot terpilih yang lewat/penuh (mis. setelah ganti tanggal) otomatis pindah ke slot terdekat yang masih bisa dipesan.
  useEffect(() => {
    if (!day.data) return
    const bad = (x) => isSlotPast(b.date, x) || day.full.includes(x.id)
    if (bad(slot)) {
      const s = SLOTS.find((x) => !bad(x))
      if (s) b.patch({ slot: s.id, table: null })
    }
  }, [day.data, b.date]) // eslint-disable-line react-hooks/exhaustive-deps
  const taken = b.table && av.map[b.table] && av.map[b.table].status !== 'free'
  useEffect(() => {
    if (taken) b.patch({ table: null })
  }, [taken]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (table && table.seats < b.guests) b.patch({ table: null })
  }, [b.guests]) // eslint-disable-line react-hooks/exhaustive-deps

  const disabledIds = useMemo(
    () =>
      (tables.data || [])
        .filter((t) => av.map[t.id]?.status !== 'free' || t.seats < b.guests)
        .map((t) => t.id),
    [tables.data, av.map, b.guests],
  )
  const reasonOf = (id) =>
    av.map[id]?.status !== 'free'
      ? 'sudah dipesan'
      : tables.data.find((t) => t.id === id).seats < b.guests
        ? 'kursi kurang untuk jumlah tamu'
        : ''
  const allBooked = !av.loading && tables.data && tables.data.every((t) => av.map[t.id]?.status !== 'free')
  const alt = SLOTS.filter(
    (s) => !isSlotPast(b.date, s) && !day.full.includes(s.id) && s.id !== b.slot,
  ).slice(0, 3)
  const noFit =
    tables.data && !allBooked && !av.loading && tables.data.every((t) => disabledIds.includes(t.id))

  return (
    <div>
      <Head
        step={1}
        eyebrow="Langkah 1"
        title="Pilih meja"
        text={<>Pilih tanggal, jam, dan meja favoritmu. Status meja diperbarui real-time.</>}
      />
      <div className="container-page mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-5">
          <Calendar value={b.date} onChange={(d) => b.patch({ date: d, table: null })} />
          <SlotPicker
            date={b.date}
            value={b.slot}
            fullSlots={day.full}
            onChange={(s) => b.patch({ slot: s, table: null })}
          />
          <div className="flex items-center justify-between border-2 border-ink bg-card p-4 shadow-cardsm">
            <h3 className="text-2xl" id="lbl-tamu">
              Tamu
            </h3>
            <div className="flex items-center gap-3" role="group" aria-labelledby="lbl-tamu">
              <button
                type="button"
                aria-label="Kurangi tamu"
                disabled={b.guests <= 1}
                onClick={() => b.patch({ guests: b.guests - 1 })}
                className="h-11 w-11 border-2 border-ink bg-white text-xl disabled:opacity-40"
              >
                −
              </button>
              <output aria-live="polite" className="w-8 text-center font-display text-3xl">
                {b.guests}
              </output>
              <button
                type="button"
                aria-label="Tambah tamu"
                disabled={b.guests >= MAX_GUESTS}
                onClick={() => b.patch({ guests: b.guests + 1 })}
                className="h-11 w-11 border-2 border-ink bg-white text-xl disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <section aria-label="Denah meja" className="border-2 border-ink bg-card shadow-card">
          <div className="flex items-center justify-between border-b-2 border-ink bg-orange px-4 py-2.5">
            <h2 className="text-2xl">Pilih meja</h2>
            <span className="label-caps text-xs" aria-live="polite">
              {b.table ? `${b.table} dipilih` : 'Belum dipilih'}
            </span>
          </div>
          <div className="p-3 sm:p-6">
            {tables.error ? (
              <ErrorState error={tables.error} onRetry={tables.reload} />
            ) : av.error && !av.data ? (
              <ErrorState error={av.error} onRetry={av.reload} />
            ) : tables.loading || (av.loading && !av.data) ? (
              <Skeleton className="aspect-[640/430] w-full" />
            ) : allBooked ? (
              <div className="py-10 text-center" role="alert">
                <h3 className="text-4xl">Semua meja penuh</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
                  Slot {slot.range} sudah penuh. Coba jam atau tanggal lain.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {alt.map((s) => (
                    <Button
                      key={s.id}
                      variant="white"
                      size="sm"
                      onClick={() => b.patch({ slot: s.id, table: null })}
                    >
                      {s.short} ✓
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <FloorPlan
                  tables={tables.data}
                  statusOf={(id) => (av.map[id]?.status === 'free' ? 'kosong' : 'dipesan')}
                  selectedId={b.table}
                  disabledIds={disabledIds}
                  reasonOf={reasonOf}
                  onSelect={(id) => b.patch({ table: id })}
                  label={`Denah meja ${formatDateLong(b.date)} ${slot.range}`}
                />
                <div className="mt-4">
                  <Legend items={['kosong', 'dipesan', 'dipilih']} />
                </div>
                <p className="mt-3 text-[13px] text-muted">
                  {noFit
                    ? `Tidak ada meja dengan ${b.guests} kursi yang kosong. Kurangi jumlah tamu atau ganti jam.`
                    : 'Klik meja yang tersedia untuk memilih. Meja berkursi kurang dari jumlah tamu tidak bisa dipilih.'}
                </p>
                <p className="mt-1 text-xs text-muted">Status berdasarkan reservasi lewat website ini.</p>
                {ENV.useMocks && (
                  <p className="mt-2 border border-dashed border-ink bg-yellow/50 p-2 text-[11px]">
                    <b>Data contoh:</b> memilih meja T04 memicu simulasi konflik 409 (meja disambar pemesan
                    lain).
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-30 mt-10 border-t-[3px] border-cream bg-ink text-cream">
        <div className="container-page flex items-center justify-between gap-4 py-3 md:py-5">
          <div className="min-w-0">
            <p className="label-caps text-[10px] text-neon">Ringkasan</p>
            <p className="truncate font-display text-2xl uppercase md:text-4xl">
              {table ? `Meja ${table.id} · ${table.seats} kursi` : 'Pilih meja dulu'}
            </p>
            <p className="truncate text-xs md:text-sm">
              {formatDateLong(b.date)} · {slot.range} WIB · {b.guests} tamu
            </p>
          </div>
          <Button size="lg" disabled={!table} onClick={() => nav('/reservasi/data')}>
            Lanjut →
          </Button>
        </div>
      </div>
    </div>
  )
}
