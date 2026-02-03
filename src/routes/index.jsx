import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Products from '@/pages/master/Products'
import Categories from '@/pages/master/Categories'
import PaymentMethods from '@/pages/master/PaymentMethods'
import Transactions from '@/pages/Transactions'
import Reports from '@/pages/Reports'

function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'login', element: <Login /> },
      {
        path: '',
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'master/products', element: <Products /> },
          { path: 'master/categories', element: <Categories /> },
          { path: 'master/payment-methods', element: <PaymentMethods /> },
          { path: 'transactions', element: <Transactions /> },
          { path: 'reports', element: <Reports /> },
        ],
      },
    ],
  },
])
