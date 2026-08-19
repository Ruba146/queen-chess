import { getEvaluation, getBestMove } from './stockfish'
import { Chess } from 'chess.js'

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
const RANK_NAMES = ['8', '7', '6', '5', '4', '3', '2', '1']
const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function buildBoard(chess) {
  const board = []
  for (let row = 0; row < 8; row += 1) {
    const rankRow = []
    for (let col = 0; col < 8; col += 1) {
      const square = FILE_NAMES[col] + RANK_NAMES[row]
      const piece = chess.get(square)
      rankRow.push({ square, piece })
    }
    board.push(rankRow)
  }
  return board
}

function getKingSquare(chess, color) {
  const fen = chess.fen()
  const board = fen.split(' ')[0]
  const rows = board.split('/')
  const kingChar = color === 'w' ? 'K' : 'k'
  for (let rank = 0; rank < 8; rank++) {
    let file = 0
    for (const char of rows[rank]) {
      if (char >= '1' && char <= '8') {
        file += parseInt(char, 10)
        continue
      }
      if (char === kingChar) {
        return String.fromCharCode(97 + file) + (8 - rank)
      }
      file++
    }
  }
  return null
}

function pawnShieldScore(chess, color) {
  const king = getKingSquare(chess, color)
  if (!king) return 0
  const file = FILE_NAMES.indexOf(king[0])
  const rank = parseInt(king[1], 10)
  const dir = color === 'w' ? -1 : 1
  let shield = 0
  for (let df = -1; df <= 1; df++) {
    const f = file + df
    if (f < 0 || f > 7) continue
    const r = rank + dir
    if (r < 1 || r > 8) continue
    const sq = FILE_NAMES[f] + RANK_NAMES[8 - r]
    const p = chess.get(sq)
    if (p && p.type === 'p' && p.color === color) shield++
  }
  return shield
}

function centerControlScore(chess, color) {
  const center = ['d4', 'd5', 'e4', 'e5']
  const board = buildBoard(chess)
  let score = 0
  for (const row of board) {
    for (const cell of row) {
      if (!cell.piece || cell.piece.color !== color) continue
      if (center.includes(cell.square)) score += 15
    }
  }
  return score
}

function developmentScore(chess, color) {
  const board = buildBoard(chess)
  let score = 0
  for (const row of board) {
    for (const cell of row) {
      if (!cell.piece || cell.piece.color !== color) continue
      const type = cell.piece.type
      if (type === 'p' || type === 'k') continue
      const rank = parseInt(cell.square[1], 10)
      const onStartingRank = color === 'w' ? rank <= 2 : rank >= 7
      if (!onStartingRank) score += 10
    }
  }
  return score
}

function countMaterial(chess, color) {
  const board = buildBoard(chess)
  let total = 0
  for (const row of board) {
    for (const cell of row) {
      if (!cell.piece || cell.piece.color !== color) continue
      total += PIECE_VALUES[cell.piece.type] || 0
    }
  }
  return total
}

function pieceActivityScore(chess, color) {
  const tmp = new Chess(chess.fen())
  tmp.turn = color
  return tmp.moves({ verbose: true }).length
}

function materialBalance(chess) {
  return countMaterial(chess, 'w') - countMaterial(chess, 'b')
}

function evaluatePosition(chess) {
  const wMat = countMaterial(chess, 'w')
  const bMat = countMaterial(chess, 'b')
  const balance = wMat - bMat
  const wShield = pawnShieldScore(chess, 'w')
  const bShield = pawnShieldScore(chess, 'b')
  const wCenter = centerControlScore(chess, 'w')
  const bCenter = centerControlScore(chess, 'b')
  const wDev = developmentScore(chess, 'w')
  const bDev = developmentScore(chess, 'b')
  const wActivity = pieceActivityScore(chess, 'w')
  const bActivity = pieceActivityScore(chess, 'b')

  return {
    materialBalance: balance,
    whiteScore: balance + wShield * 8 + wCenter * 3 + wDev * 5 + wActivity * 2,
    blackScore: -balance + bShield * 8 + bCenter * 3 + bDev * 5 + bActivity * 2,
    evaluation: ((balance + wShield * 8 + wCenter * 3 + wDev * 5 + wActivity * 2) - (-balance + bShield * 8 + bCenter * 3 + bDev * 5 + bActivity * 2)) / 100,
    whiteKing: getKingSquare(chess, 'w'),
    blackKing: getKingSquare(chess, 'b'),
    whiteShield: wShield,
    blackShield: bShield,
    whiteCenter: wCenter,
    blackCenter: bCenter,
    whiteDevelopment: wDev,
    blackDevelopment: bDev,
    whiteActivity: wActivity,
    blackActivity: bActivity,
  }
}

