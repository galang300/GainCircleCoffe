import { LOGO_D, LOGO_VIEWBOX } from './logoPath'

/** Logo script "G GAIN." sebagai SVG inline. `dark` = logo krem untuk latar gelap. */
export default function Logo({ dark = true, height = 34, className = '', title = 'Gain Circle' }) {
  const [, , w, h] = LOGO_VIEWBOX.split(' ').map(Number)
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={LOGO_VIEWBOX}
      height={height}
      width={(height * w) / h}
      className={className}
    >
      <path d={LOGO_D} fill={dark ? '#F2EDDE' : '#171210'} fillRule="evenodd" />
    </svg>
  )
}
