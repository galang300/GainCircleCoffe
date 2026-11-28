import { forwardRef, useId } from 'react'
import { cx } from '../../lib/cx'

export function FieldShell({ id, label, required, error, hint, tag, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor={id} className="label-caps">
            {label}
            {required && ' *'}
          </label>
          {tag}
        </div>
      )}
      {children}
      {error ? (
        <p id={`${id}-e`} role="alert" className="mt-1.5 text-xs font-bold text-danger">
          ! {error}
        </p>
      ) : hint ? (
        <p id={`${id}-h`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
const base =
  'w-full min-h-12 border-2 bg-white px-4 text-[15px] text-ink placeholder:text-muted/70 disabled:bg-beige disabled:text-muted read-only:bg-beige'
const ring = (error) => (error ? 'border-danger border-[3px]' : 'border-ink')

export const TextField = forwardRef(function TextField(
  { label, required, error, hint, tag, className, inputClass, prefix, ...p },
  ref,
) {
  const id = useId()
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      tag={tag}
      className={className}
    >
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
          className={cx(base, ring(error), prefix && 'pl-12', inputClass)}
          {...p}
        />
      </div>
    </FieldShell>
  )
})
export const SelectField = forwardRef(function SelectField(
  { label, required, error, hint, className, children, ...p },
  ref,
) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          className={cx(base, ring(error), 'appearance-none pr-10')}
          {...p}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          width="16"
          height="10"
          viewBox="0 0 16 10"
        >
          <path d="M2 2l6 6 6-6" fill="none" stroke="#171210" strokeWidth="2.5" />
        </svg>
      </div>
    </FieldShell>
  )
})
export const TextArea = forwardRef(function TextArea({ label, required, error, hint, className, ...p }, ref) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint} className={className}>
      <textarea
        ref={ref}
        id={id}
        rows={3}
        aria-invalid={!!error || undefined}
        className={cx(base, ring(error), 'py-3')}
        {...p}
      />
    </FieldShell>
  )
})
export const Checkbox = forwardRef(function Checkbox({ label, error, className, ...p }, ref) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm font-medium">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="peer sr-only"
          aria-invalid={!!error || undefined}
          {...p}
        />
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-white peer-checked:bg-neon peer-focus-visible:ring-4 peer-focus-visible:ring-ink [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
        >
          <svg width="14" height="12" viewBox="0 0 14 12">
            <path d="M1 6l4 4 8-9" fill="none" stroke="#171210" strokeWidth="3" />
          </svg>
        </span>
        <span>{label}</span>
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-bold text-danger">
          ! {error}
        </p>
      )}
    </div>
  )
})
export function Stepper({ stepper = ['Pilih meja', 'Data pemesan', 'E-ticket'], step }) {
  return (
    <ol className="grid grid-cols-3 border-2 border-ink" aria-label="Langkah reservasi">
      {stepper.map((s, i) => {
        const on = i + 1 === step,
          done = i + 1 < step
        return (
          <li
            key={s}
            aria-current={on ? 'step' : undefined}
            className={cx(
              'flex min-h-14 items-center gap-2 px-3 font-display text-lg uppercase md:gap-4 md:px-6 md:text-2xl',
              on ? 'bg-neon' : done ? 'bg-ink text-cream' : 'bg-card text-muted',
              i < 2 && 'border-r-2 border-ink',
            )}
          >
            <span className={cx(on ? 'text-ink' : done ? 'text-neon' : 'text-orange')}>0{i + 1}</span>
            <span className="truncate">{s}</span>
          </li>
        )
      })}
    </ol>
  )
}
