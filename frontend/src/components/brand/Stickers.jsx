// Stiker die-cut (halo putih) sebagai komponen SVG. Dekoratif: aria-hidden.
const Halo = ({ children, w = 12 }) => (
  <g stroke="#fff" strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" fill="#fff">
    {children}
  </g>
)
const wrap = (vb, Cmp) =>
  function Sticker({ size = 120, rotate = 0, className = '' }) {
    return (
      <svg
        aria-hidden="true"
        viewBox={vb}
        width={size}
        height={size}
        className={className}
        style={{ transform: `rotate(${rotate}deg)`, overflow: 'visible' }}
      >
        <Cmp />
      </svg>
    )
  }
const txt = { fontFamily: 'Anton, Impact, sans-serif', textAnchor: 'middle', fill: '#171210' }

export const StarIcon = ({ size = 22, color = '#75F237', className = '' }) => {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? 5.2 : 12
    const a = (Math.PI * i) / 8 - Math.PI / 2
    return `${(12 + r * Math.cos(a)).toFixed(1)},${(12 + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} className={className}>
      <polygon points={pts} fill={color} />
    </svg>
  )
}

export const StickerCalendar = wrap('0 0 120 120', () => (
  <g transform="rotate(8 60 60)">
    <Halo>
      <rect x="16" y="20" width="88" height="84" rx="8" />
    </Halo>
    <rect x="16" y="20" width="88" height="84" rx="6" fill="#FDD923" stroke="#171210" strokeWidth="3" />
    <rect x="16" y="20" width="88" height="20" fill="#FC2685" stroke="#171210" strokeWidth="3" />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect
        key={i}
        x={26 + i * 17}
        y="13"
        width="6"
        height="14"
        fill="#fff"
        stroke="#171210"
        strokeWidth="2"
      />
    ))}
    <text x="60" y="68" fontSize="24" style={txt}>
      BOOK
    </text>
    <text x="60" y="94" fontSize="24" style={txt}>
      NOW!
    </text>
  </g>
))
export const StickerCassette = wrap('0 0 180 130', () => (
  <g transform="rotate(-6 90 65)">
    <Halo>
      <rect x="10" y="12" width="160" height="106" rx="8" />
    </Halo>
    <rect x="10" y="12" width="160" height="106" rx="8" fill="#FDD923" stroke="#171210" strokeWidth="3" />
    <rect x="28" y="26" width="124" height="38" fill="#fff" stroke="#171210" strokeWidth="2" />
    <text x="90" y="52" fontSize="20" style={txt}>
      KOPI SORE
    </text>
    <circle cx="56" cy="92" r="13" fill="#2649D2" stroke="#171210" strokeWidth="2" />
    <circle cx="124" cy="92" r="13" fill="#2649D2" stroke="#171210" strokeWidth="2" />
  </g>
))
export const StickerCup = wrap('0 0 120 130', () => (
  <g transform="rotate(6 60 65)">
    <line x1="74" y1="2" x2="66" y2="30" stroke="#75F237" strokeWidth="7" strokeLinecap="round" />
    <Halo>
      <polygon points="22,22 98,22 88,118 32,118" />
    </Halo>
    <polygon points="22,22 98,22 88,118 32,118" fill="#CA5C34" stroke="#171210" strokeWidth="3" />
    <rect x="34" y="52" width="52" height="30" fill="#FDD923" stroke="#171210" strokeWidth="2" />
    <text x="60" y="73" fontSize="17" style={txt}>
      GAIN
    </text>
    <path d="M44 94q16 12 32 0" fill="none" stroke="#171210" strokeWidth="3" strokeLinecap="round" />
  </g>
))
export const StickerBooked = wrap('0 0 120 120', () => {
  const pts = Array.from({ length: 32 }, (_, i) => {
    const r = i % 2 ? 50 : 56
    const a = (Math.PI * i) / 16
    return `${(60 + r * Math.cos(a)).toFixed(1)},${(60 + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <g transform="rotate(-10 60 60)">
      <polygon points={pts} fill="#fff" stroke="#fff" strokeWidth="8" />
      <polygon points={pts} fill="#FC2685" stroke="#171210" strokeWidth="3" />
      <circle cx="60" cy="60" r="38" fill="none" stroke="#171210" strokeWidth="2" strokeDasharray="3 3" />
      <text x="60" y="68" fontSize="22" style={{ ...txt, fill: '#171210' }}>
        BOOKED
      </text>
    </g>
  )
})
export const StickerBell = wrap('0 0 100 100', () => (
  <g transform="rotate(-8 50 50)">
    <Halo>
      <path d="M16 66a34 36 0 0 1 68 0z" />
      <rect x="6" y="66" width="88" height="12" rx="4" />
    </Halo>
    <path d="M16 66a34 36 0 0 1 68 0z" fill="#FDD923" stroke="#171210" strokeWidth="3" />
    <rect x="6" y="66" width="88" height="12" rx="4" fill="#CA5C34" stroke="#171210" strokeWidth="3" />
    <circle cx="50" cy="86" r="6" fill="#FC2685" stroke="#171210" strokeWidth="3" />
  </g>
))
export const StickerCloud = wrap('0 0 100 100', () => (
  <g>
    <circle cx="50" cy="50" r="46" fill="#D5CAB4" stroke="#171210" strokeWidth="2" />
    <path
      d="M22 62a15 15 0 0 1 3-29a22 22 0 0 1 41-5a17 17 0 0 1 5 34Z"
      fill="#FC2685"
      stroke="#171210"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <text x="48" y="60" fontSize="34" style={{ ...txt, fill: '#F2EDDE' }}>
      !
    </text>
  </g>
))
export const StickerBadge = wrap('0 0 120 120', () => (
  <g>
    <circle cx="60" cy="60" r="56" fill="#fff" />
    <circle cx="60" cy="60" r="50" fill="#2649D2" stroke="#171210" strokeWidth="3" />
    <circle cx="60" cy="60" r="31" fill="#FDD923" stroke="#171210" strokeWidth="2" />
    <circle cx="60" cy="60" r="21" fill="#F2EDDE" stroke="#171210" strokeWidth="3" />
    <circle cx="60" cy="60" r="10" fill="#CA5C34" />
  </g>
))
