import { SLOTS } from '../../lib/constants'
import { isSlotPast } from '../../lib/slots'
import { cx } from '../../lib/cx'

/** 9 slot 2 jam. `fullSlots` = id slot yang sudah penuh pada tanggal terpilih. */
export default function SlotPicker({ date, value, onChange, fullSlots = [] }) {
  return (
    <div className="border-2 border-ink bg-card p-4 shadow-cardsm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-2xl">Jam</h3>
        <span className="label-caps text-[10px] text-muted">2 jam / sesi</span>
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Pilih jam">
        {SLOTS.map((s) => {
          const past = isSlotPast(date, s),
            full = fullSlots.includes(s.id),
            off = past || full,
            on = value === s.id
          return (
            <button
              key={s.id}
              type="button"
              disabled={off}
              aria-pressed={on}
              onClick={() => onChange(s.id)}
              title={past ? 'Slot sudah lewat' : full ? 'Slot penuh' : undefined}
              className={cx(
                'min-h-11 border-2 border-ink px-1 text-[12px] font-extrabold tracking-tight',
                on
                  ? 'bg-ink text-cream'
                  : off
                    ? 'bg-beige text-muted line-through'
                    : 'bg-white hover:bg-neon/40',
              )}
            >
              {s.label}
              {off && <span className="sr-only">{past ? ' (sudah lewat)' : ' (penuh)'}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
