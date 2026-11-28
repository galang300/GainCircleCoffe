import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import PublicLayout from './PublicLayout'
import DashboardLayout from './DashboardLayout'
import ScrollManager from './ScrollManager'
import SessionExpiredModal from './SessionExpiredModal'
import { GuestOnly, RequireCustomer, RequireOwner, RequireStaff, homeFor } from './guards'
import { useAuth } from './AuthContext'
import { ErrorState } from '../components/ui/Feedback'
import { NotFound, Forbidden } from '../pages/Status'

const page = (load, handle) => ({ lazy: async () => ({ Component: (await load()).default }), handle })
const named = (load, key, handle) => ({ lazy: async () => ({ Component: (await load())[key] }), handle })

function Root() {
  return (
    <>
      <ScrollManager />
      <Outlet />
      <SessionExpiredModal />
    </>
  )
}
function DashHome() {
  const { role } = useAuth()
  return <Navigate to={homeFor(role)} replace />
}
function Boundary() {
  return (
    <div className="p-10">
      <ErrorState
        title="Terjadi kesalahan"
        error={{ code: 'UNKNOWN' }}
        onRetry={() => window.location.assign('/')}
      />
    </div>
  )
}

const D = (title, sub) => ({ title, sub })
export const routes = [
  {
    element: <Root />,
    errorElement: <Boundary />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, ...page(() => import('../pages/Home')) },
          {
            element: <GuestOnly />,
            children: [
              { path: 'masuk', ...page(() => import('../pages/Masuk')) },
              { path: 'daftar', ...page(() => import('../pages/Daftar')) },
              { path: 'verifikasi-otp', ...page(() => import('../pages/VerifikasiOtp')) },
            ],
          },
          { path: 'cek-tiket', ...page(() => import('../pages/CekTiket')) },
          {
            element: <RequireCustomer />,
            children: [
              { path: 'tiket-saya', ...page(() => import('../pages/TiketSaya')) },
              {
                path: 'reservasi',
                ...page(() => import('../pages/Reservasi')),
                children: [
                  { index: true, ...named(() => import('../pages/Reservasi'), 'PilihMeja') },
                  { path: 'data', ...page(() => import('../pages/ReservasiData')) },
                ],
              },
              { path: 'reservasi/tiket/:kode', ...page(() => import('../pages/ReservasiTiket')) },
            ],
          },
          { path: 'akses-ditolak', element: <Forbidden /> },
          ...(import.meta.env.DEV
            ? [{ path: 'dev/style-guide', ...page(() => import('../pages/StyleGuide')) }]
            : []),
          { path: '*', element: <NotFound /> },
        ],
      },
      {
        element: <GuestOnly staff />,
        children: [
          { path: 'staf/masuk', ...page(() => import('../pages/StafMasuk')) },
          { path: 'staf/verifikasi', ...page(() => import('../pages/StafVerifikasi')) },
        ],
      },
      {
        path: 'dashboard',
        element: <RequireStaff />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashHome /> },
              {
                path: 'reservasi',
                ...page(
                  () => import('../pages/dashboard/Reservasi'),
                  D('Daftar reservasi', 'Reservasi lewat website'),
                ),
                children: [
                  {
                    path: ':kode',
                    ...named(() => import('../pages/dashboard/Reservasi'), 'DetailReservasi'),
                  },
                ],
              },
              {
                path: 'meja',
                ...page(
                  () => import('../pages/dashboard/StatusMeja'),
                  D('Status meja', 'Ubah status fisik meja'),
                ),
              },
              {
                path: 'pengeluaran',
                ...named(
                  () => import('../pages/dashboard/Finance'),
                  'Pengeluaran',
                  D('Catat pengeluaran', 'Pengeluaran harian'),
                ),
              },
              {
                path: 'pemasukan',
                ...named(
                  () => import('../pages/dashboard/Finance'),
                  'Pemasukan',
                  D('Catat pemasukan', 'Omzet harian'),
                ),
              },
              {
                path: 'pemasukan/impor',
                ...page(
                  () => import('../pages/dashboard/ImporSales'),
                  D('Impor data sales', 'CSV atau XLSX'),
                ),
              },
              {
                element: <RequireOwner />,
                children: [
                  {
                    path: 'kas',
                    ...page(
                      () => import('../pages/dashboard/ArusKas'),
                      D('Kesehatan arus kas', 'Scorecard & grafik inflow vs outflow · model XGBoost'),
                    ),
                  },
                  {
                    path: 'asisten',
                    ...page(
                      () => import('../pages/dashboard/Asisten'),
                      D('Asisten AI', 'Tanya kondisi kas dengan bahasa sehari-hari'),
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
export const createRouter = () => createBrowserRouter(routes)
