import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useState } from 'react'
import OtpInput from '../ui/OtpInput'
import Button from '../ui/Button'
import { TextField } from '../ui/Fields'
import FloorPlan from '../../features/reservation/FloorPlan'
import Ticket from '../../features/reservation/Ticket'
import { RatioMeter } from '../../features/cashflow/charts'

const Otp = ({ onChange }) => {
  const [v, setV] = useState('')
  return (
    <OtpInput
      value={v}
      onChange={(x) => {
        setV(x)
        onChange?.(x)
      }}
    />
  )
}

describe('komponen', () => {
  it('OtpInput: mengetik berpindah kolom, tempel mengisi 6 digit, backspace mundur', async () => {
    const user = userEvent.setup()
    const fn = vi.fn()
    render(<Otp onChange={fn} />)
    await user.click(screen.getByLabelText('Digit 1'))
    await user.keyboard('48')
    expect(fn).toHaveBeenLastCalledWith('48')
    expect(screen.getByLabelText('Digit 3')).toHaveFocus()
    await user.paste('291375')
    expect(fn).toHaveBeenLastCalledWith('48291375'.slice(0, 6))
  })
  it('Button loading: nonaktif, aria-busy, tidak memicu klik', async () => {
    const user = userEvent.setup()
    const fn = vi.fn()
    render(
      <Button loading onClick={fn}>
        Simpan
      </Button>,
    )
    const b = screen.getByRole('button', { name: /simpan/i })
    expect(b).toBeDisabled()
    expect(b).toHaveAttribute('aria-busy', 'true')
    await user.click(b)
    expect(fn).not.toHaveBeenCalled()
  })
  it('TextField: label terhubung ke input dan error dibacakan (role=alert)', () => {
    render(<TextField label="Email" required error="Format email tidak valid" />)
    const i = screen.getByLabelText(/email/i)
    expect(i).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Format email tidak valid')
  })
  it('FloorPlan: bisa dipilih lewat klik & keyboard; meja nonaktif tidak bisa dipilih', async () => {
    const user = userEvent.setup()
    const pick = vi.fn()
    render(
      <FloorPlan
        statusOf={(id) => (id === 'T02' ? 'dipesan' : 'kosong')}
        disabledIds={['T02']}
        onSelect={pick}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Meja T05/ }))
    expect(pick).toHaveBeenCalledWith('T05')
    screen.getByRole('button', { name: /Meja T06/ }).focus()
    await user.keyboard('{Enter}')
    expect(pick).toHaveBeenCalledWith('T06')
    await user.click(screen.getByRole('button', { name: /Meja T02/ }))
    expect(pick).not.toHaveBeenCalledWith('T02')
    expect(screen.getByRole('button', { name: /Meja T02.*Dipesan/ })).toHaveAttribute('aria-disabled', 'true')
  })
  it('Ticket: menampilkan kode, meja, jam, status, dan QR berlabel', () => {
    render(
      <MemoryRouter>
        <Ticket
          res={{
            code: 'GC-2611-0187',
            name: 'Raka Pratama',
            table: 'T05',
            date: '2026-11-20',
            slot: '19-21',
            guests: 4,
            status: 'dikonfirmasi',
          }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('GC-2611-0187')).toBeInTheDocument()
    expect(screen.getByText('T05')).toBeInTheDocument()
    expect(screen.getByText(/19\.00 – 21\.00/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /QR kode GC-2611-0187/ })).toBeInTheDocument()
    expect(screen.getAllByText('Dikonfirmasi').length).toBeGreaterThan(0)
  })
  it('RatioMeter punya alternatif teks untuk pembaca layar', () => {
    render(<RatioMeter ratio={0.82} />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('82%'))
  })
})
