import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    }
  }

  const validate = () => {
    const errors = {}
    if (!form.fullName.trim()) errors.fullName = 'Full name is required.'
    if (!form.username.trim()) errors.username = 'Username is required.'
    if (!form.email.trim()) errors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.'
    }
    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Passwords do not match.'
    }
    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      await register({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 qc-bg-primary">
      <div className="absolute inset-0 qc-bg-accent-radial-soft" aria-hidden="true" />
      <Card glass={false} className="relative z-10 w-full max-w-sm qc-card qc-card-elevated" style={{ boxShadow: '0 0 28px rgba(117,53,208,0.10), 0 1px 3px rgba(0,0,0,0.22)' }}>
        <div className="flex flex-col items-center gap-2 text-center mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border qc-border-accent qc-bg-accent-soft">
            <span className="text-base font-bold qc-text-gradient-gold">♞</span>
          </div>
          <Badge tone="accent" size="sm" icon={Sparkles}>
            Get started
          </Badge>
          <h1 className="text-lg font-extrabold qc-text-primary leading-tight">
            Create your account
          </h1>
          <p className="text-[11px] qc-text-secondary leading-snug">
            Join the Queen Chess AI training suite.
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
            label="Full Name"
            placeholder="Alex Rivera"
            value={form.fullName}
            onChange={update('fullName')}
            error={fieldErrors.fullName}
            autoComplete="name"
            required
          />

          <Input
            label="Username"
            placeholder="alexriv"
            value={form.username}
            onChange={update('username')}
            error={fieldErrors.username}
            autoComplete="username"
            required
          />

          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            error={fieldErrors.email}
            autoComplete="email"
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update('password')}
              error={fieldErrors.password}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-7 rounded p-1 qc-text-secondary qc-hover-text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              label="Confirm Password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              error={fieldErrors.confirmPassword}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-7 rounded p-1 qc-text-secondary qc-hover-text-primary"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>

          <Button type="submit" variant="primary" size="sm" fullWidth loading={loading} leftIcon={UserPlus}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] qc-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium qc-link-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default Register
