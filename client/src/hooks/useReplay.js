import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'

const RANK_NAMES = ['8', '7', '6', '5', '4', '3', '2', '1']
const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function buildBoard(chess) {
  const board = []
  for (let row = 0; row < 8; row += 1) {
    const rankRow = []
    for (let col = 0; col < 8; col += 1) {
      const square = FILE_NAMES[col] + RANK_NAMES[row]
      const piece = chess.get(square)
      rankRow.push({ square, piece, light: (row + col) % 2 === 0 })
    }
    board.push(rankRow)
  }
  return board
}

export function useReplay(moves = []) {
  const chessRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [board, setBoard] = useState(null)
  const [fen, setFen] = useState(null)
  const [playing, setPlaying] = useState(false)

  if (chessRef.current == null) {
    chessRef.current = new Chess()
  }

  const totalMoves = moves.length

  const apply = useCallback(
    (targetIndex) => {
      const chess = new Chess()
      for (let i = 0; i < targetIndex; i++) {
        try {
          chess.move(moves[i])
        } catch {
          // skip invalid moves
        }
      }
      chessRef.current = chess
      setBoard(buildBoard(chess))
      setFen(chess.fen())
      setIndex(targetIndex)
    },
    [moves],
  )

  // Reset replay whenever the move list changes (new game selected).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaying(false)
    apply(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves])

  const goFirst = useCallback(() => apply(0), [apply])
  const goPrev = useCallback(
    () => apply(Math.max(0, index - 1)),
    [apply, index],
  )
  const goNext = useCallback(
    () => apply(Math.min(totalMoves, index + 1)),
    [apply, totalMoves, index],
  )
  const goLast = useCallback(() => apply(totalMoves), [apply, totalMoves])
  const togglePlay = useCallback(() => setPlaying((p) => !p), [])

  // Autoplay: advance one move every 900ms.
  useEffect(() => {
    if (!playing) return
    if (index >= totalMoves) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => {
      apply(Math.min(totalMoves, index + 1))
    }, 900)
    return () => clearTimeout(timer)
  }, [playing, index, totalMoves, apply])

  return {
    board,
    fen,
    index,
    totalMoves,
    playing,
    goFirst,
    goPrev,
    goNext,
    goLast,
    togglePlay,
  }
}

export default useReplay
