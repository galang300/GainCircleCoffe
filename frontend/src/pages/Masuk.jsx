import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../app/AuthContext'
import Button from '../components/ui/Button'
import { TextField } from '../components/ui/Fields'
import { AuthSplit, DemoCreds, FormAlert, PasswordField, safeNext } from '../features/auth/AuthParts'
import { useDocTitle } from '../lib/hooks'
import { loginSchema } from '../lib/schemas'
import { toAppError } from '../lib/errors'

const CUSTOMER = ['customer']

export default function Masuk() {
  useDocTitle('Masuk')
  const { begin } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const next = safeNext(sp.get('next'))
  const q = next ? `?next=${encodeURIComponent(next)}` : ''
  const [top, setTop] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (v) => {
    setTop('')
    try {
      await begin('customer', 'login', { email: v.email, password: v.password })
      nav(`/verifikasi-otp${q}`)
    } catch (x) {
      const a = toAppError(x)
      if (a.code === 'INVALID_CREDENTIALS') setError('password', { message: a.message })
      else setTop(a.message)
    }
  })

  return (
    <AuthSplit
      eyebrow="Selamat datang kembali"
      title="Masuk pakai email"
      intro="Masuk dulu untuk reservasi meja."
      word="Dulu."
      aside="Biar tiketmu tersimpan dan gampang dicek."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Masuk">
        <FormAlert>{top}</FormAlert>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <Button type="submit" size="lg" block loading={isSubmitting}>
          Masuk
        </Button>
        <p className="text-[13px] text-muted">
          Setelah masuk, kami kirim kode OTP ke emailmu untuk keamanan.
        </p>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-5">
        <span className="label-caps">Belum punya akun?</span>
        <Button to={`/daftar${q}`} variant="white">
          Daftar sekarang
        </Button>
      </div>
      <DemoCreds roles={CUSTOMER} />
      <p className="mt-4 text-xs text-muted">
        <Link className="underline" to="/cek-tiket">
          Cuma mau cek tiket? Tidak perlu masuk.
        </Link>
      </p>
    </AuthSplit>
  )
}
