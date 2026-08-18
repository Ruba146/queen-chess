import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Home from './pages/Home'
import Play from './pages/Play'
import MyGames from './pages/Analysis'
import Learning from './pages/Learning'
import Quiz from './pages/Quiz'
import Profile from './pages/Profile'
import Premium from './pages/Premium'
import Login from './pages/Login'
import Register from './pages/Register'

import Landing from './pages/Landing'

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="qc-spinner" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function RootRoute() {
  const { isAuthenticated, loading } = useAuth()
  const forceAuthenticated = import.meta.env.DEV || import.meta.env.VITE_FORCE_AUTH === 'true'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="qc-spinner" />
      </div>
    )
  }

  if (isAuthenticated || forceAuthenticated) {
    return (
      <AppLayout>
        <Home />
      </AppLayout>
    )
  }

  return <Landing />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="play" element={<Play />} />
            <Route path="my-games" element={<MyGames />} />
            <Route path="learning" element={<Learning />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="profile" element={<Profile />} />
            <Route path="premium" element={<Premium />} />
          </Route>
          <Route path="/" element={<RootRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
