import { http, HttpResponse } from 'msw'
import { ENV } from '../lib/constants'
import { handle } from './server'

// Semua request ke VITE_API_BASE_URL diteruskan ke logika backend tiruan (server.js).
const base = ENV.apiBase.replace(/\/$/, '')
const basePath = new URL(base, globalThis.location?.href ?? 'http://localhost').pathname.replace(/\/$/, '')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function readBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return {}
  const type = request.headers.get('content-type') || ''
  if (type.includes('multipart/form-data')) return request.formData()
  if (type.includes('json')) return request.json().catch(() => ({}))
  return {}
}

export const handlers = [
  http.all(`${base}/*`, async ({ request }) => {
    const url = new URL(request.url)
    if (import.meta.env.MODE !== 'test') await sleep(200 + Math.random() * 120) // simulasi latensi jaringan
    const out = await handle({
      method: request.method,
      path: url.pathname.slice(basePath.length) || '/',
      query: Object.fromEntries(url.searchParams),
      body: await readBody(request),
      headers: Object.fromEntries(request.headers),
    })
    return HttpResponse.json(out.body, { status: out.status })
  }),
]
