import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../node'
import { resetMockDb } from '../server'
import { authApi, reservationApi, staffApi } from '../../lib/api'
import { setSession, clearSession } from '../../lib/session'
import { addDays, todayWIB } from '../../lib/format'

// Menguji jalur penuh: Axios -> MSW -> logika backend tiruan, persis seperti di browser.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  resetMockDb()
  clearSession()
})
afterAll(() => server.close())

describe('MSW + apiClient', () => {
  it('login -> OTP -> token, lalu endpoint terproteksi memakai token itu', async () => {
    const c = await authApi.login({ email: 'raka@email.com', password: 'password123' })
    expect(c.email_masked).toMatch(/^ra\*\*\*@/)
    const r = await authApi.verifyOtp({ email: 'raka@email.com', code: '482913' })
    expect(r.user.role).toBe('customer')
    setSession({ token: r.token, user: r.user })
    const mine = await reservationApi.mine({ status: 'upcoming', page: 1 })
    expect(mine.items.length).toBeGreaterThan(0)
  })
  it('error server dipetakan ke AppError (401 salah sandi, 403 salah peran)', async () => {
    await expect(authApi.login({ email: 'raka@email.com', password: 'salah' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    })
    const c = await authApi.login({ email: 'raka@email.com', password: 'password123' })
    expect(c).toBeTruthy()
    const r = await authApi.verifyOtp({ email: 'raka@email.com', code: '482913' })
    setSession({ token: r.token, user: r.user })
    await expect(staffApi.reservations({})).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 })
  })
  it('availability membaca query string dan mengembalikan 10 meja', async () => {
    const r = await reservationApi.availability(addDays(todayWIB(), 4), '07-09')
    expect(r.tables).toHaveLength(10)
    expect(r.full).toBe(false)
  })
})
