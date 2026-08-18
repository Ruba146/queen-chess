import { useState } from 'react'
import { Bot, Lightbulb, AlertTriangle, Zap, ChevronDown, ChevronRight, Activity, Target, Shield, BookOpen } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-md qc-border qc-bg-elevated overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:qc-bg-card"
      >
        {Icon && <Icon className="h-3.5 w-3.5 qc-text-gold" aria-hidden="true" />}
        <span className="text-[10px] font-bold uppercase tracking-wider qc-text-secondary flex-1">
          {title}
        </span>
        {open ? <ChevronDown className="h-3 w-3 qc-text-muted" /> : <ChevronRight className="h-3 w-3 qc-text-muted" />}
      </button>
      {open && <div className="px-2.5 pb-2.5">{children}</div>}
    </div>
  )
}

function QualityBadge({ quality }) {
  const toneMap = {
    Brilliant: 'accent',
    Great: 'accent',
    Best: 'success',
    Excellent: 'success',
    Good: 'primary',
    Inaccuracy: 'warning',
    Mistake: 'warning',
    Blunder: 'danger',
  }
  const tone = toneMap[quality] || 'neutral'
  return <Badge tone={tone} size="sm" className="text-[9px] px-1.5 py-0.5">{quality || '—'}</Badge>
}

