import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

const VARIANTS = {
  neon: 'bg-neon text-ink',
  ink: 'bg-ink text-cream',
  orange: 'bg-orange text-ink',
  light: 'bg-card text-ink',
  yellow: 'bg-yellow text-ink',
  pink: 'bg-pink text-ink',
  white: 'bg-white text-ink',
  ghost: 'bg-transparent text-ink',
}
const SIZES = { sm: 'min-h-9 px-3 text-xs', md: 'min-h-11 px-5 text-[13px]', lg: 'min-h-14 px-7 text-sm' }

export function Spinner({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}

/** Tombol persegi, border 2px, bayangan keras. `to` = rute internal, `href` = tautan eksternal. */
export default function Button({
  variant = 'neon',
  size = 'md',
  to,
  href,
  loading = false,
  disabled = false,
  shadow = true,
  block = false,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const cls = cx(
    'btn-caps inline-flex items-center justify-center gap-2 border-2 border-ink text-center transition-transform',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
    shadow &&
      variant !== 'ghost' &&
      'shadow-btn hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    (disabled || loading) && 'pointer-events-none opacity-50',
    className,
  )
  if (to)
    return (
      <Link to={to} className={cls} aria-disabled={disabled || undefined} {...rest}>
        {children}
      </Link>
    )
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    )
  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
