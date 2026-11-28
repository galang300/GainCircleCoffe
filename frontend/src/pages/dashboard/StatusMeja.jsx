import { useEffect, useMemo, useState } from 'react'
import FloorPlan, { Legend } from '../../features/reservation/FloorPlan'
import { useTables } from '../../features/reservation/hooks'
import Button from '../../components/ui/Button'
import { ErrorState, Skeleton, useToast } from '../../components/ui/Feedback'
import { Pill } from '../../components/ui/Pill'
import { staffApi } from '../../lib/api'
import { TABLE_STATUS } from '../../lib/constants'
import { formatClock } from '../../lib/format'
import { toAppError } from '../../lib/errors'
import { useAsync, useDocTitle, usePolling } from '../../lib/hooks'
import { cx } from '../../lib/cx'

const OPTIONS = ['kosong', 'dipesan', 'terisi', 'perlu_disiapkan']

export default function StatusMeja() {
  useDocTitle('Status meja')
  const toast = useToast()
  const tables = useTables()
  const st = useAsync(() => staffApi.tableStatus(), [])
  const log = useAsync(() => staffApi.tableLog(), [])
  usePolling(() => {
    st.refresh()
    log.refresh()
  }, 15000)
  const [sel, setSel] = useState(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const map = useMemo(() => Object.fromEntries((st.data || []).map((t) => [t.id, t])), [st.data])
  const cur = sel && map[sel]
  useEffect(() => {
    if (cur) setDraft(cur.status)
  }, [sel, cur?.status]) // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(
    () => OPTIONS.map((k) => [k, (st.data || []).filter((t) => t.status === k).length]),
    [st.data],
  )

  const save = async () => {
    const prev = st.data
    st.setData((d) => d.map((t) => (t.id === sel ? { ...t, status: draft } : t))) // optimistik
    setBusy(true)
    try {
      await staffApi.setTableStatus(sel, draft)
      toast.success(`Meja ${sel} → ${TABLE_STATUS[draft].label}`, 'Tampil di denah pelanggan.')
      log.refresh()
      st.refresh()
    } catch (e) {
      st.setData(prev)
      toast.error('Status tidak tersimpan', toAppError(e).message)
    } finally {
      // rollback
      setBusy(false)
    }
  }
  const error = tables.error || st.error
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section aria-label="Denah status meja" className="border-2 border-ink bg-card shadow-card">
        <div className="flex items-center justify-between border-b-2 border-ink bg-orange px-4 py-2.5">
          <h2 className="text-2xl">Denah Gain Circle</h2>
          <span className="label-caps text-xs">Ketuk meja untuk ubah status</span>
        </div>
        <div className="p-3 sm:p-6">
          {error ? (
            <ErrorState
              error={error}
              onRetry={() => {
                tables.reload()
                st.reload()
              }}
            />
          ) : tables.loading || st.loading ? (
            <Skeleton className="aspect-[640/430] w-full" />
          ) : (
            <FloorPlan
              tables={tables.data}
              statusOf={(id) => map[id]?.status}
              selectedId={null}
              onSelect={setSel}
              label="Denah status meja"
            />
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Legend items={OPTIONS} />
            <p className="text-xs text-muted">Diperbarui otomatis tiap 15 detik</p>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {counts.map(([k, n]) => (
              <li key={k} className="border-2 border-ink bg-white p-2 text-center">
                <span className="font-display text-3xl">{n}</span>
                <span className="label-caps block text-[10px] text-muted">{TABLE_STATUS[k].label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="space-y-6">
        <section aria-label="Ubah status meja" className="border-2 border-ink bg-card shadow-card">
          <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
            <h2 className="text-3xl">{sel ? `Meja ${sel}` : 'Pilih meja'}</h2>
            {cur && (
              <Pill bg={TABLE_STATUS[cur.status].bg} fg={TABLE_STATUS[cur.status].fg}>
                {TABLE_STATUS[cur.status].label}
                {cur.next ? ` ${cur.next}` : ''}
              </Pill>
            )}
          </div>
          {!sel ? (
            <p className="p-5 text-sm text-muted">
              Klik meja di denah untuk melihat dan mengubah statusnya. Perubahan langsung tampil di denah
              pelanggan.
            </p>
          ) : (
            <div className="p-4">
              <p className="label-caps mb-2 text-[11px]">Ubah status</p>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Status meja">
                {OPTIONS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={draft === k}
                    onClick={() => setDraft(k)}
                    className={cx(
                      'label-caps min-h-12 border-2 border-ink px-2 text-xs',
                      draft === k ? 'bg-ink text-cream' : 'bg-white',
                    )}
                  >
                    {TABLE_STATUS[k].label}
                  </button>
                ))}
              </div>
              <Button
                block
                size="lg"
                className="mt-4"
                loading={busy}
                disabled={draft === cur?.status}
                onClick={save}
              >
                Simpan status
              </Button>
            </div>
          )}
        </section>
        <section aria-label="Log perubahan" className="border-2 border-ink bg-card shadow-cardsm">
          <h2 className="border-b-2 border-ink px-4 py-3 text-2xl">Log terakhir</h2>
          {log.loading ? (
            <div className="p-4">
              <Skeleton className="h-16" />
            </div>
          ) : (log.data || []).length === 0 ? (
            <p className="p-4 text-sm text-muted">Belum ada perubahan hari ini.</p>
          ) : (
            <ul className="divide-y divide-line">
              {log.data.slice(0, 8).map((l) => (
                <li key={l.id} className="flex gap-3 px-4 py-2.5 text-sm">
                  <span className="text-muted">{formatClock(l.at)}</span>
                  <span>
                    <b>{l.table}</b> → {TABLE_STATUS[l.status]?.label}{' '}
                    <span className="text-muted">({l.by})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
