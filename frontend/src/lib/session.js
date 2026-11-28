// Token disimpan di sessionStorage (backend belum memakai refresh cookie httpOnly). Risiko XSS dicatat di README.
const KEY = 'gc.session'
export const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}
export const setSession = (s) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* penyimpanan penuh/diblokir */
  }
}
export const clearSession = () => {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* abaikan */
  }
}
