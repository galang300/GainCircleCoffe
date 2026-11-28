import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { DataBadge, Skeleton } from '../../components/ui/Feedback'
import { CashStatus, Chip } from '../../components/ui/Pill'
import { StickerCloud } from '../../components/brand/Stickers'
import { assistantApi, cashApi } from '../../lib/api'
import { formatClock, percent } from '../../lib/format'
import { toAppError } from '../../lib/errors'
import { useAsync, useDocTitle } from '../../lib/hooks'
import { cx } from '../../lib/cx'

const SUGGEST = [
  'Kenapa status kas bulan ini waspada?',
  'Pengeluaran apa yang paling besar bulan ini?',
  'Apa yang bisa dihemat?',
  'Bandingkan dengan minggu lalu',
  'Kapan status bisa kritis?',
]
let uid = 0

function Bubble({ m, onRetry }) {
  if (m.role === 'user')
    return (
      <div className="ml-auto max-w-[85%] border-2 border-ink bg-neon px-4 py-3 text-[15px] shadow-btn">
        {m.text}
      </div>
    )
  if (m.error) {
    return (
      <div role="alert" className="max-w-[92%] border-2 border-ink bg-pink/25 p-4">
        <div className="flex gap-3">
          <StickerCloud size={44} />
          <div>
            <p className="font-extrabold">Asisten sedang tidak bisa menjawab</p>
            <p className="text-sm">{m.text}</p>
          </div>
        </div>
        {m.fallback && (
          <p className="mt-3 border-t-2 border-ink pt-3 text-sm">
            <b>Ringkasan tanpa AI:</b> {m.fallback}
          </p>
        )}
        <Button size="sm" variant="orange" className="mt-3" onClick={() => onRetry(m.question)}>
          Coba lagi
        </Button>
      </div>
    )
  }
  return (
    <div className="max-w-[92%] border-2 border-ink bg-white p-4 shadow-cardsm">
      <p className="label-caps mb-1.5 text-[10px] text-rust">Asisten AI · {formatClock(m.at)}</p>
      <p className="whitespace-pre-line text-[15px] leading-relaxed">{m.text}</p>
      {(m.sources?.length > 0 || m.intent) && (
        <p className="mt-3 border-t border-line pt-2 text-[11px] text-muted">
          {m.intent && (
            <>
              Intent: <b>{m.intent}</b> ({m.intent_score?.toFixed(2)}) ·{' '}
            </>
          )}
          {m.sources?.join(' · ')}
        </p>
      )}
    </div>
  )
}

export default function Asisten() {
  useDocTitle('Asisten AI')
  const loc = useLocation()
  const hist = useAsync(() => assistantApi.history(), [])
  const ctx = useAsync(() => cashApi.summary({ period: 'month' }), [])
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    if (hist.data) setMsgs(hist.data.map((h) => ({ ...h, id: ++uid })))
  }, [hist.data])
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs, busy])

  const send = async (q) => {
    const question = (q ?? text).trim()
    if (!question || busy) return
    setText('')
    setBusy(true)
    setMsgs((l) => [
      ...l.filter((m) => !(m.error && m.question === question)),
      { id: ++uid, role: 'user', text: question },
    ])
    try {
      const r = await assistantApi.send(question)
      setMsgs((l) => [...l, { id: ++uid, role: 'assistant', ...r, at: r.created_at }])
    } catch (e) {
      const a = toAppError(e)
      setMsgs((l) => [
        ...l,
        { id: ++uid, role: 'assistant', error: true, question, text: a.message, fallback: a.meta?.fallback },
      ])
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    // pertanyaan dari halaman Arus Kas
    const q = loc.state?.q
    if (q && !started.current && hist.data) {
      started.current = true
      send(q)
      window.history.replaceState({}, '')
    }
  }, [hist.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const s = ctx.data
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <section
        aria-label="Percakapan dengan asisten"
        className="flex min-h-[70vh] flex-col border-2 border-ink bg-card shadow-card"
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-5 py-3 text-cream">
          <h2 className="text-2xl text-yellow">Asisten AI</h2>
          <DataBadge />
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite" aria-busy={busy}>
          {hist.loading ? (
            <Skeleton className="h-24 w-3/4" />
          ) : (
            msgs.length === 0 && (
              <div className="max-w-md border-2 border-dashed border-ink p-5">
                <p className="font-display text-2xl uppercase">Tanya soal kas</p>
                <p className="mt-1 text-sm text-muted">
                  Asisten menjawab berdasarkan data kas yang tercatat. Pertanyaan di luar topik keuangan kafe
                  tidak dijawab.
                </p>
              </div>
            )
          )}
          {msgs.map((m) => (
            <Bubble key={m.id} m={m} onRetry={send} />
          ))}
          {busy && (
            <div role="status" className="max-w-[60%] border-2 border-ink bg-white p-4">
              <p className="label-caps mb-2 text-[10px] text-orange">Asisten sedang menjawab…</p>
              <Skeleton className="h-3 w-48" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          )}
          <div ref={end} />
        </div>
        <div className="border-t-2 border-ink p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGEST.map((t) => (
              <Chip key={t} disabled={busy} onClick={() => send(t)} className="!min-h-9 !text-[11px]">
                {t}
              </Chip>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="flex gap-3"
          >
            <input
              aria-label="Tulis pertanyaan"
              value={text}
              maxLength={300}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pertanyaanmu…"
              className="h-12 min-w-0 flex-1 border-2 border-ink bg-white px-4"
            />
            <Button type="submit" variant="yellow" loading={busy} disabled={!text.trim()}>
              Kirim
            </Button>
          </form>
        </div>
      </section>
      <aside aria-label="Data yang dibaca asisten" className="h-fit border-2 border-ink bg-card shadow-card">
        <h2 className="border-b-2 border-ink bg-orange px-4 py-2.5 text-2xl">Data yang dibaca</h2>
        <div className="p-4">
          {ctx.loading ? (
            <Skeleton className="h-32" />
          ) : !s ? (
            <p className="text-sm text-muted">Data konteks belum tersedia.</p>
          ) : (
            <dl className="divide-y divide-line text-sm">
              {[
                ['Status kas', <CashStatus key="s" status={s.status} />],
                ['Rasio', s.ratio != null ? percent(s.ratio) : '–'],
                ['Faktor utama', s.main_factor || '–'],
                [
                  'Kategori terbesar',
                  s.top_category ? `${s.top_category.name} ${percent(s.top_category.share)}` : '–',
                ],
                ['Periode', s.period_label],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="label-caps text-[10px] text-muted">{k}</dt>
                  <dd className="text-right font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-4 text-xs text-muted">
            Jawaban memakai data kas di atas dan glosarium internal (RAG). Sumber ditampilkan di setiap
            jawaban.
          </p>
          <Link to="/dashboard/kas" className="label-caps mt-3 inline-block text-xs text-rust underline">
            Lihat arus kas →
          </Link>
        </div>
      </aside>
    </div>
  )
}
