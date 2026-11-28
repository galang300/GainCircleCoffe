import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../app/AuthContext'
import Button from '../../components/ui/Button'
import {
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  SkeletonRows,
  useToast,
} from '../../components/ui/Feedback'
import { SelectField, TextField } from '../../components/ui/Fields'
import { CashStatus } from '../../components/ui/Pill'
import { financeApi } from '../../lib/api'
import { CATEGORIES, CATEGORY_COLORS } from '../../lib/constants'
import { dmyInput, formatDayMonth, percent, rupiah, rupiahJt, todayWIB } from '../../lib/format'
import { toAppError } from '../../lib/errors'
import { useAsync, useDocTitle } from '../../lib/hooks'
import { expenseSchema, salesSchema } from '../../lib/schemas'
import { formatAmountInput, parseAmount } from '../../lib/validators'
import { cx } from '../../lib/cx'

export function FinanceTabs() {
  const t = ({ isActive }) =>
    cx('label-caps border-2 border-ink px-5 py-3 text-xs', isActive ? 'bg-ink text-cream' : 'bg-card')
  return (
    <nav aria-label="Jenis pencatatan" className="mb-6 flex flex-wrap gap-2">
      <NavLink to="/dashboard/pengeluaran" className={t}>
        Pengeluaran
      </NavLink>
      <NavLink to="/dashboard/pemasukan" end className={t}>
        Pemasukan (omzet)
      </NavLink>
    </nav>
  )
}

const Card = ({ title, aside, children, className }) => (
  <section className={cx('border-2 border-ink bg-card shadow-card', className)}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-orange px-4 py-2.5">
      <h2 className="text-2xl">{title}</h2>
      {aside}
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </section>
)

/** Kolom nominal berformat ribuan ('1.250.000'), terhubung ke react-hook-form lewat Controller. */
function AmountField({ control, name, label, required, error }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          ref={field.ref}
          label={label}
          required={required}
          prefix="Rp"
          inputMode="numeric"
          placeholder="0"
          inputClass="pl-12"
          value={field.value}
          onBlur={field.onBlur}
          onChange={(e) => field.onChange(formatAmountInput(e.target.value))}
          error={error}
        />
      )}
    />
  )
}

/** Isi error dari server (422) ke field form. Mengembalikan true bila ada field yang cocok. */
const applyServerFields = (a, setError, map = {}) => {
  if (!a.fields) return false
  Object.entries(a.fields).forEach(([k, message]) => setError(map[k] || k, { message }))
  return true
}

