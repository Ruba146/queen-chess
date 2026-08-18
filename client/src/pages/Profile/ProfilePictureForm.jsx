import { useState } from 'react'
import { Image, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { userApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function ProfilePictureForm({ user, onSaved }) {
  const { restoreSession } = useAuth()
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    setLoading(true)
    try {
      await userApi.updateProfilePicture(profilePicture.trim())
      await restoreSession()
      setSuccess('Profile picture updated successfully.')
      if (onSaved) onSaved()
    } catch (err) {
      setError(err.message || 'Failed to update profile picture.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padded={false}>
      <h3 className="mb-1 text-xs font-bold qc-text-primary">Profile Picture</h3>
      <p className="mb-2.5 text-[10px] qc-text-secondary">Set a profile picture by providing an image URL.</p>

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

        <Input label="Profile Picture URL" placeholder="https://example.com/avatar.png" value={profilePicture} onChange={(e) => setProfilePicture(e.target.value)} icon={Image} />

        <Button type="submit" variant="primary" loading={loading} className="self-start">
          {loading ? 'Saving…' : 'Save Picture'}
        </Button>
      </form>
    </Card>
  )
}

export default ProfilePictureForm