import { z } from 'zod'
import { CATEGORIES } from './constants'
import { isValidDate, normalizePhone, todayWIB } from './format'
import { parseAmount } from './validators'

// Skema validasi semua form. Pesan memberi tahu cara memperbaiki. Validasi resmi tetap di server.
const email = z
  .string()
  .trim()
  .min(1, 'Email wajib diisi')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Format email tidak valid')

export const loginSchema = z.object({ email, password: z.string().min(1, 'Kata sandi wajib diisi') })

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 huruf'),
  email,
  phone: z.string().refine((v) => !!normalizePhone(v), 'Format nomor HP tidak valid. Contoh: 0812xxxxxxxx'),
  password: z.string().min(8, 'Minimal 8 karakter'),
  agree: z.boolean().refine((v) => v, 'Setujui aturan reservasi untuk lanjut'),
})

export const ticketLookupSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^GC-\d{4}-\d{4}$/i, 'Format kode: GC-YYMM-NNNN'),
  phone4: z.string().regex(/^\d{4}$/, 'Isi 4 angka terakhir nomor WhatsApp'),
})

export const bookingConfirmSchema = z.object({
  agree: z.boolean().refine((v) => v, 'Setujui aturan penahanan meja untuk lanjut'),
})

export const otpSchema = z.string().regex(/^\d{6}$/, 'Kode terdiri dari 6 angka')

const date = z
  .string()
  .min(1, 'Tanggal wajib diisi')
  .refine(isValidDate, 'Format tanggal tidak valid')
  .refine((d) => d <= todayWIB(), 'Tanggal tidak boleh di masa depan')
const amount = z
  .string()
  .min(1, 'Nominal wajib diisi')
  .refine((v) => parseAmount(v) > 0, 'Nominal harus lebih dari 0')

export const expenseSchema = z.object({
  date,
  category: z.enum(CATEGORIES, { error: 'Kategori wajib dipilih' }),
  amount,
  note: z.string().max(120, 'Catatan maks. 120 karakter').optional(),
})

export const salesSchema = z.object({ date, amount })
