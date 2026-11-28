import { test, expect } from '@playwright/test'

const future = (n) => new Date(Date.now() + (n * 24 + 7) * 3600e3).toISOString().slice(0, 10) // n hari lagi (WIB)
// Dijalankan terhadap build dengan VITE_USE_MOCKS=true (backend tiruan). Kode OTP demo: 482913.
const otp = async (page) => {
  await page.getByLabel('Digit 1').click()
  await page.keyboard.type('482913')
}
const loginCustomer = async (page) => {
  await page.goto('/masuk')
  await page.getByLabel('Email', { exact: true }).fill('raka@email.com')
  await page.getByLabel(/Kata sandi/).fill('password123')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await otp(page)
  await expect(page).toHaveURL('/')
}
const loginStaff = async (page, email, pw) => {
  await page.goto('/staf/masuk')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel(/Kata sandi/).fill(pw)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await otp(page)
  await expect(page).toHaveURL(/dashboard/)
}

test('pelanggan: reservasi meja sampai e-ticket terbit', async ({ page }) => {
  await loginCustomer(page)
  await page.goto(`/reservasi?tanggal=${future(3)}&jam=07-09`)
  await page.getByRole('button', { name: /^Meja T06/ }).click()
  await page.getByRole('button', { name: /Lanjut/ }).click()
  await page.getByText('Saya setuju meja ditahan').click()
  await page.getByRole('button', { name: 'Konfirmasi reservasi' }).click()
  await expect(page).toHaveURL(/reservasi\/tiket\/GC-/)
  await expect(page.getByRole('article', { name: /E-ticket GC-/ })).toContainText('T06')
})

test('pelanggan: meja disambar orang lain => modal 409 dan diarahkan pilih ulang', async ({ page }) => {
  await loginCustomer(page)
  await page.goto(`/reservasi?tanggal=${future(3)}&jam=07-09`)
  await page.getByRole('button', { name: /^Meja T04/ }).click()
  await page.getByRole('button', { name: /Lanjut/ }).click()
  await page.getByText('Saya setuju meja ditahan').click()
  await page.getByRole('button', { name: 'Konfirmasi reservasi' }).click()
  await expect(page.getByRole('dialog')).toContainText('sudah dipesan')
  await page.getByRole('button', { name: 'Pilih meja lain' }).click()
  await expect(page).toHaveURL(/\/reservasi$/)
})

test('akses: pelanggan tanpa login diarahkan ke masuk; staf ditolak dari halaman owner', async ({ page }) => {
  await page.goto('/tiket-saya')
  await expect(page).toHaveURL(/\/masuk\?next=/)
  await loginStaff(page, 'staf@gaincircle.id', 'staf12345')
  await page.goto('/dashboard/kas')
  await expect(page).toHaveURL(/akses-ditolak/)
  await expect(page.getByRole('heading', { name: 'Akses ditolak' })).toBeVisible()
})

test('owner: status kas tampil dan asisten menjawab dari data', async ({ page }) => {
  await loginStaff(page, 'owner@gaincircle.id', 'owner12345')
  await expect(page.getByLabel('Status kas')).toContainText(/Sehat|Waspada|Kritis/)
  await page.goto('/dashboard/asisten')
  await page.getByRole('button', { name: 'Apa yang bisa dihemat?' }).click()
  await expect(page.getByText(/Intent:/)).toBeVisible()
})

test('tidak ada overflow horizontal di halaman utama', async ({ page }) => {
  for (const p of ['/', '/masuk', '/cek-tiket']) {
    await page.goto(p)
    await page.waitForLoadState('networkidle')
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
    expect(sw, `overflow di ${p}`).toBeLessThanOrEqual(iw)
  }
})
