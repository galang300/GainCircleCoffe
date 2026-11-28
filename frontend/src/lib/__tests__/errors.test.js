import { AppError, toAppError } from '../errors'

describe('errors', () => {
  it('tanpa respons => NETWORK; timeout => TIMEOUT', () => {
    expect(toAppError(new Error('x')).code).toBe('NETWORK')
    expect(toAppError({ code: 'ECONNABORTED' }).code).toBe('TIMEOUT')
  })
  it('memetakan kode backend dan field validasi', () => {
    const e = toAppError({
      response: { status: 422, data: { error: { code: 'VALIDATION', fields: { email: 'x' } } }, headers: {} },
    })
    expect(e).toBeInstanceOf(AppError)
    expect(e.fields).toEqual({ email: 'x' })
    expect(e.status).toBe(422)
  })
  it('429 membawa retry_after; 409 => pesan meja sudah dipesan', () => {
    expect(
      toAppError({
        response: { status: 429, data: { error: { code: 'RATE_LIMITED', retry_after: 30 } }, headers: {} },
      }).retryAfter,
    ).toBe(30)
    expect(toAppError({ response: { status: 409, data: {}, headers: {} } }).message).toMatch(/sudah dipesan/i)
  })
  it('tidak membocorkan error mentah server 500', () => {
    expect(toAppError({ response: { status: 500, data: 'stack trace', headers: {} } }).message).toMatch(
      /Server sedang bermasalah/,
    )
  })
})