function Assistant({
  moveCount,
  pgn,
  isAiThinking,
  moveAnalysis,
  bestMove,
  tactics,
  opponentThreats,
  coachSections,
  liveEval,
  livePositionAnalysis,
  analysisBusy,
}) {
  const lastAnalysis = moveAnalysis.length > 0 ? moveAnalysis[moveAnalysis.length - 1] : null
  const stats = (() => {
    if (!moveAnalysis || moveAnalysis.length === 0) {
      return { accuracy: 0, avgCpl: 0, bestMoves: 0, brilliantMoves: 0, mistakes: 0, blunders: 0, inaccuracies: 0 }
    }
    let totalLoss = 0
    let bestMoves = 0
    let brilliantMoves = 0
    let mistakes = 0
    let blunders = 0
    let inaccuracies = 0
    for (const m of moveAnalysis) {
      totalLoss += m.loss
      if (m.classification === 'Best') bestMoves++
      if (m.classification === 'Brilliant') brilliantMoves++
      if (m.classification === 'Mistake') mistakes++
      if (m.classification === 'Blunder') blunders++
      if (m.classification === 'Inaccuracy') inaccuracies++
    }
    const avgCpl = Math.round(totalLoss / moveAnalysis.length)
    const accuracy = Math.max(0, Math.min(100, Math.round(100 - avgCpl / 2)))
    return { accuracy, avgCpl, bestMoves, brilliantMoves, mistakes, blunders, inaccuracies }
  })()

  const positionEval = livePositionAnalysis?.positionEval || {}

  return (
    <Card className="flex flex-col gap-2 p-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md qc-bg-accent-soft">
          <Bot className="h-3.5 w-3.5 qc-text-gold" aria-hidden="true" />
        </div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider qc-text-secondary">
          AI Assistant
        </h3>
      </div>

      <Section title="Evaluation" icon={Activity} defaultOpen={true}>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-bold qc-text-primary">
            {analysisBusy ? '…' : liveEval || '0.0'}
          </span>
          <span className="text-[10px] qc-text-muted">
            {isAiThinking ? 'Analyzing position...' : moveCount === 0 ? 'Start the game' : 'Stockfish evaluation'}
          </span>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed qc-text-muted">
          {positionEval.materialBalance !== undefined && positionEval.materialBalance !== 0
            ? `Material: ${positionEval.materialBalance > 0 ? 'White +' : 'Black +'}${Math.abs(positionEval.materialBalance / 100).toFixed(1)} pawns. `
            : ''}
          {positionEval.whiteShield !== undefined && `King shield: ${positionEval.whiteShield >= 2 ? 'Good' : positionEval.whiteShield === 1 ? 'Partial' : 'Weak'}. `}
          {positionEval.whiteDevelopment !== undefined && `Development: ${positionEval.whiteDevelopment >= 30 ? 'Good' : positionEval.whiteDevelopment >= 15 ? 'Progressing' : 'Behind'}.`}
        </p>
      </Section>

      {lastAnalysis && (
        <Section title="Move Quality" icon={Target} defaultOpen={true}>
          <div className="flex items-center gap-2">
            <QualityBadge quality={lastAnalysis.quality?.classification} />
            <span className="text-[10px] qc-text-muted">
              {lastAnalysis.quality?.loss || 0} CPL loss
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed qc-text-muted">
            {lastAnalysis.quality?.classification === 'Best'
              ? 'You found the best move. Excellent calculation.'
              : lastAnalysis.quality?.classification === 'Brilliant'
                ? 'Brilliant move! A strong tactical or sacrificial idea.'
                : lastAnalysis.quality?.classification === 'Blunder'
                  ? 'Significant evaluation loss. Review the position carefully before moving.'
                  : lastAnalysis.quality?.classification === 'Mistake'
                    ? 'The move loses significant evaluation. A better alternative existed.'
                    : 'Decent move, but a stronger option was available.'}
          </p>
          {bestMove && (
            <div className="mt-1.5 rounded qc-border qc-bg-card p-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider qc-text-gold">Best move: </span>
              <span className="font-mono text-xs font-bold qc-text-primary">{bestMove}</span>
            </div>
          )}
        </Section>
      )}

      <Section title="Best Move" icon={Lightbulb} defaultOpen={true}>
        <p className="font-mono text-sm font-bold qc-text-gold">
          {isAiThinking ? '…' : bestMove || '—'}
        </p>
        <p className="mt-0.5 text-[9px] qc-text-muted">
          {isAiThinking ? 'Stockfish is computing…' : bestMove ? 'Suggested by Stockfish' : 'Click Hint for the engine move.'}
        </p>
      </Section>

      {opponentThreats.length > 0 && (
        <Section title="Opponent Threat" icon={AlertTriangle} defaultOpen={true}>
          {opponentThreats.slice(0, 2).map((threat, i) => (
            <p key={i} className="text-[10px] qc-text-error">{threat.message}</p>
          ))}
        </Section>
      )}

      {tactics.length > 0 && (
        <Section title="Tactics" icon={Zap} defaultOpen={false}>
          {tactics.slice(0, 3).map((tactic, i) => (
            <div key={i} className="text-[10px] qc-text-secondary">
              <Badge tone="accent" size="sm" className="text-[9px] px-1 py-0.5 mr-1">{tactic.type}</Badge>
              {tactic.attacker && `Attacker: ${tactic.attacker}`}
              {tactic.targets && ` Targets: ${tactic.targets.map(t => t.square).join(', ')}`}
            </div>
          ))}
        </Section>
      )}

      <Section title="Coach" icon={Bot} defaultOpen={true}>
        {coachSections.length === 0 && !analysisBusy && (
          <p className="text-[10px] qc-text-muted">Position analysis will appear here after your move.</p>
        )}
        {coachSections.map((section, i) => (
          <div key={i} className="mb-2 last:mb-0">
            <p className="text-[10px] font-bold uppercase tracking-wider qc-text-gold mb-0.5">{section.title}</p>
            <p className="text-[10px] leading-relaxed qc-text-secondary whitespace-pre-line">{section.content}</p>
          </div>
        ))}
      </Section>

      <Section title="Position" icon={Shield} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1">
          <div className="rounded qc-border qc-bg-card p-1.5">
            <p className="text-[9px] qc-text-muted">Material</p>
            <p className="text-[10px] font-semibold qc-text-primary">
              {positionEval.materialBalance !== undefined
                ? (positionEval.materialBalance === 0 ? 'Equal' : positionEval.materialBalance > 0 ? 'White +' : 'Black +')
                : '—'}
            </p>
          </div>
          <div className="rounded qc-border qc-bg-card p-1.5">
            <p className="text-[9px] qc-text-muted">King Safety</p>
            <p className="text-[10px] font-semibold qc-text-primary">
              {positionEval.whiteShield !== undefined ? (positionEval.whiteShield >= 2 ? 'Good' : positionEval.whiteShield === 1 ? 'Partial' : 'Weak') : '—'}
            </p>
          </div>
          <div className="rounded qc-border qc-bg-card p-1.5">
            <p className="text-[9px] qc-text-muted">Development</p>
            <p className="text-[10px] font-semibold qc-text-primary">
              {positionEval.whiteDevelopment !== undefined ? (positionEval.whiteDevelopment >= 30 ? 'Good' : positionEval.whiteDevelopment >= 15 ? 'Progressing' : 'Behind') : '—'}
            </p>
          </div>
          <div className="rounded qc-border qc-bg-card p-1.5">
            <p className="text-[9px] qc-text-muted">Center</p>
            <p className="text-[10px] font-semibold qc-text-primary">
              {positionEval.whiteCenter !== undefined ? (positionEval.whiteCenter >= 30 ? 'Strong' : positionEval.whiteCenter >= 10 ? 'Moderate' : 'Weak') : '—'}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Live Performance" icon={Activity} defaultOpen={false}>
        <div className="grid grid-cols-3 gap-1">
          <div className="rounded qc-border qc-bg-card p-1.5 text-center">
            <p className="text-xs font-bold qc-text-success">{stats.accuracy}%</p>
            <p className="text-[9px] qc-text-muted">Accuracy</p>
          </div>
          <div className="rounded qc-border qc-border-weak qc-bg-card p-1.5 text-center">
            <p className="text-xs font-bold qc-text-primary">{stats.avgCpl}</p>
            <p className="text-[9px] qc-text-muted">Avg CPL</p>
          </div>
          <div className="rounded qc-border qc-border-weak qc-bg-card p-1.5 text-center">
            <p className="text-xs font-bold qc-text-gold">{stats.bestMoves}</p>
            <p className="text-[9px] qc-text-muted">Best</p>
          </div>
          <div className="rounded qc-border qc-border-weak qc-bg-card p-1.5 text-center">
            <p className="text-xs font-bold qc-text-success">{stats.brilliantMoves}</p>
            <p className="text-[9px] qc-text-muted">Brilliant</p>
          </div>
          <div className="rounded qc-border qc-border-weak qc-bg-card p-1.5 text-center">
            <p className="text-xs font-bold qc-text-warning">{stats.mistakes}</p>
            <p className="text-[9px] qc-text-muted">Mistakes</p>
          </div>
          <div className="rounded qc-border qc-border-weak qc-bg-card p-1.5 text-center">
            <p className="text-xs font-bold qc-text-error">{stats.blunders}</p>
            <p className="text-[9px] qc-text-muted">Blunders</p>
          </div>
        </div>
      </Section>

      <Section title="Opening" icon={BookOpen} defaultOpen={false}>
        <p className="text-[10px] qc-text-secondary">{pgn ? pgn.split(/\s+/).filter((t) => !/^\d+\.$|^\.\.|^[WB]$/.test(t)).slice(0, 3).join(' ') || '—' : '—'}</p>
        <p className="text-[9px] qc-text-muted">From your move order</p>
      </Section>
    </Card>
  )
}

export default Assistant
