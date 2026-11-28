import { useState } from 'react'
import { addMonths, dayNumber, monthGrid, monthKey, monthLabelLong, todayWIB } from '../../lib/format'
import { cx } from '../../lib/cx'
import { futureLimit } from '../../lib/validators'

const HEAD = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

/** Kalender bulanan. Hari lewat dan > +30 hari dinonaktifkan. */
export default function Calendar({ value, onChange, maxDays = 30 }) {
  const today = todayWIB()
  const max = futureLimit(maxDays)
  const [month, setMonth] = useState(monthKey(value || today))
  const first = monthKey(today),
    last = monthKey(max)
  return (
    <div className="border-2 border-ink bg-card p-4 shadow-cardsm">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl" aria-live="polite">
          {monthLabelLong(month)}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            disabled={month <= first}
            onClick={() => setMonth(addMonths(month, -1))}
            className="grid h-10 w-10 place-items-center text-xl disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            disabled={month >= last}
            onClick={() => setMonth(addMonths(month, 1))}
            className="grid h-10 w-10 place-items-center text-xl disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>
      <div role="grid" aria-label={`Kalender ${monthLabelLong(month)}`} className="mt-2">
        <div role="row" className="grid grid-cols-7 text-center">
          {HEAD.map((h) => (
            <span key={h} role="columnheader" className="label-caps py-1 text-[10px] text-muted">
              {h}
            </span>
          ))}
        </div>
        {monthGrid(month).map((week, wi) => (
          <div role="row" key={wi} className="grid grid-cols-7">
            {week.map((d, di) => {
              if (!d) return <span key={di} role="gridcell" />
              const off = d < today || d > max,
                sel = d === value
              return (
                <button
                  key={d}
                  type="button"
                  role="gridcell"
                  disabled={off}
                  aria-selected={sel}
                  aria-label={d}
                  onClick={() => onChange(d)}
                  className={cx(
                    'mx-auto my-0.5 grid h-10 w-10 place-items-center text-sm font-bold',
                    sel
                      ? 'border-2 border-ink bg-neon'
                      : d === today
                        ? 'border-2 border-orange'
                        : 'border-2 border-transparent hover:bg-beige',
                    off && 'text-line line-through-none opacity-50',
                  )}
                >
                  {dayNumber(d)}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
