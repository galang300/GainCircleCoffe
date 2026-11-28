import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../app/AuthContext'
import Button from '../components/ui/Button'
import { Checkbox, TextField } from '../components/ui/Fields'
import { AuthSplit, FormAlert, PasswordField, safeNext } from '../features/auth/AuthParts'
import { useDocTitle } from '../lib/hooks'
import { registerSchema } from '../lib/schemas'
import { normalizePhone } from '../lib/format'
import { toAppError } from '../lib/errors'

export default function Daftar() {
  useDocTitle('Daftar')
  const { begin } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const next = safeNext(sp.get('next'))
  const q = next ? `?next=${encodeURIComponent(next)}` : ''
  const [top, setTop] = useState('')
  const [dupe, setDupe] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', agree: false },
  })

  const onSubmit = handleSubmit(async (v) => {
    setTop('')
    setDupe(false)
    try {
      await begin('customer', 'register', {
        name: v.name,
        email: v.email,
        phone: normalizePhone(v.phone),
        password: v.password,
      })
      nav(`/verifikasi-otp${q}`)
    } catch (x) {
      const a = toAppError(x)
      if (a.code === 'EMAIL_ALREADY_REGISTERED') {
        setDupe(true)
        setError('email', { message: 'Email sudah terdaftar' })
      } else if (a.fields) {
        Object.entries(a.fields).forEach(([k, message]) => setError(k, { message }))
      } else setTop(a.message)
    }
  })

  return (
    <AuthSplit
      eyebrow="Baru di sini?"
      title="Buat akun"
      intro="Cukup sekali. Data dipakai untuk mengisi form reservasi."
      word="Sekali."
      aside="Cukup nama, email, dan nomor WhatsApp."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Daftar">
        <FormAlert>{top}</FormAlert>
        <TextField
          label="Nama lengkap"
          required
          autoComplete="name"
          placeholder="Raka Pratama"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Email"
          required
          type="email"
          autoComplete="email"
          placeholder="raka@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        {dupe && (
          <div role="alert" className="border-2 border-ink bg-yellow p-4">
            <p className="font-display text-xl uppercase">Email sudah terdaftar</p>
            <p className="mt-1 text-sm">Pakai email lain, atau masuk ke akun yang sudah ada.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button to={`/masuk${q}`} size="sm" variant="ink">
                Masuk saja
              </Button>
              <Button
                size="sm"
                variant="white"
                onClick={() => {
                  setDupe(false)
                  setValue('email', '')
                  setFocus('email')
                }}
              >
                Pakai email lain
              </Button>
            </div>
          </div>
        )}
        <TextField
          label="Nomor WhatsApp"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812xxxxxxxx"
          hint="Dipakai untuk cek tiket (4 digit terakhir)."
          error={errors.phone?.message}
          {...register('phone')}
        />
        <PasswordField
          label="Kata sandi *"
          autoComplete="new-password"
          hint="Minimal 8 karakter."
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Checkbox
          label="Saya setuju dengan aturan reservasi."
          error={errors.agree?.message}
          {...register('agree')}
        />
        <Button type="submit" size="lg" block loading={isSubmitting}>
          Daftar
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-5">
        <span className="label-caps">Sudah punya akun?</span>
        <Button to={`/masuk${q}`} variant="white">
          Masuk
        </Button>
      </div>
    </AuthSplit>
  )
}
