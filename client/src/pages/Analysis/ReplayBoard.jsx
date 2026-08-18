import { useMemo } from 'react'
import {
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Play,
  Pause,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/ui/Button'
import ChessPiece from '../../components/chess/ChessPiece'

function ReplayBoard({ replay, moves = [], analysis = [], game }) {
  const { board, index, totalMoves, playing, goFirst, goPrev, goNext, goLast, togglePlay } =
    replay

  const moveEntries = useMemo(() => {
    const entries = []
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1
      const whiteMove = moves[i] || null
      const blackMove = moves[i + 1] || null
      const whiteAnalysis = analysis[i] || null
      const blackAnalysis = analysis[i + 1] || null
      entries.push({ moveNum, whiteMove, blackMove, whiteAnalysis, blackAnalysis })
    }
    return entries
  }, [moves, analysis])

  const currentMoveIndex = Math.ceil(index / 2)

  return (
    <Card className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold qc-text-primary">Game Replay</h3>
          <p className="text-[10px] qc-text-muted mt-0.5">
            {game?.opening || 'Review your saved game'}
          </p>
        </div>
        <Badge tone="neutral">
          Move {index} / {totalMoves}
        </Badge>
      </div>

      {totalMoves === 0 || !board ? (
        <EmptyState
          title="No moves to replay"
          description="This game has no recorded moves."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="relative mx-auto aspect-square w-full max-w-[400px] overflow-hidden rounded-lg qc-border qc-bg-card">
              <div className="grid h-full w-full grid-cols-8 grid-rows-8">
                {board.map((row) =>
                  row.map((cell) => (
                    <div
                      key={cell.square}
                      className={`relative flex items-center justify-center text-sm sm:text-base ${
                        cell.light ? 'qc-bg-board-light' : 'qc-bg-board-dark'
                      }`}
                      aria-label={`Square ${cell.square}`}
                    >
                      {cell.piece && (
                        <ChessPiece
                          type={cell.piece.type}
                          color={cell.piece.color}
                          size="100%"
                        />
                      )}
                    </div>
                  )),
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold qc-text-primary uppercase tracking-wider">
                Moves
              </h4>
              <div className="flex-1 max-h-[320px] overflow-y-auto pr-1.5 scrollbar-thin">
                <div className="space-y-0.5">
                  {moveEntries.map((entry) => {
                    const isActive = entry.moveNum <= currentMoveIndex
                    const isCurrent = entry.moveNum === currentMoveIndex
                    return (
                      <div
                        key={entry.moveNum}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                          isCurrent
                            ? 'qc-bg-accent-soft qc-text-primary'
                            : isActive
                              ? 'qc-bg-accent-soft/40 qc-text-secondary'
                              : 'qc-text-muted'
                        }`}
                      >
                        <span className="w-6 shrink-0 font-mono text-[10px]">{entry.moveNum}.</span>
                        <span className={`flex-1 font-mono ${isCurrent ? 'font-bold' : ''}`}>{entry.whiteMove || ''}</span>
                        {entry.whiteAnalysis && isActive && (
                          <Badge
                            tone={
                              entry.whiteAnalysis.classification === 'Best' ? 'success'
                              : entry.whiteAnalysis.classification === 'Excellent' ? 'accent'
                              : entry.whiteAnalysis.classification === 'Good' ? 'primary'
                              : entry.whiteAnalysis.classification === 'Inaccuracy' ? 'warning'
                              : entry.whiteAnalysis.classification === 'Mistake' ? 'warning'
                              : entry.whiteAnalysis.classification === 'Blunder' ? 'danger'
                              : 'neutral'
                            }
                            size="xs"
                          >
                            {entry.whiteAnalysis.classification}
                          </Badge>
                        )}
                        <span className={`flex-1 font-mono text-right ${isCurrent ? 'font-bold' : ''}`}>{entry.blackMove || ''}</span>
                        {entry.blackAnalysis && isActive && (
                          <Badge
                            tone={
                              entry.blackAnalysis.classification === 'Best' ? 'success'
                              : entry.blackAnalysis.classification === 'Excellent' ? 'accent'
                              : entry.blackAnalysis.classification === 'Good' ? 'primary'
                              : entry.blackAnalysis.classification === 'Inaccuracy' ? 'warning'
                              : entry.blackAnalysis.classification === 'Mistake' ? 'warning'
                              : entry.blackAnalysis.classification === 'Blunder' ? 'danger'
                              : 'neutral'
                            }
                            size="xs"
                          >
                            {entry.blackAnalysis.classification}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-[var(--qc-border)]">
            <Button variant="secondary" size="sm" onClick={goFirst} leftIcon={SkipBack}>
              First
            </Button>
            <Button variant="secondary" size="sm" onClick={goPrev} leftIcon={ChevronLeft}>
              Prev
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={togglePlay}
              leftIcon={playing ? Pause : Play}
            >
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button variant="secondary" size="sm" onClick={goNext} rightIcon={ChevronRight}>
              Next
            </Button>
            <Button variant="secondary" size="sm" onClick={goLast} rightIcon={SkipForward}>
              Last
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

export default ReplayBoard
