import { Chess } from 'chess.js'

function findKing(chess, color) {
  const board = chess.fen().split(' ')[0].split('/')
  const kingChar = color === 'w' ? 'K' : 'k'
  for (let rank = 0; rank < 8; rank++) {
    let file = 0
    for (const char of board[rank]) {
      if (char >= '1' && char <= '8') {
        file += parseInt(char, 10)
        continue
      }
      if (char === kingChar) return String.fromCharCode(97 + file) + (8 - rank)
      file++
    }
  }
  return null
}

function getSquaresBehind(from, to) {
  const squares = []
  const fFrom = from.charCodeAt(0) - 97
  const rFrom = parseInt(from[1], 10) - 1
  const fTo = to.charCodeAt(0) - 97
  const rTo = parseInt(to[1], 10) - 1
  const df = Math.sign(fTo - fFrom)
  const dr = Math.sign(rTo - rFrom)
  let f = fTo + df
  let r = rTo + dr
  while (f >= 0 && f < 8 && r >= 0 && r < 8) {
    squares.push(String.fromCharCode(97 + f) + (r + 1))
    f += df
    r += dr
  }
  return squares
}

function detectForks(chess, color) {
  const forks = []
  const board = chess.board()
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file]
      if (!piece || piece.color !== color) continue
      const sq = String.fromCharCode(97 + file) + (8 - rank)
      const attacks = chess.moves({ square: sq, verbose: true })
      const valuableTargets = attacks.filter(m => {
        const target = chess.get(m.to)
        return target && target.color !== color && (target.type === 'k' || target.type === 'q' || target.type === 'r')
      })
      if (valuableTargets.length >= 2) {
        forks.push({
          type: 'fork',
          attacker: sq,
          targets: valuableTargets.map(m => ({ square: m.to, piece: chess.get(m.to)?.type })),
          attackerPiece: piece.type,
        })
      }
    }
  }
  return forks
}

function detectSkewers(chess, color) {
  const skewers = []
  const board = chess.board()
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file]
      if (!piece || piece.color === color) continue
      const sq = String.fromCharCode(97 + file) + (8 - rank)
      const attacks = chess.moves({ square: sq, verbose: true })
      for (const atk of attacks) {
        const target = chess.get(atk.to)
        if (!target || target.color !== color) continue
        const behind = getSquaresBehind(atk.to, sq)
        for (const b of behind) {
          const behindPiece = chess.get(b)
          if (behindPiece && behindPiece.color === color && behindPiece.type === 'k') {
            skewers.push({
              type: 'skewer',
              attacker: sq,
              target: atk.to,
              behind: b,
              attackerColor: piece.color,
              targetPiece: target.type,
            })
          }
        }
      }
    }
  }
  return skewers
}

function detectHangingPieces(chess, color) {
  const hanging = []
  const board = chess.board()
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file]
      if (!piece || piece.color !== color) continue
      const sq = String.fromCharCode(97 + file) + (8 - rank)
      const attackers = chess.moves({ square: sq, verbose: true }).filter(m => m.captured)
      if (attackers.length > 0) {
        const defenders = chess.moves({ square: sq, verbose: true }).filter(m => m.to === sq)
        if (attackers.length > defenders.length) {
          hanging.push({
            type: 'hanging',
            square: sq,
            piece: piece.type,
            attackers: attackers.length,
            defenders: defenders.length,
          })
        }
      }
    }
  }
  return hanging
}

function detectDiscoveredAttacks(chess, color) {
  const discovered = []
  const opponentKing = findKing(chess, color === 'w' ? 'b' : 'w')
  if (!opponentKing) return discovered

  const board = chess.board()
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file]
      if (!piece || piece.color !== color) continue
      const sq = String.fromCharCode(97 + file) + (8 - rank)
      const moves = chess.moves({ square: sq, verbose: true })
      for (const m of moves) {
        const tmp = new Chess(chess.fen())
        tmp.move({ from: sq, to: m.to, promotion: 'q' })
        if (tmp.isCheck() && tmp.turn() === (color === 'w' ? 'b' : 'w')) {
          discovered.push({
            type: 'discoveredAttack',
            mover: sq,
            target: m.to,
            checkSquare: opponentKing,
          })
        }
      }
    }
  }
  return discovered
}

function detectTactics(chess, color) {
  const tactics = []
  const opponentColor = color === 'w' ? 'b' : 'w'

  if (chess.isCheckmate() && chess.turn() === color) {
    tactics.push({ type: 'checkmate', color })
  } else if (chess.isCheckmate() && chess.turn() === opponentColor) {
    tactics.push({ type: 'opponentCheckmate', color: opponentColor })
  }

  if (chess.isCheck() && chess.turn() === color) {
    tactics.push({ type: 'check', color, king: findKing(chess, opponentColor) })
  }
  if (chess.isCheck() && chess.turn() === opponentColor) {
    tactics.push({ type: 'opponentCheck', color: opponentColor, king: findKing(chess, color) })
  }

  tactics.push(...detectForks(chess, color).map(f => ({ ...f, color })))
  tactics.push(...detectSkewers(chess, color).map(s => ({ ...s, color })))
  tactics.push(...detectHangingPieces(chess, color).map(h => ({ ...h, color })))
  tactics.push(...detectDiscoveredAttacks(chess, color).map(d => ({ ...d, color })))

  return tactics
}

function detectOpponentThreats(chess, playerColor) {
  const opponentColor = playerColor === 'w' ? 'b' : 'w'
  const threats = []
  if (chess.isCheck()) {
    threats.push({ type: 'check', message: 'Your king is in check.' })
  }
  const board = chess.board()
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file]
      if (!piece || piece.color !== opponentColor) continue
      const sq = String.fromCharCode(97 + file) + (8 - rank)
      const moves = chess.moves({ square: sq, verbose: true })
      for (const m of moves) {
        const target = chess.get(m.to)
        if (!target || target.color !== playerColor) continue
        if (target.type === 'k') {
          threats.push({ type: 'mateThreat', message: `${piece.type.toUpperCase()} on ${sq} threatens your king.` })
        } else if (target.type === 'q' || target.type === 'r') {
          threats.push({ type: 'materialThreat', message: `Your ${target.type.toUpperCase()} on ${m.to} is under attack.` })
        }
      }
    }
  }
  return threats
}

export { detectTactics, detectOpponentThreats, findKing }
