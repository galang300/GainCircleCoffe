import axios from 'axios'
import { ENV } from './constants'
import { AppError, toAppError } from './errors'
import { getSession } from './session'

/** Satu-satunya instance Axios. Komponen tidak boleh menulis URL sendiri; pakai fungsi di api.js. */
export const http = axios.create({
  baseURL: ENV.apiBase,
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const s = getSession()
  if (s?.token) config.headers.Authorization = `Bearer ${s.token}`
  return config
})

http.interceptors.response.use(
  (res) => {
    const b = res.data
    // Respons seragam { success, data, error }. File (blob) dilewatkan apa adanya.
    if (b && typeof b === 'object' && 'success' in b) {
      if (!b.success)
        throw new AppError({
          status: res.status,
          code: b.error?.code,
          message: b.error?.message,
          fields: b.error?.fields,
        })
      return b.data
    }
    return b
  },
  (err) => {
    const e = toAppError(err)
    if (e.status === 401 && !err.config?.skipSessionExpired && getSession()) {
      window.dispatchEvent(new CustomEvent('gc:session-expired'))
    }
    return Promise.reject(e)
  },
)
