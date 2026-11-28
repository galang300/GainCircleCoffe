import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/index.css'

async function boot() {
  // Backend tiruan (MSW) hanya dimuat bila VITE_USE_MOCKS=true. Pada build produksi biasa, cabang ini dibuang.
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
    // eslint-disable-next-line no-console
    console.info(
      '%c[Gain Circle] Mode DATA CONTOH aktif: backend tiruan (MSW), semua data fiktif.',
      'background:#FDD923;color:#171210;padding:2px 6px',
    )
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
boot()
