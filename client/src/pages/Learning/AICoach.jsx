import { useState } from 'react'
import learningApi from './learningApi'
import LearningBadges from './LearningBadges'

const DEFAULT_PROFILE = { rating: 1200, style: 'Balanced', timeControl: '10 min' }

function AICoach() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Configure your profile or use defaults to get a personalized training plan.')
  const [plan, setPlan] = useState(null)

  const generatePlan = async () => {
    setLoading(true)
    setStatus('Claude is building your personalized training plan...')
    setPlan(null)
    try {
      const data = await learningApi.coachPlan(profile)
      setPlan(data)
      setStatus('')
    } catch {
      setPlan(null)
      setStatus('AI training plan is temporarily unavailable. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const renderWeaknesses = (weaknesses) => {
    if (!weaknesses || weaknesses.length === 0) return null
    return (
      <div className="ai-coach-card">
        <h4 className="ai-coach-card-title">Weaknesses</h4>
        <div className="ai-coach-list">
          {weaknesses.map((w, i) => (
            <div key={i} className="ai-coach-list-item">
              <span className="learning-detail-label">{w.skill || w.label || w}</span>
              {w.level !== undefined && (
                <div className="ai-coach-bar">
                  <div className="ai-coach-bar-fill" style={{ width: `${Math.min(100, w.level)}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRecommendations = (recommendations) => {
    if (!recommendations || recommendations.length === 0) return null
    return (
      <div className="ai-coach-card">
        <h4 className="ai-coach-card-title">Recommended Focus</h4>
        <div className="ai-coach-list">
          {recommendations.map((r, i) => (
            <div key={i} className="ai-coach-list-item">
              {r.opening && <span className="learning-detail-label">Opening</span>}
              {r.pattern && <span className="learning-detail-label">Pattern</span>}
              {r.endgame && <span className="learning-detail-label">Endgame</span>}
              <span>{r.title || r.name || r.opening || r.pattern || r.endgame || String(r)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTrainingPlan = (tp) => {
    if (!tp) return null
    return (
      <div className="ai-coach-card">
        <h4 className="ai-coach-card-title">Today's Training</h4>
        <LearningBadges
          badges={[
            `${tp.totalPuzzles || tp.puzzles?.length || 0} puzzles`,
            tp.mode || profile.style,
            tp.difficulty || 'auto',
          ]}
        />
        {tp.goal && <p className="mt-1.5 text-xs qc-text-secondary">{tp.goal}</p>}
        {tp.focus && <p className="mt-1.5 text-xs qc-text-gold">Focus: {tp.focus}</p>}
        {tp.puzzles?.length > 0 && (
          <ul className="mt-1.5 space-y-1 pl-4 text-xs qc-text-secondary">
            {tp.puzzles.map((p, i) => (
              <li key={i}>
                {p.theme || p.topic}: {p.description || p.title || ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const renderMessage = (msg) => {
    if (!msg) return null
    return (
      <div className="ai-coach-card">
        <h4 className="ai-coach-card-title">Coach Message</h4>
        <p className="text-xs qc-text-secondary">{msg}</p>
      </div>
    )
  }

  return (
    <div className="learning-tool-shell">
      <div className="ai-coach-builder">
        <div className="ai-coach-profile">
          <h4 className="text-xs font-semibold qc-text-primary">Your Profile</h4>
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
            Style
            <select
              className="learning-control-select"
              value={profile.style}
              onChange={(e) => setProfile({ ...profile, style: e.target.value })}
            >
              <option>Balanced</option>
              <option>Aggressive</option>
              <option>Positional</option>
              <option>Defensive</option>
            </select>
          </label>
          <label className="learning-form-label">
            Time Control
            <select
              className="learning-control-select"
              value={profile.timeControl}
              onChange={(e) => setProfile({ ...profile, timeControl: e.target.value })}
            >
              <option>5 min</option>
              <option>10 min</option>
              <option>15 min</option>
              <option>30 min</option>
            </select>
          </label>
          <button type="button" className="ai-search-btn" onClick={generatePlan} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>

        <div className="ai-coach-results">
          {status && !loading && <div className="learning-dynamic-status">{status}</div>}
          {plan && (
            <>
              {renderMessage(plan.message || plan.coachNote)}
              {renderTrainingPlan(plan.trainingPlan || plan.plan)}
              {renderWeaknesses(plan.weaknesses || plan.weakSkills)}
              {renderRecommendations(plan.recommendations || plan.recommended)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AICoach

