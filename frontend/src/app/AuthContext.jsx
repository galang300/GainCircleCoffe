import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { authApi } from '../lib/api'
import { clearSession, getSession, setSession } from '../lib/session'
import { ROLES } from '../lib/constants'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

const init = () => {
  const s = getSession()
  return { user: s?.user || null, token: s?.token || null, challenge: null, expired: false }
}
function reducer(state, a) {
  switch (a.type) {
    case 'challenge':
      return { ...state, challenge: a.challenge }
    case 'signed':
      return { user: a.user, token: a.token, challenge: null, expired: false }
    case 'out':
      return { user: null, token: null, challenge: null, expired: false }
    case 'expired':
      return state.token ? { ...state, expired: true } : state
    case 'dismiss':
      return { ...state, expired: false }
    default:
      return state
  }
}

/**
 * State auth global (Context + useReducer). Dua pintu masuk: pelanggan (/masuk) dan staf/owner (/staf/masuk).
 * Keduanya sandi -> OTP 6 digit lewat email. Peran ditentukan oleh akun di server.
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => {
    const on = () => dispatch({ type: 'expired' })
    window.addEventListener('gc:session-expired', on)
    return () => window.removeEventListener('gc:session-expired', on)
  }, [])

  const begin = useCallback(async (scope, purpose, body) => {
    const fn =
      scope === 'staff' ? authApi.staffLogin : purpose === 'register' ? authApi.register : authApi.login
    const res = await fn(body)
    dispatch({
      type: 'challenge',
      challenge: {
        scope,
        purpose,
        email: body.email,
        emailMasked: res.email_masked,
        resendIn: res.resend_in ?? 60,
        hint: res.demo_hint || null,
      },
    })
    return res
  }, [])

  const verify = useCallback(
    async (code) => {
      const c = state.challenge
      const fn = c.scope === 'staff' ? authApi.staffVerifyOtp : authApi.verifyOtp
      const res = await fn({ email: c.email, code })
      setSession({ token: res.token, user: res.user })
      dispatch({ type: 'signed', user: res.user, token: res.token })
      return res.user
    },
    [state.challenge],
  )

  const resend = useCallback(async () => {
    const c = state.challenge
    return authApi.resendOtp({ email: c.email, scope: c.scope })
  }, [state.challenge])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* sesi sudah tidak valid di server: tetap keluar di klien */
    }
    clearSession()
    dispatch({ type: 'out' })
  }, [])

  const dropSession = useCallback(() => {
    clearSession()
    dispatch({ type: 'out' })
  }, [])
  const value = useMemo(
    () => ({
      ...state,
      role: state.user?.role || null,
      isCustomer: state.user?.role === ROLES.customer,
      isStaff: state.user?.role === ROLES.staff || state.user?.role === ROLES.owner,
      isOwner: state.user?.role === ROLES.owner,
      begin,
      verify,
      resend,
      logout,
      dropSession,
      clearChallenge: () => dispatch({ type: 'challenge', challenge: null }),
      dismissExpired: () => dispatch({ type: 'dismiss' }),
    }),
    [state, begin, verify, resend, logout, dropSession],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
