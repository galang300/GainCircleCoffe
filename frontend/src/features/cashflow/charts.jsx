import { CATEGORY_COLORS, THRESHOLDS } from '../../lib/constants'
import { juta, percent } from '../../lib/format'

const F = { fontFamily: 'Archivo, Arial, sans-serif' }
const niceMax = (v) => {
  const steps = [10, 25, 50, 100, 200, 250, 500, 1000]
  return steps.find((s) => s >= v * 1.08) || Math.ceil(v / 100) * 100
}
const Grid = ({ w, h, pl, pb, pt, max, ticks = 4 }) => (
  <g>
    {Array.from({ length: ticks + 1 }, (_, i) => {
      const v = (max / ticks) * i,
        y = h - pb - ((h - pb - pt) * i) / ticks
      return (
        <g key={i}>
          <line x1={pl} x2={w - 8} y1={y} y2={y} stroke="#D5CAB4" strokeDasharray="4 4" />
          <text x={pl - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6E655C" style={F}>
            {v}
          </text>
        </g>
      )
    })}
  </g>
)
/** Tabel tersembunyi agar grafik tetap terbaca screen reader. */
const SrTable = ({ caption, head, rows }) => (
  <table className="sr-only">
    <caption>{caption}</caption>
    <thead>
      <tr>
        {head.map((h) => (
          <th key={h}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((r, i) => (
        <tr key={i}>
          {r.map((c, j) => (
            <td key={j}>{c}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)

/** data: [{ label, inflow, outflow }] dalam rupiah. Bar terakhir = periode berjalan (diberi tanda *). */
export function GroupedBars({ data }) {
  const w = 760,
    h = 310,
    pl = 44,
    pb = 34,
    pt = 24
  const vals = data.flatMap((d) => [d.inflow, d.outflow]).map((v) => v / 1e6)
  const max = niceMax(Math.max(1, ...vals))
  const gw = (w - pl - 12) / data.length
  const bw = Math.min(40, gw / 3)
  const y = (v) => h - pb - ((h - pb - pt) * v) / max
  return (
    <figure>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Grafik batang inflow dibanding outflow per periode, dalam juta rupiah"
        className="h-auto w-full"
      >
        <Grid w={w} h={h} pl={pl} pb={pb} pt={pt} max={max} />
        {data.map((d, i) => {
          const cx = pl + gw * i + gw / 2
          const cur = i === data.length - 1
          const a = d.inflow / 1e6,
            b = d.outflow / 1e6
          return (
            <g key={d.label}>
              <rect
                x={cx - bw - 3}
                y={y(a)}
                width={bw}
                height={h - pb - y(a)}
                fill="#75F237"
                stroke="#171210"
                strokeWidth={cur ? 3 : 0}
              />
              <rect
                x={cx + 3}
                y={y(b)}
                width={bw}
                height={h - pb - y(b)}
                fill="#CA5C34"
                stroke="#171210"
                strokeWidth={cur ? 3 : 0}
              />
              <text
                x={cx - bw / 2 - 3}
                y={y(a) - 6}
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                style={F}
              >
                {juta(d.inflow)}
              </text>
              <text
                x={cx + bw / 2 + 3}
                y={y(b) - 6}
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                style={F}
              >
                {juta(d.outflow)}
              </text>
              <text
                x={cx}
                y={h - 10}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill={cur ? '#CA5C34' : '#171210'}
                style={F}
              >
                {d.label}
                {cur ? '*' : ''}
              </text>
            </g>
          )
        })}
        <line x1={pl} x2={w - 8} y1={h - pb} y2={h - pb} stroke="#171210" strokeWidth="2" />
      </svg>
      <SrTable
        caption="Inflow dan outflow (juta rupiah)"
        head={['Periode', 'Inflow', 'Outflow']}
        rows={data.map((d) => [d.label, juta(d.inflow), juta(d.outflow)])}
      />
    </figure>
  )
}

export function NetBars({ data }) {
  const w = 440,
    h = 270,
    pl = 36,
    pb = 30,
    pt = 22
  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.inflow - d.outflow, 0) / 1e6)))
  const gw = (w - pl - 8) / data.length
  const bw = Math.min(34, gw * 0.55)
  const y = (v) => h - pb - ((h - pb - pt) * v) / max
  return (
    <figure>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Grafik batang net cashflow per periode, dalam juta rupiah"
        className="h-auto w-full"
      >
        <Grid w={w} h={h} pl={pl} pb={pb} pt={pt} max={max} />
        {data.map((d, i) => {
          const v = (d.inflow - d.outflow) / 1e6
          const cx = pl + gw * i + gw / 2
          const cur = i === data.length - 1
          return (
            <g key={d.label}>
              <rect
                x={cx - bw / 2}
                y={y(Math.max(v, 0))}
                width={bw}
                height={Math.max(h - pb - y(Math.max(v, 0)), 0)}
                fill={cur ? '#FDD923' : '#75F237'}
                stroke="#171210"
                strokeWidth={cur ? 3 : 0}
              />
              <text
                x={cx}
                y={y(Math.max(v, 0)) - 6}
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                style={F}
              >
                {v.toFixed(v < 10 ? 1 : 0)}
              </text>
              <text x={cx} y={h - 9} textAnchor="middle" fontSize="11" fontWeight="700" style={F}>
                {d.label}
                {cur ? '*' : ''}
              </text>
            </g>
          )
        })}
        <line x1={pl} x2={w - 8} y1={h - pb} y2={h - pb} stroke="#171210" strokeWidth="2" />
      </svg>
      <SrTable
        caption="Net cashflow (juta rupiah)"
        head={['Periode', 'Net']}
        rows={data.map((d) => [d.label, ((d.inflow - d.outflow) / 1e6).toFixed(1)])}
      />
    </figure>
  )
}

/** items: [{ category, total }] */
export function Donut({ items, totalLabel }) {
  const total = items.reduce((s, i) => s + i.total, 0) || 1
  const r = 78,
    c = 2 * Math.PI * r
  let acc = 0
  return (
    <figure className="flex flex-wrap items-center justify-center gap-6">
      <svg
        viewBox="0 0 220 220"
        role="img"
        aria-label="Diagram donat komposisi pengeluaran per kategori"
        className="h-52 w-52 shrink-0 -rotate-90"
      >
        {items.map((it) => {
          const len = (it.total / total) * c
          const el = (
            <circle
              key={it.category}
              cx="110"
              cy="110"
              r={r}
              fill="none"
              stroke={CATEGORY_COLORS[it.category] || '#D5CAB4'}
              strokeWidth="48"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
            />
          )
          acc += len
          return el
        })}
        <circle cx="110" cy="110" r="102" fill="none" stroke="#171210" strokeWidth="3" />
        <circle cx="110" cy="110" r="54" fill="#F8F3ED" stroke="#171210" strokeWidth="3" />
        <text
          x="110"
          y="118"
          textAnchor="middle"
          transform="rotate(90 110 110)"
          fontSize="22"
          fill="#171210"
          style={{ fontFamily: 'Anton, Impact, sans-serif' }}
        >
          {totalLabel}
        </text>
      </svg>
      <ul className="space-y-1.5 text-[13px] font-bold">
        {items.map((it) => (
          <li key={it.category} className="flex items-center gap-2">
            <span
              className="h-3.5 w-3.5 border-[1.5px] border-ink"
              style={{ background: CATEGORY_COLORS[it.category] || '#D5CAB4' }}
            />
            {it.category} {Math.round((it.total / total) * 100)}%
          </li>
        ))}
      </ul>
    </figure>
  )
}

/** factors: [{ label, value }]. value positif mendorong status naik (oranye), negatif menurunkan (hijau). */
export function ShapBars({ factors }) {
  const max = Math.max(0.5, ...factors.map((f) => Math.abs(f.value)))
  return (
    <ul className="space-y-3" aria-label="Faktor yang memengaruhi status">
      {factors.map((f) => {
        const pos = f.value >= 0
        return (
          <li
            key={f.label}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-3 text-[13px] font-bold"
          >
            <span>{f.label}</span>
            <span className="relative flex h-6 items-center">
              <span className="absolute left-1/2 h-full w-0.5 bg-ink" />
              <span
                className="absolute h-full"
                style={{
                  background: pos ? '#CA5C34' : '#75F237',
                  width: `${(Math.abs(f.value) / max) * 50}%`,
                  left: pos ? '50%' : `${50 - (Math.abs(f.value) / max) * 50}%`,
                }}
              />
              <span
                className="absolute text-[11px]"
                style={{
                  left: pos ? `calc(50% + ${(Math.abs(f.value) / max) * 50}% + 6px)` : undefined,
                  right: pos ? undefined : `calc(50% + ${(Math.abs(f.value) / max) * 50}% + 6px)`,
                }}
              >
                {pos ? '+' : '−'}
                {Math.abs(f.value).toFixed(2)}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** Meter rasio: zona Sehat (≤70%), Waspada (70–90%), Kritis (>90%), skala 0–110%. */
export function RatioMeter({ ratio }) {
  const S = 1.1,
    pos = (v) => `${Math.min(v / S, 1) * 100}%`
  return (
    <div>
      <div
        className="relative h-5 border-2 border-ink bg-white"
        role="img"
        aria-label={`Rasio pengeluaran ${percent(ratio)}. Batas sehat ${percent(THRESHOLDS.sehat)}, kritis di atas ${percent(THRESHOLDS.kritis)}`}
      >
        <div className="absolute inset-y-0 left-0 bg-orange" style={{ width: pos(ratio) }} />
        <div className="absolute inset-y-0 bg-ink/90" style={{ left: pos(THRESHOLDS.kritis), right: 0 }} />
        <div
          className="absolute -inset-y-1 w-1 bg-white ring-2 ring-ink"
          style={{ left: pos(THRESHOLDS.sehat) }}
        />
        <div
          className="absolute -inset-y-1 w-1 bg-white ring-2 ring-ink"
          style={{ left: pos(THRESHOLDS.kritis) }}
        />
      </div>
      <div className="relative mt-1.5 h-4 text-[10px] font-extrabold uppercase tracking-wider">
        <span className="absolute left-0">Sehat</span>
        <span className="absolute -translate-x-1/2" style={{ left: pos(THRESHOLDS.sehat) }}>
          Waspada
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: pos(THRESHOLDS.kritis) }}>
          Kritis
        </span>
      </div>
    </div>
  )
}
