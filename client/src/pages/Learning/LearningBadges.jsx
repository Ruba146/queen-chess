function LearningBadges({ badges = [] }) {
  if (!badges || badges.length === 0) return null
  return (
    <div className="learning-badge-row">
      {badges.map((badge, i) => (
        <span key={i} className="learning-data-badge">
          {badge}
        </span>
      ))}
    </div>
  )
}

export default LearningBadges
