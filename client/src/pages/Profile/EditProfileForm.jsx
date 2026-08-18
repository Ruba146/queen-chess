import { useState } from 'react'
import { User, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { userApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function EditProfileForm({ user, onSaved }) {
  const { restoreSession } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [username, setUsername] = useState(user?.username || '')
  const [preferredSide, setPreferredSide] = useState(user?.preferredSide || 'random')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!displayName.trim() || !username.trim()) {
      setError('Display name and username are required.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        displayName: displayName.trim(),
        username: username.trim(),
        preferredSide,
      }
      await userApi.updateProfile(payload)
      await restoreSession()
      setSuccess('Profile updated successfully.')
      if (onSaved) onSaved()
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padded={false}>
      <h3 className="mb-1 text-xs font-bold qc-text-primary">Edit Profile</h3>
      <p className="mb-2.5 text-[10px] qc-text-secondary">Update your display name, username and preferred side.</p>

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

        <Input label="Display Name" placeholder="Your display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} icon={User} required />
        <Input label="Username" placeholder="Your username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <div className="w-full">
          <label className="qc-form-label text-xs">Preferred Side</label>
          <select value={preferredSide} onChange={(e) => setPreferredSide(e.target.value)} className="qc-select text-xs py-2">
            <option value="random" className="bg-[var(--qc-bg-card)]">Random</option>
            <option value="white" className="bg-[var(--qc-bg-card)]">White</option>
            <option value="black" className="bg-[var(--qc-bg-card)]">Black</option>
          </select>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="self-start">
          {loading ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>
    </Card>
  )
}

export default EditProfileForm