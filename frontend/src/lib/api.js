import { http } from './apiClient'

const idem = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random())
const noRedirect = { skipSessionExpired: true }

export const authApi = {
  register: (b) => http.post('/auth/register', b, noRedirect),
  login: (b) => http.post('/auth/login', b, noRedirect),
  verifyOtp: (b) => http.post('/auth/otp/verify', b, noRedirect),
  resendOtp: (b) => http.post('/auth/otp/resend', b, noRedirect),
  staffLogin: (b) => http.post('/staff/auth/login', b, noRedirect),
  staffVerifyOtp: (b) => http.post('/staff/auth/otp/verify', b, noRedirect),
  logout: () => http.post('/auth/logout', null, noRedirect),
  me: () => http.get('/auth/me'),
}

export const reservationApi = {
  tables: () => http.get('/tables'),
  availability: (date, slot) => http.get('/availability', { params: { date, slot } }),
  create: (b, key) => http.post('/reservations', b, { headers: { 'Idempotency-Key': key || idem() } }),
  mine: (params) => http.get('/reservations/mine', { params }),
  lookup: (code, phone4) => http.get('/reservations/lookup', { params: { code, phone4 }, ...noRedirect }),
  byCode: (code) => http.get(`/reservations/${code}`),
}

export const staffApi = {
  reservations: (params) => http.get('/staff/reservations', { params }),
  reservation: (code) => http.get(`/staff/reservations/${code}`),
  act: (code, body) => http.patch(`/staff/reservations/${code}`, body),
  tableStatus: () => http.get('/staff/tables/status'),
  setTableStatus: (id, status) => http.patch(`/staff/tables/${id}/status`, { status }),
  tableLog: () => http.get('/staff/tables/log'),
}

export const financeApi = {
  expenses: (params) => http.get('/expenses', { params }),
  expenseSummary: () => http.get('/expenses/summary'),
  addExpense: (b) => http.post('/expenses', b),
  updateExpense: (id, b) => http.patch(`/expenses/${id}`, b),
  salesDaily: (params) => http.get('/sales/daily', { params }),
  addSales: (b) => http.post('/sales/daily', b),
  importPreview: (file) => {
    const f = new FormData()
    f.append('file', file)
    return http.post('/sales/import/preview', f)
  },
  importCommit: (file) => {
    const f = new FormData()
    f.append('file', file)
    return http.post('/sales/import/commit', f)
  },
}

export const cashApi = {
  summary: (params) => http.get('/cashflow/summary', { params }),
  series: (params) => http.get('/cashflow/series', { params }),
  categories: (params) => http.get('/cashflow/categories', { params }),
  shap: (params) => http.get('/cashflow/shap', { params }),
  history: () => http.get('/cashflow/history'),
  notifications: () => http.get('/notifications'),
}

export const assistantApi = {
  send: (text) => http.post('/assistant/messages', { text }),
  history: () => http.get('/assistant/history'),
}
