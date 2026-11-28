import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../app/AuthContext'
import { homeFor } from '../../app/guards'
import Button from '../../components/ui/Button'
import OtpInput from '../../components/ui/OtpInput'
import { DataBadge } from '../../components/ui/Feedback'
import { FormAlert, safeNext } from './AuthParts'
import { mmss, useCountdown } from '../../lib/hooks'
import { toAppError } from '../../lib/errors'
import { otpSchema } from '../../lib/schemas'
import { OTP_LENGTH } from '../../lib/constants'
import { useToast } from '../../components/ui/Feedback'

/** Isi form OTP, dipakai pelanggan dan staf. Perilaku: 5 menit, maks 3 percobaan, kirim ulang setelah hitung mundur. */
export function OtpForm({ staff }) {
  const { challenge, verify, resend, clearChallenge } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const toast = useToast()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [top, setTop] = useState('')
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useCountdown(challenge?.resendIn ?? 60, challenge?.email)
  useEffect(() => {
    if (code.length === OTP_LENGTH && !busy) submit()
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps
  async function submit(e) {
    e?.preventDefault()
    setTop('')
    const parsed = otpSchema.safeParse(code)
    const m = parsed.success ? '' : parsed.error.issues[0].message
    setErr(m)
    if (m) return
    setBusy(true)
    try {
      const u = await verify(code)
      nav(safeNext(sp.get('next')) || homeFor(u.role), { replace: true })
    } catch (x) {
      const a = toAppError(x)
      if (a.code === 'OTP_INVALID') setErr(`Kode salah. Sisa ${a.meta?.attempts_left ?? 0} percobaan.`)
      else if (a.code === 'OTP_EXPIRED' || a.code === 'OTP_TOO_MANY') setErr(a.message)
      else setTop(a.message)
      setCode('')
    } finally {
      setBusy(false)
    }
  }
  const again = async () => {
    try {
      const r = await resend()
      setLeft(r.resend_in ?? 60)
      setCode('')
      setErr('')
      toast.success('Kode baru dikirim', 'Cek emailmu.')
    } catch (x) {
      setTop(toAppError(x).message)
    }
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-label="Verifikasi OTP">
      <FormAlert>{top}</FormAlert>
      <OtpInput
        value={code}
        onChange={(v) => {
          setCode(v)
          setErr('')
        }}
        error={err}
        disabled={busy}
      />
      {challenge?.hint && (
        <p className="border-2 border-dashed border-ink bg-yellow/60 p-2 text-[13px]">
          <DataBadge /> Kode demo: <b>{challenge.hint}</b>
        </p>
      )}
      <Button type="submit" size="lg" block loading={busy} disabled={code.length < OTP_LENGTH}>
        Verifikasi
      </Button>
      <p className="text-sm" aria-live="polite">
        {left > 0 ? (
          <>
            Kirim ulang kode dalam <b>{mmss(left)}</b>
          </>
        ) : (
          <>
            Kode kedaluwarsa atau tidak masuk?{' '}
            <button type="button" onClick={again} className="font-extrabold underline">
              Kirim ulang kode
            </button>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => {
          clearChallenge()
          nav(staff ? '/staf/masuk' : '/masuk', { replace: true })
        }}
        className="label-caps text-xs underline underline-offset-4"
      >
        ← Ganti email
      </button>
    </form>
  )
}
export const NeedChallenge = ({ staff, children }) => {
  const { challenge } = useAuth()
  if (!challenge || (challenge.scope === 'staff') !== !!staff)
    return <Navigate to={staff ? '/staf/masuk' : '/masuk'} replace />
  return children
}
