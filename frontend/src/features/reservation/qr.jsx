import { useMemo } from 'react'
import QRCode from 'qrcode'

/** QR dibuat di klien dari kode reservasi. Dirender sebagai rect SVG (tanpa dangerouslySetInnerHTML). */
export default function QR({ value, size = 112, label }) {
  const m = useMemo(() => QRCode.create(value, { errorCorrectionLevel: 'M' }).modules, [value])
  const n = m.size
  const cells = []
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (m.data[y * n + x]) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" />)
  return (
    <svg
      role="img"
      aria-label={label || `QR kode ${value}`}
      viewBox={`-2 -2 ${n + 4} ${n + 4}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="bg-white"
    >
      <g fill="#171210">{cells}</g>
    </svg>
  )
}
