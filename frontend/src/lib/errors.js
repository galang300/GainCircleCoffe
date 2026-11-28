/** Error aplikasi terstandar. Kode backend dipetakan ke pesan Bahasa Indonesia yang memberi arahan. */
export class AppError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message, fields, retryAfter, meta } = {}) {
    super(message || MESSAGES[code] || MESSAGES.UNKNOWN)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.fields = fields || null
    this.retryAfter = retryAfter ?? null
    this.meta = meta || null
  }
}

export const MESSAGES = {
  UNKNOWN: 'Terjadi kesalahan. Coba lagi sebentar.',
  NETWORK: 'Server tidak bisa dihubungi. Datamu aman, coba lagi.',
  TIMEOUT: 'Server terlalu lama merespons. Coba lagi.',
  SERVER_ERROR: 'Server sedang bermasalah. Coba lagi beberapa saat.',
  UNAUTHORIZED: 'Sesi berakhir. Masuk lagi untuk melanjutkan.',
  FORBIDDEN: 'Akunmu tidak punya akses ke halaman ini.',
  NOT_FOUND: 'Data tidak ditemukan.',
  VALIDATION: 'Ada isian yang perlu diperbaiki.',
  INVALID_CREDENTIALS: 'Email atau kata sandi salah',
  EMAIL_ALREADY_REGISTERED: 'Email sudah terdaftar',
  OTP_INVALID: 'Kode salah.',
  OTP_EXPIRED: 'Kode kedaluwarsa. Kirim ulang kode.',
  OTP_TOO_MANY: 'Percobaan habis. Kirim ulang kode baru.',
  TABLE_ALREADY_BOOKED: 'Meja sudah dipesan. Pilih meja atau jam lain.',
  SLOT_PAST: 'Slot ini sudah lewat. Pilih slot berikutnya.',
  TICKET_NOT_FOUND: 'Tiket tidak ditemukan. Periksa kode dan 4 digit WhatsApp.',
  RATE_LIMITED: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  AI_UNAVAILABLE: 'Asisten sedang sibuk (kuota API). Coba lagi sebentar ya.',
  MODEL_UNAVAILABLE: 'Model gagal menghitung prediksi.',
  FILE_INVALID: 'File tidak valid.',
}

const byStatus = (s) =>
  ({
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'TABLE_ALREADY_BOOKED',
    422: 'VALIDATION',
    429: 'RATE_LIMITED',
  })[s] || (s >= 500 ? 'SERVER_ERROR' : 'UNKNOWN')

/** Ubah error axios / respons server menjadi AppError. */
export function toAppError(err) {
  if (err instanceof AppError) return err
  if (err?.code === 'ECONNABORTED') return new AppError({ code: 'TIMEOUT' })
  const res = err?.response
  if (!res) return new AppError({ code: 'NETWORK' })
  const e = res.data?.error || {}
  const code = e.code || byStatus(res.status)
  return new AppError({
    status: res.status,
    code,
    message: MESSAGES[code] && !e.message ? MESSAGES[code] : e.message,
    fields: e.fields,
    retryAfter: e.retry_after ?? (Number(res.headers?.['retry-after']) || null),
    meta: e.meta,
  })
}
export const messageOf = (err) => toAppError(err).message
export const isNetwork = (e) => ['NETWORK', 'TIMEOUT'].includes(e?.code)
