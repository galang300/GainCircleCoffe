import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Donut, GroupedBars, NetBars, RatioMeter, ShapBars } from '../../features/cashflow/charts'
import Button from '../../components/ui/Button'
import { DataBadge, EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback'
import { CashStatus, Chip, Segmented } from '../../components/ui/Pill'
import { cashApi } from '../../lib/api'
import { CASH_STATUS, CATEGORIES, THRESHOLDS } from '../../lib/constants'
import { formatDayMonthClock, percent, rupiahJt } from '../../lib/format'
import { useAsync, useDocTitle } from '../../lib/hooks'
import { cx } from '../../lib/cx'

const HERO_BG = { sehat: '#75F237', waspada: '#FDD923', kritis: '#FC2685', belum: '#E9DFCE' }
const Panel = ({ title, sub, children, className }) => (
  <section className={cx('border-2 border-ink bg-card p-5 shadow-card sm:p-6', className)}>
    <h2 className="text-3xl">{title}</h2>
    {sub && <p className="mb-4 text-xs text-muted">{sub}</p>}
    {children}
  </section>
)

export default function ArusKas() {
  useDocTitle('Arus kas')
  const nav = useNavigate()
  const [period, setPeriod] = useState('month')
  const [category, setCategory] = useState('')
  const q = useAsync(async () => {
    const p = { period, category: category || undefined }
    const [summary, series, categories, shap, history] = await Promise.all([
      cashApi.summary(p),
      cashApi.series(p),
      cashApi.categories(p),
      cashApi.shap(p),
      cashApi.history(),
    ])
    return { summary, series, categories, shap, history }
  }, [period, category])
  const ask = (text) => nav('/dashboard/asisten', { state: { q: text } })
  const [draft, setDraft] = useState('')
  const s = q.data?.summary
  const unit = period === 'month' ? 'bulan' : 'minggu'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Periode"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'month', label: 'Bulanan' },
            { value: 'week', label: 'Mingguan' },
          ]}
        />
        <label className="sr-only" htmlFor="kat">
          Kategori
        </label>
        <select
          id="kat"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="label-caps h-10 border-2 border-ink bg-white px-3 text-xs"
        >
          <option value="">Kategori: semua</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <p className="ml-auto flex items-center gap-2 text-xs text-muted">
          <DataBadge />
          {s ? `Diperbarui ${formatDayMonthClock(s.updated_at)}` : ''}
        </p>
      </div>

      {q.loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-24" />
          <Skeleton className="h-80" />
        </div>
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.reload} />
      ) : s.status === 'belum' ? (
        <EmptyState
          symbol="?"
          title="Belum cukup data"
          text="Catat pengeluaran dan omzet (minimal beberapa hari) agar status kas bisa dihitung."
          action={
            <>
              <Button to="/dashboard/pengeluaran">Catat pengeluaran</Button>
              <Button to="/dashboard/pemasukan/impor" variant="white">
                Impor sales
              </Button>
            </>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <section
              aria-label="Status kas"
              className="border-2 border-ink p-6 shadow-card sm:p-8"
              style={{ background: HERO_BG[s.status] }}
            >
              <p className="label-caps text-[11px]">
                Status kas · {period === 'month' ? 'bulan ini' : 'minggu ini'}
              </p>
              {s.model_error ? (
                <div role="alert" className="mt-3">
                  <p className="font-display text-5xl uppercase">Model gagal menghitung</p>
                  <p className="mt-2 text-sm">Data mentah tetap tersedia di bawah. Coba hitung ulang.</p>
                  <div className="mt-4 flex gap-3">
                    <Button variant="ink" onClick={q.reload}>
                      Hitung ulang
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className="mt-1 font-display text-[88px] uppercase leading-[.9] sm:text-[140px]"
                    aria-live="polite"
                  >
                    {CASH_STATUS[s.status].label}
                  </p>
                  <p className="mt-3 max-w-lg text-[15px]">
                    Rasio pengeluaran / omzet {percent(s.ratio)}. Batas Sehat ≤ {percent(THRESHOLDS.sehat)},
                    Kritis &gt; {percent(THRESHOLDS.kritis)}.
                    {s.confidence != null && <> Model memberi keyakinan {percent(s.confidence)}.</>}
                  </p>
                  <div className="mt-5 max-w-xl">
                    <RatioMeter ratio={s.ratio} />
                  </div>
                </>
              )}
            </section>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Total pemasukan (inflow)', rupiahJt(s.inflow), 'text-[#2f8a0d]', s.inflow_note],
                [
                  'Total pengeluaran (outflow)',
                  rupiahJt(s.outflow),
                  'text-orange',
                  `rasio ${percent(s.ratio)} dari inflow`,
                ],
                ['Net cashflow', rupiahJt(s.inflow - s.outflow), '', s.net_note],
                [
                  'Kategori terbesar',
                  s.top_category?.name || '–',
                  '',
                  s.top_category ? `${percent(s.top_category.share)} dari outflow` : '',
                ],
              ].map(([k, v, c, n]) => (
                <div key={k} className="border-2 border-ink bg-card p-4">
                  <p className="label-caps text-[10px] text-muted">{k}</p>
                  <p className={cx('mt-2 font-display text-3xl sm:text-4xl', c)}>{v}</p>
                  <p className="mt-1 text-xs text-muted">{n}</p>
                </div>
              ))}
            </div>
          </div>

          {s.warning && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-4 border-2 border-ink bg-orange p-4"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-yellow font-display text-2xl"
                aria-hidden="true"
              >
                !
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">EARLY WARNING: {s.warning.title}</p>
                <p className="text-[13px]">{s.warning.detail}</p>
              </div>
              <Button variant="neon" onClick={() => ask(s.warning.ask)}>
                Tanya AI
              </Button>
            </div>
          )}

          <Panel title="Inflow vs Outflow" sub={`Grouped bar · juta rupiah per ${unit}`}>
            <div className="mb-2 flex gap-5 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <i className="h-3 w-3 border border-ink bg-neon" />
                Inflow
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-3 w-3 border border-ink bg-orange" />
                Outflow
              </span>
            </div>
            <GroupedBars data={q.data.series} />
            <p className="mt-1 text-xs text-muted">
              * {period === 'month' ? 'Bulan' : 'Minggu'} ini masih berjalan
            </p>
          </Panel>
          <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
            <Panel title="Net cashflow" sub={`Bar · inflow − outflow, juta rupiah per ${unit}`}>
              <NetBars data={q.data.series} />
            </Panel>
            <Panel title="Outflow per kategori">
              <Donut items={q.data.categories} totalLabel={rupiahJt(s.outflow).replace('Rp ', '')} />
            </Panel>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Panel
              title={`Kenapa ${CASH_STATUS[s.status].label}? (SHAP)`}
              sub="Faktor yang mendorong status naik atau turun"
            >
              <ShapBars factors={q.data.shap} />
            </Panel>
            <Panel title="Aturan label">
              <ul className="space-y-3">
                {[
                  ['sehat', `Rasio ≤ ${percent(THRESHOLDS.sehat)}`],
                  ['waspada', `${percent(THRESHOLDS.sehat)} – ${percent(THRESHOLDS.kritis)}`],
                  ['kritis', `> ${percent(THRESHOLDS.kritis)}`],
                ].map(([k, t]) => (
                  <li key={k} className="flex items-center justify-between gap-3">
                    <CashStatus status={k} />
                    <span className="text-sm font-bold">{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">
                Disepakati bersama owner.
                {s.f1 != null && <> F1-score model: {s.f1.toFixed(2).replace('.', ',')} (data uji).</>}
              </p>
            </Panel>
          </div>
          <Panel
            title="Riwayat analisis status kas"
            sub="Setiap hasil klasifikasi model disimpan: tanggal, status, rasio, keyakinan, faktor utama"
          >
            <div className="scroll-x">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="sr-only">Riwayat analisis</caption>
                <thead className="bg-ink text-neon">
                  <tr>
                    {['Tanggal', 'Status', 'Rasio', 'Keyakinan', 'Faktor utama'].map((h) => (
                      <th key={h} scope="col" className="label-caps px-4 py-2.5 text-[11px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {q.data.history.map((h) => (
                    <tr key={h.id} className="border-b border-line odd:bg-white/60">
                      <td className="px-4 py-3">{formatDayMonthClock(h.at)}</td>
                      <td className="px-4">
                        <CashStatus status={h.status} />
                      </td>
                      <td className="px-4">{percent(h.ratio)}</td>
                      <td className="px-4">{percent(h.confidence)}</td>
                      <td className="px-4">{h.factor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <section
            className="border-2 border-ink bg-ink p-5 text-cream shadow-card sm:p-7"
            aria-label="Tanya asisten AI"
          >
            <h2 className="text-4xl text-yellow">Asisten AI</h2>
            <p className="mt-1 text-sm">Tanya langsung soal kondisi kas dengan bahasa sehari-hari.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Kenapa status kas bulan ini ' + CASH_STATUS[s.status].label.toLowerCase() + '?',
                'Pengeluaran apa yang paling besar bulan ini?',
                'Apa yang bisa dihemat?',
              ].map((t) => (
                <Chip key={t} onClick={() => ask(t)}>
                  {t}
                </Chip>
              ))}
            </div>
            <form
              className="mt-4 flex gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                draft.trim() && ask(draft.trim())
              }}
            >
              <input
                aria-label="Pertanyaan untuk asisten"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Tulis pertanyaanmu…"
                className="h-12 min-w-0 flex-1 border-2 border-cream bg-[#2a211e] px-4 text-cream placeholder:text-cream/50"
              />
              <Button type="submit" variant="yellow">
                Kirim
              </Button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
