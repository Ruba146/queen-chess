function getPlayerLevelContext(playerLevel) {
  if (playerLevel === 'Beginner') return { tone: 'simple', vocabulary: 'basic', maxPlanLength: 3 }
  if (playerLevel === 'Intermediate') return { tone: 'clear', vocabulary: 'moderate', maxPlanLength: 4 }
  if (playerLevel === 'Advanced') return { tone: 'detailed', vocabulary: 'advanced', maxPlanLength: 5 }
  return { tone: 'concise', vocabulary: 'expert', maxPlanLength: 6 }
}

function describeMaterialBalance(balance) {
  if (balance === 0) return 'Material is equal.'
  if (balance > 0) return `White has a material advantage of ${(balance / 100).toFixed(1)} pawns.`
  return `Black has a material advantage of ${Math.abs(balance / 100).toFixed(1)} pawns.`
}

function describeKingSafety(shield) {
  if (shield >= 2) return 'King is well protected by pawns.'
  if (shield === 1) return 'King has partial pawn protection.'
  return "King pawn shield is weak — castling or improving king safety should be a priority."
}

function describeDevelopment(devScore) {
  if (devScore >= 30) return 'Pieces are well developed.'
  if (devScore >= 15) return 'Development is progressing but can be improved.'
  return 'Pieces are underdeveloped — prioritize piece development.'
}

function describeCenterControl(centerScore) {
  if (centerScore >= 30) return 'Strong control of the center.'
  if (centerScore >= 10) return 'Moderate center control.'
  return 'Center control is weak — contest central squares.'
}

function describeInitiative(chess) {
  const attacks = chess.moves({ verbose: true }).filter(m => m.captured || m.san?.includes('+'))
  if (attacks.length > 3) return `${chess.turn() === 'w' ? 'White' : 'Black'} has the initiative with active threats.`
  return 'No clear initiative — position is roughly equal in activity.'
}

function buildCoachMessage(chess, analysis, playerColor, playerLevel) {
  const ctx = getPlayerLevelContext(playerLevel)
  const evalData = analysis?.positionEval || {}
  const materialBalance = evalData.materialBalance || 0
  const isWhite = playerColor === 'white'

  const sections = []

  sections.push({
    title: 'Position Summary',
    content: [
      describeMaterialBalance(materialBalance),
      describeKingSafety(isWhite ? evalData.whiteShield : evalData.blackShield),
      describeDevelopment(isWhite ? evalData.whiteDevelopment : evalData.blackDevelopment),
      describeCenterControl(isWhite ? evalData.whiteCenter : evalData.blackCenter),
      describeInitiative(chess),
    ].join(' '),
  })

  const threats = detectOpponentThreats(chess, playerColor)
  if (threats.length > 0) {
    sections.push({
      title: 'Opponent Threat',
      content: threats[0].message,
    })
  }

  const plan = generatePlan(chess, playerColor, evalData, ctx)
  if (plan.length > 0) {
    sections.push({
      title: 'Plan',
      content: plan.map((step, i) => `${i + 1}. ${step}`).join('\n'),
    })
  }

  const improvement = identifyImprovement(chess, playerColor, evalData)
  if (improvement) {
    sections.push({
      title: 'Priority Improvement',
      content: improvement,
    })
  }

  return sections
}

function generatePlan(chess, playerColor, evalData, ctx) {
  const plan = []
  const isWhite = playerColor === 'white'
  const dev = isWhite ? evalData.whiteDevelopment : evalData.blackDevelopment
  const shield = isWhite ? evalData.whiteShield : evalData.blackShield
  const center = isWhite ? evalData.whiteCenter : evalData.blackCenter

  if (shield <= 1 && !chess.isCheck()) plan.push('Improve king safety or castle.')
  if (dev < 15) plan.push('Develop an underdeveloped minor piece.')
  if (center < 10) plan.push('Increase presence in the center.')
  if (plan.length === 0) plan.push('Improve piece coordination and prepare an attack or expansion plan.')

  return plan.slice(0, ctx.maxPlanLength)
}

function identifyImprovement(chess, playerColor, evalData) {
  const isWhite = playerColor === 'white'
  const shield = isWhite ? evalData.whiteShield : evalData.blackShield
  const dev = isWhite ? evalData.whiteDevelopment : evalData.blackDevelopment
  const center = isWhite ? evalData.whiteCenter : evalData.blackCenter

  if (shield <= 1) return 'Your king safety is the weakest point. Address it first.'
  if (dev < 15) return 'Your pieces are underdeveloped. Develop a minor piece immediately.'
  if (center < 10) return 'Your center control is weak. Contest central squares or prepare a pawn break.'
  return 'Look for tactical opportunities or improve your least active piece.'
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

export {
  buildCoachMessage,
  getPlayerLevelContext,
  describeMaterialBalance,
  describeKingSafety,
  describeDevelopment,
  describeCenterControl,
  describeInitiative,
  generatePlan,
  identifyImprovement,
  detectOpponentThreats,
}
