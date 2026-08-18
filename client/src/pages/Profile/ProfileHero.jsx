import { Crown, Settings, Mail, Calendar } from 'lucide-react'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

function formatDate(value) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  })
}

function ProfileHero({ user, stats, onEditProfile }) {
  const displayName = user?.displayName || user?.username || 'Player'
  const email = user?.email || ''
  const joined = formatDate(user?.createdAt)
  const rating = stats?.rating ?? user?.ratings?.rapid ?? 1200
  const rank = stats?.rank || 'Beginner'
  const level = user?.level || 1
  const xp = user?.xp || 0

  return (
    <Card className="qc-profile-hero p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            name={displayName}
            src={user?.profilePicture || undefined}
            size="lg"
            status="online"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="qc-profile-hero-name text-lg sm:text-xl">{displayName}</h1>
              <Badge tone="warning" size="sm" icon={Crown}>Premium</Badge>
            </div>
            <p className="qc-profile-hero-meta text-xs">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" aria-hidden="true" />
                {email}
              </span>
            </p>
            <p className="qc-profile-hero-meta text-xs mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                Member since {joined}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge tone="accent" size="sm">Rating {rating.toLocaleString()}</Badge>
              <Badge tone="neutral" size="sm">Rank {rank}</Badge>
              <Badge tone="primary" size="sm">Level {level}</Badge>
              <Badge tone="gold" size="sm">{xp.toLocaleString()} XP</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" leftIcon={Settings} onClick={onEditProfile}>
            Edit Profile
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ProfileHero
