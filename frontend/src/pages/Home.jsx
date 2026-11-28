import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { ErrorState, Skeleton } from '../components/ui/Feedback'
import { Tag } from '../components/ui/Pill'
import {
  StickerBooked,
  StickerCalendar,
  StickerCassette,
  StickerCup,
  StarIcon,
} from '../components/brand/Stickers'
import FloorPlan, { Legend } from '../features/reservation/FloorPlan'
import { useAvailability, useTables } from '../features/reservation/hooks'
import { ADDRESS, ENV, OPEN_TEXT, SLOTS, slotById } from '../lib/constants'
import { addDays, formatChipDate, formatDateShort, todayWIB } from '../lib/format'
import { nextSlot } from '../lib/slots'
import { useDocTitle } from '../lib/hooks'
import { cx } from '../lib/cx'

const Eyebrow = ({ children, dark }) => (
  <p className={cx('font-serif text-xl md:text-2xl', dark ? 'text-cream' : 'text-ink')}>{children}</p>
)

function Hero() {
  const today = todayWIB()
  return (
    <section className="relative overflow-hidden border-b-[3px] border-ink bg-orange">
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1.45fr_1fr] lg:items-center">
        <div>
          <p className="label-caps text-[11px]">Reservasi meja online · Gain Circle Coffee</p>
          <h1 className="mt-3 text-[76px] leading-[.88] text-ink sm:text-[120px] lg:text-[150px]">
            Book your{' '}
            <span className="text-cream" style={{ WebkitTextStroke: '0' }}>
              table.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg font-medium">
            Pilih tanggal, jam, dan meja. E-ticket langsung terbit, tanpa nunggu balasan admin.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button to="/reservasi" variant="ink" size="lg">
              Reservasi meja
            </Button>
            <Button to="/cek-tiket" variant="orange" size="lg">
              Cek e-ticket
            </Button>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm pt-6 lg:max-w-none" aria-hidden="true">
          <div className="absolute -right-3 -top-7 z-10 hidden sm:block">
            <StickerCalendar size={92} rotate={8} />
          </div>
          <div className="rotate-[-4deg] border-2 border-ink bg-yellow p-5 shadow-card">
            <p className="font-serif text-lg font-bold">Your table</p>
            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-[96px] leading-[.85]">T05</p>
              <div className="pb-1 text-right">
                <p className="label-caps text-[10px]">Kode reservasi</p>
                <p className="font-display text-2xl">GC-2611-0187</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-ink pt-3">
              <p className="font-display text-lg uppercase">{formatDateShort(today)}</p>
              <p className="label-caps text-[10px]">19.00 – 21.00 · contoh tiket</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end pr-4">
            <StickerCassette size={130} rotate={0} />
          </div>
        </div>
      </div>
      <p className="container-page pb-5 text-right text-xs font-extrabold uppercase tracking-wide">
        Buka setiap hari {OPEN_TEXT}
      </p>
    </section>
  )
}

