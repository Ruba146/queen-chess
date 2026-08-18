import { useState } from 'react'

function AIExplanation({ explanation = {}, type = 'generic' }) {
  const [level, setLevel] = useState('beginner')

  if (!explanation || Object.keys(explanation).length === 0) {
    return <div className="learning-dynamic-status">No explanation available.</div>
  }

  const main =
    explanation.explanation ||
    explanation.mainIdea ||
    explanation.summary ||
    ''

  const levelText =
    level === 'beginner'
      ? explanation.beginnerExplanation
      : level === 'intermediate'
        ? explanation.intermediateExplanation
        : explanation.advancedExplanation

  const sections = []

  if (explanation.mainIdea && type !== 'generic') {
    sections.push({ label: 'Main Idea', content: explanation.mainIdea })
  }
  if (type === 'endgame') {
    if (explanation.position) sections.push({ label: 'Position', content: explanation.position })
    if (explanation.objective) sections.push({ label: 'Objective', content: explanation.objective })
    if (explanation.winningMethod) sections.push({ label: 'Winning Method', content: explanation.winningMethod })
    if (explanation.keyIdeas?.length) sections.push({ label: 'Key Ideas', list: explanation.keyIdeas })
  }
  if (explanation.strategicConcepts?.length) {
    sections.push({ label: 'Strategic Concepts', list: explanation.strategicConcepts })
  }
  if (explanation.tacticalThemes?.length) {
    sections.push({ label: 'Tactical Themes', list: explanation.tacticalThemes })
  }
  if (explanation.commonMistakes?.length) {
    sections.push({ label: 'Common Mistakes', list: explanation.commonMistakes })
  }
  if (explanation.practicalAdvice) {
    sections.push({ label: 'Practical Advice', content: explanation.practicalAdvice })
  }
  if (explanation.trainingRecommendations?.length) {
    sections.push({ label: 'Training Recommendations', list: explanation.trainingRecommendations })
  }

  return (
    <div className="ai-explanation-panel">
      <div className="ai-level-tabs">
        {['beginner', 'intermediate', 'advanced'].map((lvl) => (
          <button
            key={lvl}
            type="button"
            className={`ai-level-tab ${level === lvl ? 'active' : ''}`}
            onClick={() => setLevel(lvl)}
          >
            {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
          </button>
        ))}
      </div>

      {levelText && (
        <div className="ai-level-content">{levelText}</div>
      )}

      {main && <div className="ai-explanation-main">{main}</div>}

      {sections.map((section, i) => (
        <div key={i} className="ai-explanation-section">
          <span className="learning-detail-label">{section.label}</span>
          {section.content ? (
            <p className="text-xs qc-text-secondary">{section.content}</p>
          ) : (
            <ul className="space-y-1 pl-4">
              {section.list.map((item, j) => (
                <li key={j} className="text-xs qc-text-secondary">{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

export default AIExplanation
