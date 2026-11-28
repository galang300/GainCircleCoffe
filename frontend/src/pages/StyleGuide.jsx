import { useState } from 'react'
import Button from '../components/ui/Button'
import { CashStatus, Chip, Pill, ResStatus, Tag } from '../components/ui/Pill'
import { Checkbox, SelectField, Stepper, TextField } from '../components/ui/Fields'
import { Banner, EmptyState, ErrorState, Modal, Skeleton, useToast } from '../components/ui/Feedback'
import OtpInput from '../components/ui/OtpInput'
import Logo from '../components/brand/Logo'
import {
  StarIcon,
  StickerBadge,
  StickerBell,
  StickerBooked,
  StickerCalendar,
  StickerCassette,
  StickerCloud,
  StickerCup,
} from '../components/brand/Stickers'
import FloorPlan, { Legend } from '../features/reservation/FloorPlan'
import { TABLE_LAYOUT } from '../lib/constants'

const COLORS = [
  ['orange', '#CA5C34'],
  ['ink', '#171210'],
  ['cream', '#F2EDDE'],
  ['neon', '#75F237'],
  ['blue', '#2649D2'],
  ['yellow', '#FDD923'],
  ['pink', '#FC2685'],
  ['card', '#F8F3ED'],
  ['beige', '#E9DFCE'],
  ['rust', '#9B3A22'],
  ['line', '#D5CAB4'],
  ['muted', '#6E655C'],
]
const S = ({ title, children }) => (
  <section className="border-t-[3px] border-ink py-8">
    <h2 className="mb-5 text-4xl">{title}</h2>
    {children}
  </section>
)

/** Halaman referensi desain (hanya build dev). Rute: /dev/style-guide */
export default function StyleGuide() {
  const toast = useToast()
  const [m, setM] = useState(false)
  const [otp, setOtp] = useState('48')
  return (
    <div className="container-page py-10">
      <div className="flex items-center gap-5">
        <div className="bg-ink p-3">
          <Logo />
        </div>
        <h1 className="text-7xl">Style guide</h1>
      </div>
      <S title="Warna">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {COLORS.map(([n, h]) => (
            <div key={n} className="border-2 border-ink">
              <div className="h-16" style={{ background: h }} />
              <p className="label-caps p-2 text-[10px]">
                {n}
                <br />
                {h}
              </p>
            </div>
          ))}
        </div>
      </S>
      <S title="Tipografi">
        <p className="font-display text-8xl uppercase leading-none">Anton display</p>
        <p className="mt-2 font-serif text-3xl font-bold">Tinos serif untuk eyebrow dan nama</p>
        <p className="mt-2 text-base">
          Archivo untuk teks isi. <b>Tebal</b> dan <span className="label-caps">LABEL CAPS</span>
        </p>
      </S>
      <S title="Tombol & chip">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Neon</Button>
          <Button variant="ink">Ink</Button>
          <Button variant="orange">Orange</Button>
          <Button variant="yellow">Yellow</Button>
          <Button variant="pink">Pink</Button>
          <Button variant="white">White</Button>
          <Button disabled>Nonaktif</Button>
          <Button loading>Memuat</Button>
          <Chip active>Aktif</Chip>
          <Chip>Chip</Chip>
          <Tag>Tag</Tag>
        </div>
      </S>
      <S title="Status">
        <div className="flex flex-wrap gap-3">
          {['dikonfirmasi', 'check_in', 'selesai', 'no_show', 'dibatalkan'].map((s) => (
            <ResStatus key={s} status={s} />
          ))}
          {['sehat', 'waspada', 'kritis', 'belum'].map((s) => (
            <CashStatus key={s} status={s} />
          ))}
          <Pill>Custom</Pill>
        </div>
      </S>
      <S title="Form">
        <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
          <TextField label="Nama" placeholder="Raka" />
          <TextField label="Email" error="Format email tidak valid" defaultValue="raka@" />
          <SelectField label="Kategori">
            <option>Bahan baku</option>
          </SelectField>
          <TextField label="Terkunci" readOnly value="Dari akunmu" />
          <Checkbox label="Saya setuju" />
          <OtpInput value={otp} onChange={setOtp} />
        </div>
        <div className="mt-6 max-w-2xl">
          <Stepper step={2} />
        </div>
      </S>
      <S title="Stiker">
        <div className="flex flex-wrap items-center gap-6">
          <StickerCalendar />
          <StickerCassette />
          <StickerCup />
          <StickerBooked />
          <StickerBell />
          <StickerCloud />
          <StickerBadge />
          <StarIcon size={40} />
        </div>
      </S>
      <S title="Denah">
        <div className="max-w-xl border-2 border-ink bg-card p-4">
          <FloorPlan
            tables={TABLE_LAYOUT}
            statusOf={(id) => ({ T02: 'dipesan', T07: 'terisi', T01: 'perlu_disiapkan' })[id]}
            selectedId="T05"
            onSelect={() => {}}
          />
          <div className="mt-3">
            <Legend items={['kosong', 'dipesan', 'dipilih', 'terisi', 'perlu_disiapkan']} />
          </div>
        </div>
      </S>
      <S title="State">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="border-2 border-ink bg-card">
            <ErrorState error={{ code: 'NETWORK' }} onRetry={() => {}} compact />
          </div>
          <div className="border-2 border-ink bg-card">
            <EmptyState title="Belum ada data" text="Contoh state kosong." />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Banner tone="yellow" title="Banner info">
              Teks pendukung.
            </Banner>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="white" onClick={() => toast.success('Berhasil', 'Contoh toast')}>
            Toast
          </Button>
          <Button variant="white" onClick={() => setM(true)}>
            Modal
          </Button>
        </div>
      </S>
      <Modal
        open={m}
        onClose={() => setM(false)}
        title="Contoh modal"
        tone="neon"
        tag="Info"
        actions={<Button onClick={() => setM(false)}>Tutup</Button>}
      >
        Fokus terjebak di dalam modal, Escape menutup.
      </Modal>
    </div>
  )
}
