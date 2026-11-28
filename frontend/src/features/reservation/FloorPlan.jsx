import { FLOOR, TABLE_LAYOUT, TABLE_STATUS } from '../../lib/constants'
import { cx } from '../../lib/cx'

/**
 * Denah SVG yang dipakai pelanggan dan staf. `statusOf(id)` mengembalikan kunci TABLE_STATUS.
 * Meja dapat difokus dan dipilih dengan Enter/Spasi. `disabledIds` = tidak bisa dipilih (kapasitas/penuh).
 */
export default function FloorPlan({
  statusOf,
  selectedId,
  onSelect,
  disabledIds = [],
  tables = TABLE_LAYOUT,
  compact = false,
  label = 'Denah meja',
  reasonOf,
}) {
  return (
    <svg
      viewBox={`0 0 ${FLOOR.width} ${FLOOR.height}`}
      role="group"
      aria-label={label}
      className={cx('block h-auto w-full', compact && 'max-h-72')}
    >
      <rect x="20" y="20" width="600" height="390" fill="#F8F3ED" stroke="#171210" strokeWidth="4" />
      <rect x="20" y="20" width="600" height="56" fill="#171210" />
      <text
        x="320"
        y="60"
        textAnchor="middle"
        fontFamily="Anton, Impact, sans-serif"
        fontSize="28"
        letterSpacing="3"
        fill="#F2EDDE"
      >
        BAR / KASIR
      </text>
      <rect x="170" y="404" width="120" height="14" fill="#F2EDDE" />
      <text
        x="230"
        y="394"
        textAnchor="middle"
        fontFamily="Archivo, Arial, sans-serif"
        fontWeight="800"
        fontSize="10"
        letterSpacing="1"
        fill="#6E655C"
      >
        PINTU MASUK
      </text>
      {tables.map((t) => {
        const key = t.id === selectedId ? 'dipilih' : statusOf(t.id) || 'kosong'
        const st = TABLE_STATUS[key]
        const disabled = disabledIds.includes(t.id) || !onSelect
        const reason = reasonOf?.(t.id)
        const aria = `Meja ${t.id}, ${t.seats} kursi, ${st.label}${reason ? `, ${reason}` : ''}${t.id === selectedId ? ', dipilih' : ''}`
        const act = () => !disabled && onSelect?.(t.id)
        return (
          <g
            key={t.id}
            role="button"
            tabIndex={onSelect ? 0 : -1}
            aria-label={aria}
            aria-pressed={onSelect ? t.id === selectedId : undefined}
            aria-disabled={disabled || undefined}
            onClick={act}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                act()
              }
            }}
            style={{
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabledIds.includes(t.id) ? 0.55 : 1,
              outline: 'none',
            }}
            className="focus-visible:[&>*:first-child]:stroke-[7]"
          >
            {t.shape === 'c' ? (
              <circle cx={t.x} cy={t.y} r={t.w / 2} fill={st.bg} stroke={st.border} strokeWidth="3.5" />
            ) : (
              <rect
                x={t.x - t.w / 2}
                y={t.y - t.h / 2}
                width={t.w}
                height={t.h}
                fill={st.bg}
                stroke={st.border}
                strokeWidth="3.5"
              />
            )}
            <text
              x={t.x}
              y={t.y + 2}
              textAnchor="middle"
              fontFamily="Anton, Impact, sans-serif"
              fontSize="20"
              fill={st.fg}
            >
              {t.id}
            </text>
            <text
              x={t.x}
              y={t.y + 16}
              textAnchor="middle"
              fontFamily="Archivo, Arial, sans-serif"
              fontWeight="800"
              fontSize="9"
              letterSpacing=".5"
              fill={st.fg}
            >
              {t.shape === 'r' ? `${t.seats} KURSI` : `×${t.seats}`}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((k) => (
        <li key={k} className="flex items-center gap-2 label-caps text-xs">
          <span
            className="h-5 w-5 border-2 border-ink"
            style={{ background: TABLE_STATUS[k].bg }}
            aria-hidden="true"
          />
          {TABLE_STATUS[k].label}
        </li>
      ))}
    </ul>
  )
}
