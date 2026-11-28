import { useRef, useState } from 'react'
import { cx } from '../../lib/cx'
import Button from './Button'

/** Pilih/seret file. Validasi tipe & ukuran dilakukan pemanggil lewat onFile. */
export default function FileDropzone({
  onFile,
  accept = '.csv,.xlsx',
  error,
  disabled,
  hint,
  buttonLabel = 'Pilih file',
}) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  const pick = (f) => f && onFile(f)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (!disabled) pick(e.dataTransfer.files?.[0])
      }}
      className={cx(
        'border-2 border-dashed p-6 text-center',
        over ? 'border-ink bg-neon/40' : error ? 'border-danger bg-pink/10' : 'border-ink bg-card',
      )}
    >
      <p className="font-display text-xl uppercase">Seret file ke sini</p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">{hint}</p>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-label="Pilih file impor"
        disabled={disabled}
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <Button className="mt-4" variant="yellow" disabled={disabled} onClick={() => input.current?.click()}>
        {buttonLabel}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-xs font-bold text-danger">
          ! {error}
        </p>
      )}
    </div>
  )
}