/** Ringkasan hari ini. Rasio & status hanya untuk owner. */
function TodaySummary({ owner, version }) {
  const q = useAsync(() => financeApi.expenseSummary(), [version])
  if (q.loading) return <SkeletonRows rows={2} />
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} compact />
  const t = q.data.today
  const max = Math.max(...q.data.month.map((x) => x.total), 1)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="border-2 border-ink bg-white p-3">
          <p className="label-caps text-[10px] text-muted">Pemasukan hari ini</p>
          <p className="mt-1 font-display text-3xl text-[#2f8a0d]">
            {t.revenue == null ? '–' : rupiah(t.revenue)}
          </p>
          <p className="text-[11px] text-muted">{t.revenue == null ? 'Belum diinput' : 'dari kasir'}</p>
        </div>
        <div className="border-2 border-ink bg-white p-3">
          <p className="label-caps text-[10px] text-muted">Pengeluaran hari ini</p>
          <p className="mt-1 font-display text-3xl text-orange">{rupiah(t.outflow)}</p>
          {owner && (
            <p className="text-[11px] text-muted">
              {t.ratio == null ? 'rasio belum bisa dihitung' : `rasio ${percent(t.ratio)}`}
            </p>
          )}
        </div>
      </div>
      {owner && t.status && (
        <div className="flex items-center gap-3">
          <CashStatus status={t.status} />
          <span className="text-xs text-muted">status hari ini</span>
        </div>
      )}
      {owner && (
        <div>
          <h3 className="text-xl">Ringkasan bulan ini</h3>
          <ul className="mt-2 space-y-2">
            {q.data.month.map((m) => (
              <li key={m.category} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-[13px]">
                <span className="font-bold">{m.category}</span>
                <span className="h-3.5 border border-ink bg-white">
                  <span
                    className="block h-full"
                    style={{ width: `${(m.total / max) * 100}%`, background: CATEGORY_COLORS[m.category] }}
                  />
                </span>
                <span className="tabular-nums">{rupiahJt(m.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ExpenseModal({ open, onClose, item, onSaved }) {
  const toast = useToast()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: item.date,
      category: item.category,
      amount: formatAmountInput(item.amount),
      note: item.note || '',
    },
  })
  const save = handleSubmit(async (v) => {
    try {
      await financeApi.updateExpense(item.id, {
        date: v.date,
        category: v.category,
        amount: parseAmount(v.amount),
        note: (v.note || '').trim(),
      })
      toast.success('Pengeluaran diperbarui')
      onSaved()
    } catch (x) {
      const a = toAppError(x)
      if (!applyServerFields(a, setError)) toast.error('Gagal menyimpan', a.message)
    }
  })
  return (
    <Modal open={open} onClose={onClose} tone="yellow" tag="Ubah pengeluaran" title="Ubah catatan">
      <form onSubmit={save} noValidate className="space-y-4">
        <TextField
          label="Tanggal"
          type="date"
          max={todayWIB()}
          error={errors.date?.message}
          {...register('date')}
        />
        <SelectField label="Kategori" error={errors.category?.message} {...register('category')}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
        <AmountField control={control} name="amount" label="Nominal" error={errors.amount?.message} />
        <TextField label="Catatan" maxLength={120} error={errors.note?.message} {...register('note')} />
        <div className="flex gap-3 pt-1">
          <Button variant="white" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Simpan perubahan
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function Pengeluaran() {
  useDocTitle('Catat pengeluaran')
  const { isOwner } = useAuth()
  const toast = useToast()
  const [v, setV] = useState(0)
  const [cat, setCat] = useState('')
  const [page, setPage] = useState(1)
  const [edit, setEdit] = useState(null)
  const hist = useAsync(
    () => financeApi.expenses({ category: cat || undefined, page, page_size: 6 }),
    [cat, page, v],
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: todayWIB(), category: '', amount: '', note: '' },
  })

  const submit = handleSubmit(async (f) => {
    try {
      const r = await financeApi.addExpense({
        date: f.date,
        category: f.category,
        amount: parseAmount(f.amount),
        note: (f.note || '').trim() || undefined,
      })
      toast.success('Pengeluaran tersimpan', `${r.category} · ${rupiah(r.amount)}`)
      reset({ date: f.date, category: '', amount: '', note: '' })
      setPage(1)
      setV((n) => n + 1)
    } catch (ex) {
      const a = toAppError(ex)
      if (!applyServerFields(a, setError)) toast.error('Gagal menyimpan', a.message)
    }
  })

  return (
    <div>
      <FinanceTabs />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card title="Catat pengeluaran">
          <form onSubmit={submit} noValidate className="space-y-5" aria-label="Catat pengeluaran">
            <TextField
              label="Tanggal"
              required
              type="date"
              max={todayWIB()}
              error={errors.date?.message}
              {...register('date')}
            />
            <SelectField label="Kategori" required error={errors.category?.message} {...register('category')}>
              <option value="">Pilih kategori…</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectField>
            <AmountField
              control={control}
              name="amount"
              label="Nominal"
              required
              error={errors.amount?.message}
            />
            <TextField
              label="Catatan"
              placeholder="Contoh: biji kopi 5 kg"
              maxLength={120}
              hint="Opsional"
              error={errors.note?.message}
              {...register('note')}
            />
            <Button type="submit" size="lg" block loading={isSubmitting}>
              Simpan pengeluaran
            </Button>
            <p className="text-[13px] text-muted">
              Data tersimpan langsung dan dipakai untuk analisis arus kas.
            </p>
          </form>
        </Card>
        <div className="space-y-6">
          <Card title="Hari ini">
            <TodaySummary owner={isOwner} version={v} />
          </Card>
        </div>
      </div>
      <Card
        title="Riwayat pengeluaran"
        className="mt-6"
        aside={
          <select
            aria-label="Filter kategori"
            value={cat}
            onChange={(e) => {
              setCat(e.target.value)
              setPage(1)
            }}
            className="label-caps h-9 border-2 border-ink bg-white px-2 text-[11px]"
          >
            <option value="">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        }
      >
        {hist.loading ? (
          <SkeletonRows rows={4} />
        ) : hist.error ? (
          <ErrorState error={hist.error} onRetry={hist.reload} compact />
        ) : hist.data.items.length === 0 ? (
          <EmptyState
            symbol="0"
            title="Belum ada pengeluaran"
            text="Catat pengeluaran pertamamu lewat formulir di atas."
          />
        ) : (
          <>
            <div className="scroll-x">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="sr-only">Riwayat pengeluaran</caption>
                <thead>
                  <tr className="border-b-2 border-ink">
                    {['Tanggal', 'Kategori', 'Catatan', 'Nominal', ''].map((h, i) => (
                      <th key={i} scope="col" className="label-caps py-2 pr-3 text-[11px]">
                        {h || <span className="sr-only">Aksi</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hist.data.items.map((r) => (
                    <tr key={r.id} className="border-b border-line">
                      <td className="py-2.5 pr-3">{formatDayMonth(r.date)}</td>
                      <td className="pr-3 font-bold">
                        <span
                          className="mr-2 inline-block h-3 w-3 border border-ink align-middle"
                          style={{ background: CATEGORY_COLORS[r.category] }}
                        />
                        {r.category}
                      </td>
                      <td className="pr-3 text-muted">{r.note || '–'}</td>
                      <td className="pr-3 tabular-nums">{rupiah(r.amount)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setEdit(r)}
                          className="label-caps text-[11px] text-rust underline"
                          aria-label={`Ubah ${r.category} ${rupiah(r.amount)}`}
                        >
                          Ubah
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={hist.data.page}
              pages={hist.data.total_pages}
              onPage={setPage}
              info={`${hist.data.total} catatan`}
            />
          </>
        )}
      </Card>
      {edit && (
        <ExpenseModal
          key={edit.id}
          open
          item={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null)
            setV((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}

export function Pemasukan() {
  useDocTitle('Catat pemasukan')
  const { isOwner } = useAuth()
  const toast = useToast()
  const [v, setV] = useState(0)
  const [overwrite, setOverwrite] = useState(null)
  const hist = useAsync(() => financeApi.salesDaily({ limit: 14 }), [v])
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(salesSchema), defaultValues: { date: todayWIB(), amount: '' } })
  const date = watch('date')
  const existing = useMemo(() => hist.data?.find((r) => r.date === date), [hist.data, date])

  const save = async (f) => {
    try {
      await financeApi.addSales({ date: f.date, revenue: parseAmount(f.amount) })
      toast.success('Omzet tersimpan', `${formatDayMonth(f.date)} · ${rupiah(parseAmount(f.amount))}`)
      reset({ date: f.date, amount: '' })
      setV((n) => n + 1)
    } catch (x) {
      const a = toAppError(x)
      if (!applyServerFields(a, setError)) toast.error('Gagal menyimpan', a.message)
    } finally {
      setOverwrite(null)
    }
  }
  const submit = handleSubmit((f) => (existing ? setOverwrite(existing) : save(f)))

  return (
    <div>
      <FinanceTabs />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Card title="Catat omzet harian">
          <form onSubmit={submit} noValidate className="space-y-5" aria-label="Catat omzet harian">
            <TextField
              label="Tanggal"
              required
              type="date"
              max={todayWIB()}
              error={errors.date?.message}
              {...register('date')}
            />
            <AmountField
              control={control}
              name="amount"
              label="Total omzet hari itu"
              required
              error={errors.amount?.message}
            />
            <div className="border-2 border-ink bg-yellow/60 p-3 text-[13px]">
              <b>Satu tanggal, satu nilai.</b> Menyimpan ulang tanggal yang sama akan menimpa nilai
              sebelumnya.
            </div>
            <Button type="submit" size="lg" block loading={isSubmitting}>
              Simpan omzet
            </Button>
          </form>
          <div className="mt-5 border-t-2 border-ink pt-4">
            <p className="text-sm">Punya banyak hari sekaligus?</p>
            <Button to="/dashboard/pemasukan/impor" variant="white" className="mt-2">
              Impor dari file CSV / XLSX
            </Button>
          </div>
        </Card>
        <Card title="Omzet vs pengeluaran harian">
          {hist.loading ? (
            <SkeletonRows rows={5} />
          ) : hist.error ? (
            <ErrorState error={hist.error} onRetry={hist.reload} compact />
          ) : hist.data.length === 0 ? (
            <EmptyState
              symbol="0"
              title="Belum ada data omzet"
              text="Catat omzet harian atau impor dari file."
            />
          ) : (
            <div className="scroll-x">
              <table className="w-full min-w-[520px] text-left text-sm">
                <caption className="sr-only">Omzet dan pengeluaran harian</caption>
                <thead>
                  <tr className="border-b-2 border-ink">
                    {[
                      'Tanggal',
                      'Omzet',
                      'Pengeluaran',
                      ...(isOwner ? ['Rasio', 'Status'] : []),
                      'Sumber',
                    ].map((h) => (
                      <th key={h} scope="col" className="label-caps py-2 pr-3 text-[11px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hist.data.map((r) => (
                    <tr key={r.date} className="border-b border-line">
                      <td className="py-2.5 pr-3">{formatDayMonth(r.date)}</td>
                      <td className="pr-3 tabular-nums">{rupiah(r.revenue)}</td>
                      <td className="pr-3 tabular-nums">{rupiah(r.outflow)}</td>
                      {isOwner && (
                        <>
                          <td className="pr-3">{r.ratio == null ? '–' : percent(r.ratio)}</td>
                          <td className="pr-3">
                            <CashStatus status={r.status} />
                          </td>
                        </>
                      )}
                      <td className="text-muted">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <Modal
        open={!!overwrite}
        onClose={() => setOverwrite(null)}
        tone="yellow"
        tag="Tanggal sudah ada"
        title="Timpa nilai omzet?"
        actions={
          <>
            <Button variant="white" onClick={() => setOverwrite(null)}>
              Batal
            </Button>
            <Button loading={isSubmitting} onClick={() => save(getValues())}>
              Ya, timpa
            </Button>
          </>
        }
      >
        {overwrite && (
          <>
            Tanggal {dmyInput(overwrite.date)} sudah tercatat <b>{rupiah(overwrite.revenue)}</b>. Nilai baru{' '}
            <b>{rupiah(parseAmount(getValues('amount')))}</b> akan menggantikannya.
          </>
        )}
      </Modal>
    </div>
  )
}
