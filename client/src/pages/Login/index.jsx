import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Sparkles, ArrowLeft } from 'lucide-react'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      await login({ email, password, remember })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 qc-bg-primary">
      <div className="absolute inset-0 qc-bg-accent-radial-soft" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm">
        <Link
          to="/landing"
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border qc-border-accent qc-bg-accent-soft px-3 py-2 text-xs font-semibold text-[var(--qc-purple-light)] transition-colors hover:bg-[rgba(122,53,212,0.18)] hover:text-[var(--qc-text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Queen Chess
        </Link>
        <Card glass={false} className="relative z-10 w-full qc-card qc-card-elevated" style={{ boxShadow: '0 0 28px rgba(117,53,208,0.10), 0 1px 3px rgba(0,0,0,0.22)' }}>
          <div className="flex flex-col items-center gap-2 text-center mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border qc-border-accent qc-bg-accent-soft">
              <span className="text-base font-bold qc-text-gradient-gold">♞</span>
            </div>
            <Badge tone="accent" size="sm" icon={Sparkles}>
              Welcome back
            </Badge>
            <h1 className="text-lg font-extrabold qc-text-primary leading-tight">
              Sign in to Queen Chess
            </h1>
            <p className="text-[11px] qc-text-secondary leading-snug">
              Continue your training journey.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && (
              <div
                role="alert"
                className="rounded-md border qc-border-error qc-bg-error-soft px-2.5 py-1.5 text-[11px] qc-text-error"
              >
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-7 rounded p-1 qc-text-secondary transition-colors hover:qc-text-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <label className="flex cursor-pointer items-center gap-1.5 qc-text-secondary">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border qc-border qc-bg-card accent-[var(--qc-gold)]"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="qc-link-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="sm" fullWidth loading={loading} leftIcon={LogIn}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] qc-text-secondary">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium qc-link-primary hover:underline">
              Register
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default Login
