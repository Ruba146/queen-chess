const PIECE_CODES = {
  p: 'P',
  n: 'N',
  b: 'B',
  r: 'R',
  q: 'Q',
  k: 'K',
}

const PIECE_TYPES = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

function ChessPiece({ type, color, size, className = '' }) {
  const colorKey = color === 'w' ? 'w' : 'b'
  const code = PIECE_CODES[type]
  if (!code) return null

  const src = `/chesspieces/${colorKey}${code}.png`
  const style = size ? { width: size, height: size } : undefined

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={style}
      className={`inline-block select-none ${className}`}
    />
  )
}

ChessPiece.types = PIECE_TYPES
export default ChessPiece
