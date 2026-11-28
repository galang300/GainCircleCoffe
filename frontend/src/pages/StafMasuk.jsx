import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../app/AuthContext'
import Button from '../components/ui/Button'
import { Checkbox, TextField } from '../components/ui/Fields'
import Logo from '../components/brand/Logo'
import { DemoCreds, FormAlert, PasswordField, safeNext } from '../features/auth/AuthParts'
import { NeedChallenge, OtpForm } from '../features/auth/OtpPage'
import { useDocTitle } from '../lib/hooks'
import { loginSchema } from '../lib/schemas'
import { toAppError } from '../lib/errors'

const STAFF = ['staff', 'owner']
const KEY = 'gc.staffEmail'
const remembered = () => {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

function Shell({ title, sub, children }) {
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-ink text-cream lg:grid-cols-[minmax(0,560px)_1fr]">
      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <Link to="/" className="label-caps mb-8 text-xs text-neon">
          ← Kembali ke website
        </Link>
        <Logo height={40} className="mb-6" />
        <h1 className="text-5xl leading-none sm:text-6xl">{title}</h1>
        <p className="mt-2 font-serif text-xl text-cream/80">{sub}</p>
        <div className="mt-8 border-2 border-cream bg-card p-6 text-ink shadow-[8px_8px_0_#75F237]">
          {children}
        </div>
        <p className="mt-6 text-[13px] text-cream/70">
          Peran ditentukan oleh akun. Setelah masuk, kamu diminta kode OTP. Lupa kata sandi? Hubungi owner.
        </p>
      </div>
      <div aria-hidden="true" className="relative hidden select-none lg:block">
        <p className="absolute -right-6 top-24 font-display text-[250px] uppercase leading-[.85] text-cream/95">
          Back
          <br />
          of
          <br />
          house.
        </p>
        <span className="absolute bottom-24 left-16 -rotate-6 border-2 border-ink bg-yellow px-5 py-3 font-display text-3xl uppercase text-ink shadow-btn">
          Staf &amp; Owner only
        </span>
      </div>
    </div>
  )
}

export default function StafMasuk() {
  useDocTitle('Masuk dashboard')
  const { begin } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const q = safeNext(sp.get('next')) ? `?next=${encodeURIComponent(sp.get('next'))}` : ''
  const [keep, setKeep] = useState(!!remembered())
  const [top, setTop] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: remembered(), password: '' } })

  const onSubmit = handleSubmit(async (v) => {
    setTop('')
    try {
      await begin('staff', 'login', { email: v.email, password: v.password })
      try {
        if (keep) localStorage.setItem(KEY, v.email)
        else localStorage.removeItem(KEY)
      } catch {
        /* penyimpanan diblokir: abaikan */
      }
      nav(`/staf/verifikasi${q}`)
    } catch (x) {
      const a = toAppError(x)
      if (a.code === 'INVALID_CREDENTIALS') setError('password', { message: a.message })
      else setTop(a.message)
    }
  })

  return (
    <Shell title="Masuk dashboard" sub="Gunakan akun yang diberikan owner.">
      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Masuk dashboard">
        <FormAlert>{top}</FormAlert>
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="staf@gaincircle.id"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <Checkbox
          label="Ingat email di perangkat ini"
          checked={keep}
          onChange={(e) => setKeep(e.target.checked)}
        />
        <Button type="submit" size="lg" block loading={isSubmitting}>
          Masuk
        </Button>
      </form>
      <DemoCreds roles={STAFF} />
    </Shell>
  )
}
export function StafVerifikasi() {
  useDocTitle('Verifikasi OTP dashboard')
  const { challenge } = useAuth()
  return (
    <NeedChallenge staff>
      <Shell
        title="Verifikasi OTP"
        sub={`Kode 6 digit dikirim ke ${challenge?.emailMasked || 'emailmu'}. Berlaku 5 menit.`}
      >
        <OtpForm staff />
      </Shell>
    </NeedChallenge>
  )
}
