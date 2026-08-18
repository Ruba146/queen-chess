import Badge from '../../components/ui/Badge'
import ChessPiece from '../../components/chess/ChessPiece'

function pieceSvg(piece) {
  if (!piece) return ''
  const color = piece.color === 'w' ? 'w' : 'b'
  const type = piece.type
  return (
    <ChessPiece type={type} color={color} className="play-piece-svg" />
  )
}

function ChessBoard({
  board,
  selectedSquare,
  legalTargets,
  onSquareClick,
  status,
  moveCount,
  isAiThinking,
  lastMove,
  helperText,
}) {
  const statusTone = status.over
    ? status.winner === 'draw'
      ? 'neutral'
      : 'success'
    : 'accent'

  const isSelected = (square) => selectedSquare === square
  const isTarget = (square) => legalTargets.includes(square)
  const isLastMove = (square) => lastMove && (square === lastMove.from || square === lastMove.to)

  return (
    <div className="play-board-shell">
      <div className="play-board-status">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={statusTone} dot className="text-[10px]">
            {status.label}
          </Badge>
          <Badge tone="neutral" className="text-[10px]">
            Move {moveCount}
          </Badge>
        </div>
        <Badge tone={status.over ? 'neutral' : 'success'} dot className="text-[10px]">
          {status.over ? 'Finished' : 'Live'}
        </Badge>
      </div>

      <div className="play-board-frame">
        <div className="play-board-grid">
          {board.map((row) =>
            row.map((cell) => {
              const selected = isSelected(cell.square)
              const target = isTarget(cell.square)
              const last = isLastMove(cell.square)
              const hasPiece = Boolean(cell.piece)
              return (
                <button
                  key={cell.square}
                  type="button"
                  onClick={() => onSquareClick(cell.square)}
                  className={`play-square ${cell.light ? 'light' : 'dark'} ${
                    selected ? 'selected' : ''
                  } ${last && !selected ? 'last-move' : ''}`}
                  aria-label={`Square ${cell.square}`}
                >
                  {cell.piece && (
                    <span
                      className={`play-piece ${cell.piece.color === 'w' ? 'white' : 'black'}`}
                      aria-hidden="true"
                    >
                      {pieceSvg(cell.piece)}
                    </span>
                  )}
                  {target && !hasPiece && <span className="play-target-dot" aria-hidden="true" />}
                  {target && hasPiece && <span className="play-target-ring" aria-hidden="true" />}
                </button>
              )
            }),
          )}
        </div>
      </div>
      <p className="play-board-helper">
        {helperText || (isAiThinking ? 'AI thinking...' : 'Select a piece, then a legal square')}
      </p>
    </div>
  )
}

export default ChessBoard
