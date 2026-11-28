import { useMemo } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { ToastProvider } from '../components/ui/Feedback'
import { createRouter } from './router'

export default function App() {
  const router = useMemo(() => createRouter(), [])
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  )
}
