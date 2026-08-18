import { useState } from 'react'
import learningApi from './learningApi'

const DEFAULT_PROFILE = {
  rating: 1200,
  goal: 'Openings',
  timePerWeek: 5,
  style: 'Balanced',
}

function LearningPath() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Set your goals and generate a personalized curriculum.')
  const [path, setPath] = useState(null)

  const generatePath = async () => {
    setLoading(true)
    setStatus('Building your personalized path...')
    setPath(null)
    try {
      const data = await learningApi.learningPath(profile)
      setPath(data)
      setStatus('')
    } catch {
      setPath(null)
      setStatus('Learning path is temporarily unavailable. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const renderModule = (module, i) => {
    if (!module) return null
    return (
      <div key={i} className="learning-path-module">
        <div className="learning-path-module-head">
          <span className="learning-path-module-icon">{module.icon || '📘'}</span>
          <div>
            <h4 className="text-xs font-semibold qc-text-primary">{module.title || module}</h4>
            {module.description && <p className="text-[11px] qc-text-muted">{module.description}</p>}
          </div>
        </div>
        {module.topics?.length > 0 && (
          <div className="learning-badge-row">
            {module.topics.map((t, j) => (
              <span key={j} className="learning-data-badge">{t}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderLevel = (level) => {
    if (!level) return null
    return (
      <div className="learning-path-level">
        <h4 className="text-xs font-semibold qc-text-primary">{level.title || level.name}</h4>
        {level.description && <p className="text-[11px] qc-text-secondary">{level.description}</p>}
        {level.modules?.length > 0 && (
          <div className="learning-path-modules">
            {level.modules.map(renderModule)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="learning-tool-shell">
      <div className="ai-coach-builder">
        <div className="ai-coach-profile">
          <h4 className="text-xs font-semibold qc-text-primary">Your Learning Goals</h4>
          <label className="learning-form-label">
            Rating
            <input
              className="learning-control-input"
              type="number"
              value={profile.rating}
              onChange={(e) => setProfile({ ...profile, rating: Number(e.target.value) })}
            />
          </label>
          <label className="learning-form-label">
            Goal
            <select
              className="learning-control-select"
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
            >
              <option>Openings</option>
              <option>Tactics</option>
              <option>Endgames</option>
              <option>Strategy</option>
              <option>All Around</option>
            </select>
          </label>
          <label className="learning-form-label">
            Hours / Week
            <select
              className="learning-control-select"
              value={profile.timePerWeek}
              onChange={(e) => setProfile({ ...profile, timePerWeek: Number(e.target.value) })}
            >
              <option value={2}>2</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </label>
          <label className="learning-form-label">
            Style
            <select
              className="learning-control-select"
              value={profile.style}
              onChange={(e) => setProfile({ ...profile, style: e.target.value })}
            >
              <option>Balanced</option>
              <option>Aggressive</option>
              <option>Positional</option>
            </select>
          </label>
          <button type="button" className="ai-search-btn" onClick={generatePath} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Path'}
          </button>
        </div>

        <div className="ai-coach-results">
          {status && !path && <div className="learning-dynamic-status">{status}</div>}
          {path && (
            <div className="learning-path-container">
              <h4 className="text-sm font-bold qc-text-primary">
                {path.title || 'Your Personalized Learning Path'}
              </h4>
              {path.description && <p className="text-[11px] qc-text-muted">{path.description}</p>}
              {path.levels?.length > 0 && (
                <div className="mt-2 space-y-2">{path.levels.map(renderLevel)}</div>
              )}
              {path.modules?.length > 0 && (
                <div className="learning-path-modules mt-2">{path.modules.map(renderModule)}</div>
              )}
              {!path.levels && !path.modules && (
                <div className="learning-dynamic-status">No curriculum available yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LearningPath
