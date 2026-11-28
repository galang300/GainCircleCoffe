import { safeNext } from './AuthParts'

describe('safeNext (cegah open redirect)', () => {
  it('menerima path internal', () => {
    expect(safeNext('/reservasi')).toBe('/reservasi')
    expect(safeNext('/dashboard/kas?x=1')).toBe('/dashboard/kas?x=1')
  })
  it('menolak URL luar, protocol-relative, dan backslash', () => {
    for (const bad of [
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      '\\\\evil.com',
      'javascript:alert(1)',
      '',
      null,
      undefined,
      '/a\nb',
    ])
      expect(safeNext(bad)).toBeNull()
  })
})
