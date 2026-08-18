import { useCallback } from 'react'
import PageContainer from '../../components/ui/PageContainer'
import SectionTitle from '../../components/ui/SectionTitle'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import { useApi } from '../../hooks/useApi'
import { userApi } from '../../services/api'
import ProfileHero from './ProfileHero'
import ProfileStats from './ProfileStats'
import RatingProgress from './RatingProgress'
import Achievements from './Achievements'
import Activity from './Activity'
import AIProfile from './AIProfile'
import EditProfileForm from './EditProfileForm'
import ChangePasswordForm from './ChangePasswordForm'
import ProfilePictureForm from './ProfilePictureForm'

function Profile() {
  const profileQuery = useApi(
    useCallback(() => userApi.me().then((res) => res.data), []),
  )
  const statsQuery = useApi(
    useCallback(() => userApi.getExtendedStats('rapid').then((res) => res.data), []),
  )

  const loading = profileQuery.loading || statsQuery.loading
  const error = profileQuery.error || statsQuery.error

  const handleSaved = () => {
    profileQuery.refetch()
    statsQuery.refetch()
  }

  if (loading) {
    return (
      <PageContainer maxWidth="max-w-7xl">
        <div className="qc-page-profile">
          <LoadingState label="Loading profile…" />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer maxWidth="max-w-7xl">
        <div className="qc-page-profile">
          <ErrorState
            message={error.message || 'Failed to load profile.'}
            onRetry={() => {
              profileQuery.refetch()
              statsQuery.refetch()
            }}
          />
        </div>
      </PageContainer>
    )
  }

  const user = profileQuery.data
  const stats = statsQuery.data

  return (
    <PageContainer maxWidth="max-w-7xl">
      <div className="qc-page-profile">
        <ProfileHero user={user} stats={stats} onEditProfile={handleSaved} />
        <ProfileStats stats={stats} />
        <RatingProgress />
        <Achievements />
        <Activity />
        <AIProfile />
        <section className="qc-section">
          <SectionTitle eyebrow="Account" title="Manage your account" className="qc-section-head mb-3" />
          <div className="grid gap-2.5 lg:grid-cols-2">
            <EditProfileForm user={user} onSaved={handleSaved} />
            <ProfilePictureForm user={user} onSaved={handleSaved} />
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

export default Profile
