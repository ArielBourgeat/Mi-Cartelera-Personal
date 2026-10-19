import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute } from './components/GuestRoute.tsx'
import { Layout } from './components/Layout.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import { CollectionPage } from './pages/CollectionPage.tsx'
import { DetailPage } from './pages/DetailPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { SearchPage } from './pages/SearchPage.tsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<SearchPage />} />
              <Route path="/mi-lista" element={<CollectionPage />} />
              <Route path="/titulo/:tipo/:tmdbId" element={<DetailPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
