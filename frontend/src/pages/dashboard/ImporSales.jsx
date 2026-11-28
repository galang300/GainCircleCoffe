import { useState } from 'react'
import { FinanceTabs } from './Finance'
import Button from '../../components/ui/Button'
import FileDropzone from '../../components/ui/FileDropzone'
import { Stepper } from '../../components/ui/Fields'
import { ErrorState, useToast } from '../../components/ui/Feedback'
import { financeApi } from '../../lib/api'
import { dmyInput, number, rupiah } from '../../lib/format'
import { toAppError } from '../../lib/errors'
import { validateSalesFile } from '../../lib/validators'
import { useDocTitle } from '../../lib/hooks'
import { cx } from '../../lib/cx'

function downloadErrors(rows) {
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`
  const csv = [
    'baris,tanggal,nilai,alasan',
    ...rows.map((r) => [r.row, r.date ?? '', r.value ?? '', r.reason].map(esc).join(',')),
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = 'baris-error-impor.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function ImporSales() {
  useDocTitle('Impor data sales')
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [fileErr, setFileErr] = useState('')
  const [prev, setPrev] = useState(null)
  const [done, setDone] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const reset = () => {
    setStep(1)
    setFile(null)
    setPrev(null)
    setDone(null)
    setError(null)
    setFileErr('')
  }
  const pick = async (f) => {
    const m = validateSalesFile(f)
    setFileErr(m)
    if (m) return
    setFile(f)
    setBusy(true)
    setError(null)
    try {
      setPrev(await financeApi.importPreview(f))
      setStep(2)
    } catch (e) {
      setError(toAppError(e))
    } finally {
      setBusy(false)
    }
  }
  const commit = async () => {
    setBusy(true)
    try {
      const r = await financeApi.importCommit(file)
      setDone(r)
      setStep(3)
      toast.success('Impor selesai', `${r.imported} baris disimpan`)
    } catch (e) {
      setError(toAppError(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <FinanceTabs />
      <Stepper stepper={['Pilih file', 'Cek data', 'Selesai']} step={step} />
      <div className="mt-6 border-2 border-ink bg-card p-5 shadow-card sm:p-8">
        {error && (
          <div className="mb-5">
            <ErrorState error={error} compact onRetry={step === 2 ? commit : () => file && pick(file)} />
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl">Impor omzet harian</h2>
              <FileDropzone
                onFile={pick}
                error={fileErr}
                disabled={busy}
                hint="Format .csv atau .xlsx, maksimal 2 MB, kolom: tanggal, total_omzet."
              />
              {busy && (
                <p role="status" className="mt-3 text-sm font-bold">
                  Membaca file…
                </p>
              )}
            </div>
            <div className="space-y-4 text-[15px]">
              <h3 className="text-2xl">Aturan file</h3>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Satu baris per hari: <code>tanggal</code> (YYYY-MM-DD) dan <code>total_omzet</code> (angka).
                </li>
                <li>Tanggal yang sudah ada akan ditimpa setelah kamu konfirmasi.</li>
                <li>Baris yang salah ditampilkan sebelum impor, dan tidak ikut disimpan.</li>
              </ul>
              <Button href="/templates/template_sales.csv" variant="yellow" download="template_sales.csv">
                Unduh template CSV
              </Button>
            </div>
          </div>
        )}
        {step === 2 && prev && (
          <div>
            <h2 className="text-3xl">Cek data · {file?.name}</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ['Baris valid', prev.valid, 'bg-neon'],
                ['Akan ditimpa', prev.overwrite, 'bg-yellow'],
                ['Error', prev.errors.length, prev.errors.length ? 'bg-pink' : 'bg-card'],
              ].map(([k, n, bg]) => (
                <div key={k} className={cx('border-2 border-ink p-3', bg)}>
                  <p className="font-display text-5xl leading-none">{number(n)}</p>
                  <p className="label-caps mt-1 text-[10px]">{k}</p>
                </div>
              ))}
            </div>
            {prev.rows.length > 0 && (
              <div className="scroll-x mt-5">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <caption className="sr-only">Pratinjau baris valid</caption>
                  <thead>
                    <tr className="border-b-2 border-ink">
                      {['Baris', 'Tanggal', 'Omzet', 'Keterangan'].map((h) => (
                        <th key={h} scope="col" className="label-caps py-2 text-[11px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prev.rows.slice(0, 8).map((r) => (
                      <tr key={r.row} className="border-b border-line">
                        <td className="py-2">{r.row}</td>
                        <td>{dmyInput(r.date)}</td>
                        <td className="tabular-nums">{rupiah(r.value)}</td>
                        <td>
                          {r.overwrite ? (
                            <span className="label-caps bg-yellow px-1.5 text-[10px]">Ditimpa</span>
                          ) : (
                            'Baru'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {prev.rows.length > 8 && (
                  <p className="mt-2 text-xs text-muted">+ {prev.rows.length - 8} baris valid lainnya</p>
                )}
              </div>
            )}
            {prev.errors.length > 0 && (
              <div className="mt-5 border-2 border-ink bg-pink/15 p-4" role="alert">
                <p className="font-extrabold">{prev.errors.length} baris bermasalah, tidak akan diimpor:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {prev.errors.slice(0, 5).map((e) => (
                    <li key={e.row}>
                      Baris <b>{e.row}</b>: {e.reason}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="white"
                  size="sm"
                  className="mt-3"
                  onClick={() => downloadErrors(prev.errors)}
                >
                  Unduh baris error (CSV)
                </Button>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="white" onClick={reset}>
                ← Ganti file
              </Button>
              <Button size="lg" disabled={prev.valid === 0} loading={busy} onClick={commit}>
                Impor {number(prev.valid)} baris
              </Button>
            </div>
            {prev.valid === 0 && (
              <p className="mt-3 text-sm font-bold text-danger">
                Tidak ada baris valid. Perbaiki file lalu unggah ulang.
              </p>
            )}
          </div>
        )}
        {step === 3 && done && (
          <div className="py-6 text-center">
            <p className="font-display text-7xl text-orange">{number(done.imported)}</p>
            <h2 className="text-4xl">Baris diimpor</h2>
            <p className="mt-2 text-sm text-muted">
              {done.overwritten} ditimpa · {done.skipped} dilewati
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button to="/dashboard/pemasukan">Lihat riwayat omzet</Button>
              <Button variant="white" onClick={reset}>
                Impor lagi
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
