import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export const homeFor = (role) =>
  role === 'owner' ? '/dashboard/kas' : role === 'staff' ? '/dashboard/reservasi' : '/'
const here = (l) => encodeURIComponent(l.pathname + l.search)

/** C: pelanggan login. Belum login -> /masuk?next=… ; staf/owner tidak punya tiket pelanggan -> dashboard. */
export function RequireCustomer() {
  const { user, isCustomer } = useAuth()
  const l = useLocation()
  if (!user) return <Navigate to={`/masuk?next=${here(l)}`} replace />
  if (!isCustomer)
    return <Navigate to="/akses-ditolak" replace state={{ from: l.pathname, to: 'customer' }} />
  return <Outlet />
}
/** G: hanya tamu. Sudah login -> arahkan ke tujuan semestinya. */
export function GuestOnly({ staff = false }) {
  const { user } = useAuth()
  if (user) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet context={{ staff }} />
}
/** S: staf atau owner. */
export function RequireStaff() {
  const { user, isStaff } = useAuth()
  const l = useLocation()
  if (!user) return <Navigate to={`/staf/masuk?next=${here(l)}`} replace />
  if (!isStaff) return <Navigate to="/akses-ditolak" replace state={{ from: l.pathname, to: 'customer' }} />
  return <Outlet />
}
/** O: khusus owner. Staf -> halaman akses ditolak (layar 13). */
export function RequireOwner() {
  const { isOwner } = useAuth()
  const l = useLocation()
  if (!isOwner) return <Navigate to="/akses-ditolak" replace state={{ from: l.pathname, to: 'staff' }} />
  return <Outlet />
}
