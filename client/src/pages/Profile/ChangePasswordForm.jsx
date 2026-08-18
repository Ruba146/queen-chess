import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { userApi } from '../../services/api'

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword) {
      setError('Both current and new password are required.')
      return
    }

    setLoading(true)
    try {
      await userApi.changePassword({ currentPassword, newPassword })
      setSuccess('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err.message || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padded={false}>
      <h3 className="mb-1 text-xs font-bold qc-text-primary">Change Password</h3>
      <p className="mb-2.5 text-[10px] qc-text-secondary">Manage your password security.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div role="alert" className="rounded-lg border border-[var(--qc-error)]/30 bg-[var(--qc-error)]/10 px-3 py-2.5 text-xs text-[var(--qc-error)]">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="flex items-center gap-2 rounded-lg border border-[var(--qc-success)]/30 bg-[var(--qc-success)]/10 px-3 py-2.5 text-xs text-[var(--qc-success)]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {success}
          </div>
        )}

        <Input type="password" label="Current Password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
        <Input type="password" label="New Password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />

        <Button type="submit" variant="primary" loading={loading} className="self-start">
          {loading ? 'Changing…' : 'Change Password'}
        </Button>
      </form>
    </Card>
  )
}

export default ChangePasswordForm