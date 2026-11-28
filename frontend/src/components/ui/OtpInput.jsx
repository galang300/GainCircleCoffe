import { useRef } from 'react'
import { cx } from '../../lib/cx'
import { OTP_LENGTH } from '../../lib/constants'

/** Input 6 digit. Mendukung tempel (paste), backspace, panah, dan autofill SMS/email. */
export default function OtpInput({ value, onChange, error, disabled, label = 'Kode OTP' }) {
  const refs = useRef([])
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '')
  const set = (i, ch) => {
    const arr = [...digits]
    arr[i] = ch
    onChange(arr.join('').slice(0, OTP_LENGTH))
  }
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
      set(i - 1, '')
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus()
  }
  const onInput = (i, e) => {
    const v = e.target.value.replace(/\D/g, '')
    if (!v) return set(i, '')
    if (v.length > 1) {
      // tempel/autofill
      const next = (value.slice(0, i) + v).slice(0, OTP_LENGTH)
      onChange(next)
      refs.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus()
      return
    }
    set(i, v)
    if (i < OTP_LENGTH - 1) refs.current[i + 1]?.focus()
  }
  return (
    <div role="group" aria-label={label}>
      <div className="flex gap-2 sm:gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={d}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={!!error || undefined}
            maxLength={OTP_LENGTH}
            onChange={(e) => onInput(i, e)}
            onKeyDown={(e) => onKey(i, e)}
            onFocus={(e) => e.target.select()}
            className={cx(
              'h-16 w-full min-w-0 border-2 bg-white text-center font-display text-4xl text-ink',
              error ? 'border-danger border-[3px]' : 'border-ink',
            )}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-bold text-danger">
          ! {error}
        </p>
      )}
    </div>
  )
}
