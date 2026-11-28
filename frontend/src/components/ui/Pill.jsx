import { cx } from '../../lib/cx'
import { CASH_STATUS, RES_STATUS } from '../../lib/constants'

export function Pill({ bg = '#FDD923', fg = '#171210', children, className = '', style }) {
  return (
    <span
      className={cx(
        'label-caps inline-block whitespace-nowrap border-[1.5px] border-ink px-2.5 py-[3px] text-[11px]',
        className,
      )}
      style={{ background: bg, color: fg, ...style }}
    >
      {children}
    </span>
  )
}
export const ResStatus = ({ status }) => {
  const s = RES_STATUS[status] || RES_STATUS.dikonfirmasi
  return (
    <Pill bg={s.bg} fg={s.fg}>
      {s.label}
    </Pill>
  )
}
export const CashStatus = ({ status }) => {
  const s = CASH_STATUS[status] || CASH_STATUS.belum
  return (
    <Pill bg={s.bg} fg={s.fg}>
      {s.label}
    </Pill>
  )
}

/** Tag miring (gaya stiker label di website). */
export function Tag({ children, bg = '#FDD923', rotate = -2, className = '' }) {
  return (
    <span
      className={cx('label-caps inline-block border-2 border-ink px-2.5 py-1 text-[11px]', className)}
      style={{ background: bg, transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  )
}
export function Chip({ active, children, className = '', ...p }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      className={cx(
        'btn-caps min-h-10 border-2 border-ink px-3.5 text-xs',
        active ? 'bg-ink text-cream' : 'bg-card text-ink hover:bg-beige',
        className,
      )}
      {...p}
    >
      {children}
    </button>
  )
}
export function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div role="group" aria-label={label} className={cx('inline-flex flex-wrap gap-2', className)}>
      {options.map((o) => (
        <Chip key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}