function Steps() {
  const steps = [
    [
      'Masuk atau daftar',
      'Daftar sekali dengan nama, email, dan nomor WhatsApp. Cuma 1 menit.',
      'Sekali saja',
    ],
    ['Pilih jam & meja', 'Pilih tanggal, slot, lalu klik meja di denah. Status meja real-time.', 'Real-time'],
    ['Dapat e-ticket', 'Isi data singkat, e-ticket langsung terbit. Tunjukkan saat datang.', 'Otomatis'],
  ]
  return (
    <section id="cara" className="scroll-mt-16 bg-cream py-16 md:py-24">
      <div className="container-page">
        <Eyebrow>Tiga langkah</Eyebrow>
        <h2 className="mt-1 text-6xl md:text-8xl">Cara reservasi</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(([t, d, tag], i) => (
            <li key={t} className="border-2 border-ink bg-card p-6 shadow-card">
              <p className="font-display text-7xl leading-none text-orange">0{i + 1}</p>
              <h3 className="mt-3 text-3xl">{t}</h3>
              <p className="mt-2 max-w-xs text-[15px] text-muted">{d}</p>
              <Tag className="mt-4" rotate={0}>
                {tag}
              </Tag>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function FloorPreview() {
  const today = todayWIB()
  const days = useMemo(() => [today, addDays(today, 1), addDays(today, 2), addDays(today, 3)], [today])
  const [date, setDate] = useState(today)
  const [guests, setGuests] = useState(4)
  const [slot, setSlot] = useState(() => nextSlot(today).id)
  const tables = useTables()
  const av = useAvailability(date, slot)
  const free = tables.data ? tables.data.filter((t) => av.map[t.id]?.status === 'free').length : 0
  const booked = tables.data ? tables.data.length - free : 0
  const label = (d, i) => (i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : formatChipDate(d))
  const sel = 'label-caps h-11 border-2 border-ink bg-card px-4 text-xs text-ink'
  const to = `/reservasi?tanggal=${date}&jam=${slot}&tamu=${guests}`
  return (
    <section id="denah" className="scroll-mt-16 bg-ink py-16 text-cream md:py-24">
      <div className="container-page">
        <Eyebrow dark>Lihat dulu, pilih kemudian</Eyebrow>
        <h2 className="mt-1 text-6xl md:text-8xl">Denah meja</h2>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih tanggal">
            {days.map((d, i) => (
              <button
                key={d}
                type="button"
                aria-pressed={d === date}
                onClick={() => setDate(d)}
                className={cx(
                  'label-caps h-11 border-2 border-ink px-4 text-xs',
                  d === date ? 'bg-neon text-ink' : 'bg-card text-ink',
                )}
              >
                {label(d, i)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Jumlah tamu"
              value={guests}
              onChange={(e) => setGuests(+e.target.value)}
              className={sel}
            >
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} tamu
                </option>
              ))}
            </select>
            <select
              aria-label="Pilih jam"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className={sel}
            >
              {SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.range}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="border-2 border-cream bg-card text-ink">
            <div className="flex items-center justify-between border-b-2 border-ink bg-orange px-4 py-2">
              <span className="font-display text-xl uppercase">Denah Gain Circle</span>
              <span className="label-caps text-xs">Live</span>
            </div>
            <div className="p-3 sm:p-6">
              {tables.error ? (
                <ErrorState error={tables.error} onRetry={tables.reload} compact />
              ) : tables.loading || av.loading ? (
                <Skeleton className="aspect-[640/430] w-full" />
              ) : av.error ? (
                <ErrorState error={av.error} onRetry={av.reload} compact />
              ) : (
                <FloorPlan
                  tables={tables.data}
                  statusOf={(id) => (av.map[id]?.status === 'free' ? 'kosong' : 'dipesan')}
                  disabledIds={[]}
                  label={`Denah meja ${date} jam ${slotById(slot).range}`}
                />
              )}
              <div className="mt-4">
                <Legend items={['kosong', 'dipesan']} />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-4xl">Status meja</h3>
            <div className="mt-5 divide-y-2 divide-cream/30 border-y-2 border-cream/30" aria-live="polite">
              {[
                ['Tersedia', free, '#F2EDDE'],
                ['Dipesan', booked, '#CA5C34'],
              ].map(([k, n, c]) => (
                <div key={k} className="flex items-center gap-4 py-4">
                  <span className="font-display text-7xl leading-none">{String(n).padStart(2, '0')}</span>
                  <div>
                    <p className="flex items-center gap-2 font-display text-2xl uppercase">
                      <span className="h-4 w-4 border-2 border-ink" style={{ background: c }} />
                      {k}
                    </p>
                    <p className="text-xs text-cream/70">
                      {formatChipDate(date)}, {slotById(slot).range}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button to={to} size="lg" block className="mt-6">
              Pesan meja
            </Button>
            <p className="mt-3 font-serif text-lg font-bold text-neon">
              Meja ditahan 15 menit dari awal slot.
            </p>
            <p className="mt-2 text-xs text-cream/60">
              Status berdasarkan reservasi lewat website ini. Pelanggan yang datang langsung belum tercatat
              otomatis.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Community() {
  const cards = [
    [
      '#2649D2',
      'Komunitas Motor',
      'Kumpul rame-rame, amankan meja panjang untuk geng.',
      'Meja T10 · 8 kursi',
      '#fff',
      'Pesan T10',
      '/reservasi',
    ],
    [
      '#FDD923',
      'Event Kreatif',
      'Pop-up, gigs kecil, launching. Tanya paket event lewat Instagram.',
      'Hubungi kami',
      '#171210',
      'Hubungi kami',
      ENV.instagram,
    ],
    [
      '#FC2685',
      'Nongkrong Malam',
      'Datang berdua atau berempat, meja ditahan 15 menit.',
      'Meja T01–T09',
      '#171210',
      'Pesan meja',
      '/reservasi',
    ],
  ]
  return (
    <section className="relative bg-cream py-16 md:py-24">
      <div className="container-page">
        <div className="flex items-start justify-between">
          <div>
            <Eyebrow>Datang ramean?</Eyebrow>
            <h2 className="mt-1 text-6xl md:text-8xl">Komunitas &amp; event</h2>
          </div>
          <div className="hidden md:block">
            <StickerCup size={110} rotate={8} />
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map(([bg, t, d, tag, fg, cta, href]) => (
            <article
              key={t}
              className="flex flex-col border-2 border-ink p-6 shadow-card"
              style={{ background: bg, color: fg }}
            >
              <p className="label-caps text-[10px]">Gain Coffee Circle</p>
              <h3 className="mt-3 font-serif text-4xl font-bold normal-case leading-tight">{t}</h3>
              <p className="mt-3 flex-1 text-[15px]">{d}</p>
              {href.startsWith('http') ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-caps mt-6 inline-block self-start border-2 border-ink bg-white px-3 py-2 text-[11px] text-ink"
                >
                  {cta} ↗
                </a>
              ) : (
                <Link
                  to={href}
                  className="label-caps mt-6 inline-block self-start border-2 border-ink bg-white px-3 py-2 text-[11px] text-ink"
                >
                  {tag}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Location() {
  return (
    <section id="lokasi" className="relative scroll-mt-16 bg-orange py-16 md:py-24">
      <div className="container-page">
        <div className="flex items-start justify-between">
          <div>
            <Eyebrow>Mampir ke</Eyebrow>
            <h2 className="mt-1 text-6xl text-ink md:text-8xl">Jam &amp; lokasi</h2>
          </div>
          <div className="hidden md:block">
            <StickerBooked size={96} />
          </div>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="border-2 border-ink bg-card p-7 shadow-card">
            <p className="label-caps text-[11px] text-muted">Setiap hari</p>
            <p className="mt-1 border-b-[3px] border-ink pb-4 font-display text-6xl leading-none sm:text-7xl">
              07.00 – 00.00 WIB
            </p>
            <p className="mt-4 text-xl font-extrabold">{ADDRESS}</p>
            <p className="mt-1 text-[15px] text-muted">Street coffee, dari pagi sampai tengah malam.</p>
            <Button href={ENV.maps} variant="ink" className="mt-6">
              Buka di Maps ↗
            </Button>
          </div>
          <a
            href={ENV.maps}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka lokasi Gain Circle Coffee di Google Maps"
            className="group relative block min-h-64 overflow-hidden border-2 border-ink bg-card shadow-card"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 400 260"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid slice"
            >
              <rect width="400" height="260" fill="#F8F3ED" />
              <path d="M0 70H400M0 185H400M120 0V260M290 0V260" stroke="#fff" strokeWidth="26" />
              <path
                d="M0 70H400M0 185H400M120 0V260M290 0V260"
                stroke="#E9DFCE"
                strokeWidth="2"
                strokeDasharray="10 8"
              />
            </svg>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-orange">
                <StarIcon size={22} color="#171210" />
              </span>
              <span className="label-caps mt-2 block bg-card px-2 py-1 text-[10px]">Gain Circle Coffee</span>
            </div>
            <span className="label-caps absolute bottom-3 right-3 border-2 border-ink bg-neon px-3 py-1.5 text-[11px] group-hover:bg-yellow">
              Buka peta ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

const FAQ = [
  [
    'Pembayaran',
    'Apakah perlu bayar saat reservasi?',
    'Tidak. Sistem hanya untuk reservasi meja. Pesan menu langsung di kasir.',
  ],
  ['Waktu', 'Berapa lama meja ditahan?', '15 menit dari awal slot. Lewat itu, meja dilepas untuk tamu lain.'],
  [
    'Meja penuh',
    'Kalau meja yang aku mau penuh?',
    'Pilih slot atau tanggal lain. Denah memperbarui status secara real-time.',
  ],
  [
    'Akun',
    'Perlu daftar akun?',
    'Ya, sekali saja dengan nama, email, dan nomor WhatsApp. Maksimal 2 jam per sesi.',
  ],
  [
    'Ubah atau batal',
    'Bagaimana kalau jadwalku berubah?',
    'Hubungi Gain Circle lewat Instagram @gain.circle sebelum jam mulai agar meja bisa dilepas.',
  ],
]
function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="scroll-mt-16 bg-cream py-16 md:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-[360px_1fr]">
        <div>
          <Eyebrow>Sebelum datang</Eyebrow>
          <h2 className="mt-1 text-7xl leading-[.9] md:text-8xl">Tanya dulu</h2>
        </div>
        <div className="border-t-[3px] border-ink">
          {FAQ.map(([k, q, a], i) => (
            <div key={q} className="border-b-[3px] border-ink">
              <h3 className="font-body text-base normal-case">
                <button
                  type="button"
                  aria-expanded={open === i}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="flex w-full items-center gap-4 py-5 text-left"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center border-2 border-ink bg-card font-display text-xl"
                    aria-hidden="true"
                  >
                    {open === i ? '−' : '+'}
                  </span>
                  <span>
                    <span className="block font-serif text-sm font-normal text-muted">{k}</span>
                    <span className="block font-display text-2xl uppercase leading-tight md:text-3xl">
                      {q}
                    </span>
                  </span>
                </button>
              </h3>
              {open === i && (
                <p id={`faq-${i}`} className="pb-5 pl-[52px] text-[15px] text-muted">
                  {a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  useDocTitle('')
  return (
    <>
      <Hero />
      <Steps />
      <FloorPreview />
      <Community />
      <Location />
      <Faq />
    </>
  )
}
