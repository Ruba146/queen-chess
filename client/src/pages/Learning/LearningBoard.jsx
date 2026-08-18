/* eslint-disable react-refresh/only-export-components */
import { Chess } from 'chess.js'
import ChessPiece from '../../components/chess/ChessPiece'

const RANK_NAMES = ['8', '7', '6', '5', '4', '3', '2', '1']
const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function safeChess(fen) {
  const candidate = (fen && fen !== 'start' && fen !== 'Start Position') ? fen : DEFAULT_FEN
  try {
    return new Chess(candidate)
  } catch {
    return new Chess(DEFAULT_FEN)
  }
}

export function buildBoardFromFen(fen, flipped = false) {
  const chess = safeChess(fen)
  const board = []
  for (let row = 0; row < 8; row += 1) {
    const rankRow = []
    for (let col = 0; col < 8; col += 1) {
      const fileIdx = flipped ? 7 - col : col
      const rankIdx = flipped ? 7 - row : row
      const square = FILE_NAMES[fileIdx] + RANK_NAMES[rankIdx]
      rankRow.push({
        square,
        piece: chess.get(square),
        light: (row + col) % 2 === 0,
      })
    }
    board.push(rankRow)
  }
  return board
}

function LearningBoard({
  fen,
  interactive = false,
  onSquareClick = () => {},
  lastMove = null,
  highlight = null,
  selectedSquare = null,
  legalTargets = [],
  flipped = false,
  className = '',
}) {
  const board = buildBoardFromFen(fen, flipped)

  return (
    <div className={`learning-board-panel ${className}`}>
      <div className="learning-live-board grid grid-cols-8 grid-rows-8 h-full w-full">
        {board.map((row) =>
          row.map((cell) => {
            const isLast =
              lastMove && (cell.square === lastMove.from || cell.square === lastMove.to)
            const isHighlight = highlight === cell.square
            const isSelected = selectedSquare === cell.square
            const isLegalTarget = legalTargets.includes(cell.square)
            return (
              <button
                key={cell.square}
                type="button"
                disabled={!interactive}
                onClick={() => interactive && onSquareClick(cell.square)}
                className={`learning-board-cell ${cell.light ? 'light' : 'dark'} ${
                  isLast ? 'learning-last-move' : ''
                } ${isHighlight ? 'learning-hint-square' : ''} ${
                  isSelected ? 'learning-selected-square' : ''
                } ${isLegalTarget ? 'learning-legal-target' : ''}`}
                aria-label={cell.square}
              >
                {cell.piece && (
                  <ChessPiece
                    type={cell.piece.type}
                    color={cell.piece.color}
                    size="100%"
                  />
                )}
                {isLegalTarget && !cell.piece && (
                  <span className="learning-legal-dot" aria-hidden="true" />
                )}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}

export default LearningBoard
