import { useAuth } from '../app/AuthContext'
import { AuthSplit } from '../features/auth/AuthParts'
import { NeedChallenge, OtpForm } from '../features/auth/OtpPage'
import { useDocTitle } from '../lib/hooks'

export default function VerifikasiOtp() {
  useDocTitle('Verifikasi OTP')
  const { challenge } = useAuth()
  return (
    <NeedChallenge>
      <AuthSplit
        eyebrow="Satu langkah lagi"
        title="Masukkan kode"
        intro={
          <>
            Kami kirim 6 digit kode ke <b>{challenge?.emailMasked}</b>. Berlaku 5 menit.
          </>
        }
        word="OTP."
        aside="Biar akunmu aman."
      >
        <OtpForm />
      </AuthSplit>
    </NeedChallenge>
  )
}