function formatEvalText(cp) {
  if (cp == null) return '0.0'
  return (cp / 100).toFixed(1)
}

function classifyMoveFromLoss(loss) {
  if (loss <= 10) return 'Best'
  if (loss <= 30) return 'Great'
  if (loss <= 60) return 'Excellent'
  if (loss <= 100) return 'Good'
  if (loss <= 250) return 'Inaccuracy'
  if (loss <= 500) return 'Mistake'
  return 'Blunder'
}

function isBrilliantMove(move, loss) {
  if (loss > 30) return false
  if (!move) return false
  const isCapture = move.includes('x')
  const isPromotion = move.includes('=')
  if (isCapture && loss <= 10) return true
  if (isPromotion) return true
  return false
}

function evaluateMoveQuality(move, evalBeforeCp, evalAfterCp) {
  const loss = Math.abs(evalBeforeCp - evalAfterCp)
  const classification = classifyMoveFromLoss(loss)
  const brilliant = isBrilliantMove(move.san, loss)
  return {
    loss: Math.round(loss),
    classification: brilliant ? 'Brilliant' : classification,
    evalBefore: Math.round(evalBeforeCp),
    evalAfter: Math.round(evalAfterCp),
    isBrilliant: brilliant,
  }
}

export async function analyzeCurrentPosition(chess, options = {}) {
  const { depth = 12, movetime = 300 } = options
  const [bestMoveResult, evalResult] = await Promise.all([
    getBestMove(chess.fen(), { skill: options.skill ?? 5, depth, movetime }),
    getEvaluation(chess.fen(), { skill: options.skill ?? 5, depth, movetime }),
  ])

  const positionEval = evaluatePosition(chess)
  const cp = evalResult?.score?.cp ?? 0
  const mate = evalResult?.score?.mate ?? null
  const engineEval = mate != null ? `M${mate}` : formatEvalText(cp)
  const pv = evalResult?.pv || []

  let bestMoveUci = null
  let bestMoveSan = null
  if (bestMoveResult && bestMoveResult.length >= 4) {
    bestMoveUci = bestMoveResult
    try {
      const m = chess.move({ from: bestMoveResult.slice(0, 2), to: bestMoveResult.slice(2, 4), promotion: 'q' })
      bestMoveSan = m ? m.san : null
      chess.undo()
    } catch {
      bestMoveSan = bestMoveResult
    }
  }

  return {
    fen: chess.fen(),
    engineEval,
    stockfishEval: evalResult,
    mate,
    cp,
    bestMove: bestMoveUci,
    bestMoveSan,
    pv,
    depth: evalResult?.depth ?? depth,
    positionEval,
  }
}

export async function analyzePlayerMove(chessBefore, playerMoveUci, playerColor, options = {}) {
  const chess = new Chess(chessBefore.fen())

  let moveObj
  try {
    moveObj = chess.move({ from: playerMoveUci.slice(0, 2), to: playerMoveUci.slice(2, 4), promotion: 'q' })
  } catch {
    return null
  }
  if (!moveObj) return null

  const [evalBefore, evalAfter] = await Promise.all([
    getEvaluation(chessBefore.fen(), { skill: options.skill ?? 5, depth: options.depth ?? 12, movetime: options.movetime ?? 300 }),
    getEvaluation(chess.fen(), { skill: options.skill ?? 5, depth: options.depth ?? 12, movetime: options.movetime ?? 300 }),
  ])

  const evalBeforeCp = evalBefore?.score?.mate != null ? (evalBefore.score.mate > 0 ? 10000 : -10000) : (evalBefore?.score?.cp ?? 0)
  const evalAfterCp = evalAfter?.score?.mate != null ? (evalAfter.score.mate > 0 ? 10000 : -10000) : (evalAfter?.score?.cp ?? 0)

  const quality = evaluateMoveQuality(moveObj, evalBeforeCp, evalAfterCp)

  const bestMoveResult = await getBestMove(chessBefore.fen(), { skill: options.skill ?? 5, depth: options.depth ?? 12, movetime: options.movetime ?? 300 })
  let bestMoveSan = null
  if (bestMoveResult && bestMoveResult.length >= 4) {
    try {
      const tmp = new Chess(chessBefore.fen())
      const m = tmp.move({ from: bestMoveResult.slice(0, 2), to: bestMoveResult.slice(2, 4), promotion: 'q' })
      bestMoveSan = m ? m.san : null
    } catch {
      bestMoveSan = bestMoveResult
    }
  }

  return {
    move: moveObj.san,
    moveUci: playerMoveUci,
    quality,
    bestMove: bestMoveResult,
    bestMoveSan,
  }
}

export { evaluatePosition, classifyMoveFromLoss, materialBalance, pieceActivityScore, formatEvalText }
