const { Chess } = require("chess.js");

/**
 * Real AI Analysis Service
 * Uses Stockfish evaluations and actual game data to generate
 * comprehensive performance reports.
 */

// Piece values for material counting
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Opening move count threshold (first 10 moves = opening)
const OPENING_MOVE_LIMIT = 10;
// Middle game threshold (moves 11-30)
const MIDDLEGAME_MOVE_LIMIT = 30;

/**
 * Classify a move based on centipawn loss
 */
function classifyMove(loss) {
  if (loss <= 10) return "Best";
  if (loss <= 30) return "Excellent";
  if (loss <= 60) return "Good";
  if (loss <= 100) return "Inaccuracy";
  if (loss <= 250) return "Mistake";
  return "Blunder";
}

/**
 * Detect if a move was a missed win
 */
function isMissedWin(evalBefore, evalAfter, playerColor) {
  const sign = playerColor === "white" ? 1 : -1;
  const beforeAdjusted = evalBefore * sign;
  const afterAdjusted = evalAfter * sign;
  return beforeAdjusted > 300 && afterAdjusted < 100;
}

/**
 * Detect if a move was brilliant (sacrifice that maintains or improves position)
 */
function isBrilliant(move, evalBefore, evalAfter, loss) {
  if (loss > 30) return false;
  if (!move) return false;
  const isCapture = move.includes("x");
  const isPromotion = move.includes("=");
  if (isCapture && loss <= 10) return true;
  if (isPromotion) return true;
  return false;
}

/**
 * Get the phase of the game based on move number
 */
function getGamePhase(moveNumber, totalMoves) {
  if (moveNumber <= OPENING_MOVE_LIMIT) return "opening";
  if (moveNumber <= MIDDLEGAME_MOVE_LIMIT) return "middlegame";
  return "endgame";
}

/**
 * Calculate material balance from a FEN string
 */
function calculateMaterialBalance(fen) {
  const parts = fen.split(" ");
  const board = parts[0];
  let whiteMaterial = 0;
  let blackMaterial = 0;
  for (const char of board) {
    if (char === "/") continue;
    if (char === char.toLowerCase()) {
      blackMaterial += PIECE_VALUES[char] || 0;
    } else {
      whiteMaterial += PIECE_VALUES[char.toLowerCase()] || 0;
    }
  }
  return whiteMaterial - blackMaterial;
}

/**
 * Calculate piece activity from a FEN string
 */
function calculatePieceActivity(fen) {
  const parts = fen.split(" ");
  const board = parts[0];
  let activityScore = 0;
  const rows = board.split("/");
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const char of rows[rank]) {
      if (char >= "1" && char <= "8") {
        file += parseInt(char);
        continue;
      }
      const isWhite = char === char.toUpperCase();
      const piece = char.toLowerCase();
      const centerDist = Math.abs(3.5 - file) + Math.abs(3.5 - rank);
      const centralBonus = Math.max(0, 6 - centerDist) * 10;
      const developmentBonus = (rank > 0 && rank < 7) ? 15 : 0;
      activityScore += centralBonus + developmentBonus;
      file++;
    }
  }
  return activityScore;
}

/**
 * Calculate king safety from a FEN string
 */
function calculateKingSafety(fen, isWhite) {
  const parts = fen.split(" ");
  const board = parts[0];
  const rows = board.split("/");
  let kingFile = -1;
  let kingRank = -1;
  let safetyScore = 50;
  const kingChar = isWhite ? "K" : "k";
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const char of rows[rank]) {
      if (char >= "1" && char <= "8") {
        file += parseInt(char);
        continue;
      }
      if (char === kingChar) {
        kingFile = file;
        kingRank = rank;
      }
      file++;
    }
  }
  if (kingFile === -1) return 0;
  const pawnChar = isWhite ? "P" : "p";
  const pawnDir = isWhite ? -1 : 1;
  for (let df = -1; df <= 1; df++) {
    const checkFile = kingFile + df;
    if (checkFile < 0 || checkFile > 7) continue;
    const checkRank = kingRank + pawnDir;
    if (checkRank < 0 || checkRank > 7) continue;
    let file = 0;
    for (let r = 0; r < 8; r++) {
      let f = 0;
      for (const char of rows[r]) {
        if (char >= "1" && char <= "8") {
          f += parseInt(char);
          continue;
        }
        if (r === checkRank && f === checkFile && char === pawnChar) {
          safetyScore += 15;
        }
        f++;
      }
    }
  }
  const centerDist = Math.abs(3.5 - kingFile) + Math.abs(3.5 - kingRank);
  if (centerDist < 3) safetyScore -= 20;
  return Math.max(0, Math.min(100, safetyScore));
}

/**
 * Calculate endgame quality score
 */
function calculateEndgameQuality(fen) {
  const parts = fen.split(" ");
  const board = parts[0];
  let totalPieces = 0;
  for (const char of board) {
    if (char === "/") continue;
    if (char >= "1" && char <= "8") continue;
    totalPieces++;
  }
  if (totalPieces <= 6) return 90;
  if (totalPieces <= 10) return 70;
  if (totalPieces <= 14) return 50;
  return 30;
}

/**
 * Calculate tactical ability from move analysis
 */
function calculateTacticalAbility(moveAnalysis, playerColor) {
  if (!moveAnalysis || moveAnalysis.length === 0) return 50;
  let tacticalScore = 50;
  let tacticalMoves = 0;
  for (const m of moveAnalysis) {
    const isTactical = m.move.includes("x") || m.move.includes("+") || m.move.includes("#");
    if (isTactical) {
      tacticalMoves++;
      if (m.classification === "Best" || m.classification === "Excellent") {
        tacticalScore += 5;
      } else if (m.classification === "Blunder" || m.classification === "Mistake") {
        tacticalScore -= 8;
      }
    }
  }
  return Math.max(0, Math.min(100, tacticalScore));
}

/**
 * Calculate positional play score
 */
function calculatePositionalPlay(moveAnalysis) {
  if (!moveAnalysis || moveAnalysis.length === 0) return 50;
  let positionalScore = 50;
  let positionalMoves = 0;
  for (const m of moveAnalysis) {
    const isTactical = m.move.includes("x") || m.move.includes("+") || m.move.includes("#");
    if (!isTactical) {
      positionalMoves++;
      if (m.classification === "Best" || m.classification === "Excellent") {
        positionalScore += 3;
      } else if (m.classification === "Inaccuracy") {
        positionalScore -= 4;
      } else if (m.classification === "Mistake" || m.classification === "Blunder") {
        positionalScore -= 6;
      }
    }
  }
  return Math.max(0, Math.min(100, positionalScore));
}

/**
 * Calculate decision making score
 */
function calculateDecisionMaking(moveAnalysis) {
  if (!moveAnalysis || moveAnalysis.length === 0) return 50;
  let decisionScore = 50;
  const totalMoves = moveAnalysis.length;
  for (let i = 0; i < totalMoves; i++) {
    const weight = 1 + (i / totalMoves);
    const m = moveAnalysis[i];
    if (m.classification === "Best" || m.classification === "Excellent") {
      decisionScore += 2 * weight;
    } else if (m.classification === "Blunder") {
      decisionScore -= 8 * weight;
    } else if (m.classification === "Mistake") {
      decisionScore -= 5 * weight;
    } else if (m.classification === "Inaccuracy") {
      decisionScore -= 3 * weight;
    }
  }
  return Math.max(0, Math.min(100, decisionScore));
}

/**
 * Calculate consistency score
 */
function calculateConsistency(moveAnalysis) {
  if (!moveAnalysis || moveAnalysis.length < 5) return 50;
  let totalLoss = 0;
  let badMoves = 0;
  for (const m of moveAnalysis) {
    totalLoss += m.loss;
    if (m.classification === "Mistake" || m.classification === "Blunder") {
      badMoves++;
    }
  }
  const avgLoss = totalLoss / moveAnalysis.length;
  const badMoveRatio = badMoves / moveAnalysis.length;
  let consistency = 100 - (avgLoss / 3) - (badMoveRatio * 50);
  return Math.max(0, Math.min(100, Math.round(consistency)));
}

/**
 * Determine playing style from analysis
 */
function determinePlayingStyle(moveAnalysis, materialBalance, pieceActivity) {
  if (!moveAnalysis || moveAnalysis.length === 0) return "Balanced";
  let aggressiveScore = 0;
  let positionalScore = 0;
  for (const m of moveAnalysis) {
    if (m.move.includes("x")) aggressiveScore += 2;
    if (m.move.includes("+") || m.move.includes("#")) aggressiveScore += 3;
    if (!m.move.includes("x") && !m.move.includes("+") && !m.move.includes("#")) {
      positionalScore += 1;
    }
  }
  if (Math.abs(materialBalance) > 2) aggressiveScore += 3;
  if (aggressiveScore > positionalScore * 1.5) return "Aggressive";
  if (positionalScore > aggressiveScore * 1.5) return "Positional";
  if (aggressiveScore > 0 && positionalScore > 0) return "Balanced";
  return "Balanced";
}

/**
 * Generate strengths based on actual performance metrics
 */
function generateStrengths(accuracy, moveAnalysis, phaseScores, metrics) {
  const strengths = [];
  if (accuracy >= 85) strengths.push("Excellent overall accuracy");
  else if (accuracy >= 75) strengths.push("Good overall accuracy");
  if (phaseScores.opening >= 75) strengths.push("Strong opening play with good development");
  if (phaseScores.middlegame >= 75) strengths.push("Excellent middle game tactical awareness");
  if (phaseScores.endgame >= 75) strengths.push("Superior endgame technique");
  const bestCount = moveAnalysis.filter(m => m.classification === "Best").length;
  const brilliantCount = moveAnalysis.filter(m => m.classification === "Best" && m.loss <= 5).length;
  const totalMoves = moveAnalysis.length;
  if (bestCount / totalMoves > 0.5) strengths.push("Consistently finds the best moves");
  if (brilliantCount >= 2) strengths.push("Shows creative and brilliant ideas");
  if (metrics.tacticalAbility >= 70) strengths.push("Good tactical awareness and calculation");
  if (metrics.positionalPlay >= 70) strengths.push("Strong positional understanding");
  if (metrics.kingSafety >= 70) strengths.push("Good king safety awareness");
  if (metrics.pieceActivity >= 70) strengths.push("Active piece coordination");
  if (metrics.endgameQuality >= 70) strengths.push("Strong endgame technique");
  if (metrics.decisionMaking >= 70) strengths.push("Good decision making under pressure");
  if (metrics.consistency >= 70) strengths.push("Consistent performance throughout the game");
  if (metrics.materialBalance > 3) strengths.push("Won material through tactical sequences");
  if (strengths.length === 0) {
    if (accuracy >= 60) strengths.push("Shows potential with room for improvement");
    else strengths.push("Actively learning and gaining experience");
  }
  return strengths.slice(0, 5);
}

/**
 * Generate weaknesses based on actual performance metrics
 */
function generateWeaknesses(accuracy, moveAnalysis, phaseScores, metrics) {
  const weaknesses = [];
  if (accuracy < 60) weaknesses.push("Low overall accuracy needs improvement");
  else if (accuracy < 75) weaknesses.push("Accuracy could be improved");
  if (phaseScores.opening < 50) weaknesses.push("Weak opening preparation");
  else if (phaseScores.opening < 65) weaknesses.push("Opening phase needs improvement");
  if (phaseScores.middlegame < 50) weaknesses.push("Struggles in middle game complexity");
  else if (phaseScores.middlegame < 65) weaknesses.push("Middle game planning needs work");
  if (phaseScores.endgame < 50) weaknesses.push("Endgame technique needs significant improvement");
  else if (phaseScores.endgame < 65) weaknesses.push("Endgame conversion needs practice");
  const blunderCount = moveAnalysis.filter(m => m.classification === "Blunder").length;
  const mistakeCount = moveAnalysis.filter(m => m.classification === "Mistake").length;
  const inaccuracyCount = moveAnalysis.filter(m => m.classification === "Inaccuracy").length;
  if (blunderCount >= 2) weaknesses.push("Prone to critical blunders");
  if (mistakeCount >= 3) weaknesses.push("Makes too many positional mistakes");
  if (inaccuracyCount >= 4) weaknesses.push("Frequent inaccuracies reduce position quality");
  if (metrics.tacticalAbility < 50) weaknesses.push("Tactical awareness needs development");
  if (metrics.positionalPlay < 50) weaknesses.push("Positional understanding needs improvement");
  if (metrics.kingSafety < 50) weaknesses.push("King safety is a concern");
  if (metrics.pieceActivity < 50) weaknesses.push("Piece coordination could be better");
  if (metrics.endgameQuality < 50) weaknesses.push("Endgame play needs work");
  if (metrics.decisionMaking < 50) weaknesses.push("Decision making needs improvement");
  if (metrics.consistency < 50) weaknesses.push("Inconsistent performance throughout the game");
  if (metrics.materialBalance < -3) weaknesses.push("Lost material due to tactical oversights");
  if (weaknesses.length === 0) {
    if (accuracy < 85) weaknesses.push("Minor improvements can elevate play to next level");
  }
  return weaknesses.slice(0, 5);
}

/**
 * Generate coach recommendations based on weaknesses
 */
function generateCoachRecommendations(weaknesses, phaseScores, metrics) {
  const recommendations = [];
  if (weaknesses.some(w => w.toLowerCase().includes("opening"))) {
    recommendations.push("Study common opening principles: control the center, develop pieces, castle early");
    recommendations.push("Build a small opening repertoire with 2-3 openings for White and Black");
  }
  if (weaknesses.some(w => w.toLowerCase().includes("middle"))) {
    recommendations.push("Practice tactical puzzles daily to improve middle game pattern recognition");
    recommendations.push("Study middle game plans: identify pawn structures and piece placement goals");
  }
  if (weaknesses.some(w => w.toLowerCase().includes("endgame"))) {
    recommendations.push("Study basic endgame principles: king activity, pawn structure, opposition");
    recommendations.push("Practice common endgame techniques like Lucena and Philidor positions");
  }
  if (weaknesses.some(w => w.toLowerCase().includes("blunder") || w.toLowerCase().includes("mistake"))) {
    recommendations.push("Before each move, check for checks, captures, and threats from opponent");
    recommendations.push("Take extra time in critical positions to verify calculations");
  }
  if (weaknesses.some(w => w.toLowerCase().includes("tactical"))) {
    recommendations.push("Solve 10-15 tactical puzzles daily to improve pattern recognition");
    recommendations.push("Focus on fork, pin, and skewer patterns in training");
  }
  if (weaknesses.some(w => w.toLowerCase().includes("positional"))) {
    recommendations.push("Study positional concepts: pawn structures, outposts, and piece activity");
    recommendations.push("Analyze master games to understand positional decision making");
  }
  if (weaknesses.some(w => w.toLowerCase().includes("king safety"))) {
    recommendations.push("Prioritize castling early, preferably within the first 10 moves");
    recommendations.push("Maintain a strong pawn shield around your king");
  }
  if (weaknesses.some(w => w.toLowerCase().includes("consistency") || w.toLowerCase().includes("inconsistent"))) {
    recommendations.push("Develop a consistent pre-move routine to maintain focus throughout the game");
    recommendations.push("Practice longer time controls to develop deeper calculation habits");
  }
  if (weaknesses.some(w => w.toLowerCase().includes("accuracy"))) {
    recommendations.push("Review each game to identify recurring patterns in inaccurate moves");
    recommendations.push("Focus on calculating 2-3 moves ahead before committing to a plan");
  }
  if (recommendations.length === 0) {
    recommendations.push("Continue playing regularly to maintain your current level");
    recommendations.push("Challenge yourself with stronger opponents to keep improving");
  }
  return recommendations.slice(0, 4);
}

/**
 * Calculate phase score from move analysis for a specific phase
 */
function calculatePhaseScore(movesInPhase) {
  if (!movesInPhase || movesInPhase.length === 0) return 50;
  let totalLoss = 0;
  let goodMoves = 0;
  for (const m of movesInPhase) {
    totalLoss += m.loss;
    if (m.classification === "Best" || m.classification === "Excellent") {
      goodMoves++;
    }
  }
  const avgLoss = totalLoss / movesInPhase.length;
  const goodRatio = goodMoves / movesInPhase.length;
  let score = 100 - (avgLoss / 2) + (goodRatio * 20);
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate missed wins from analysis
 */
function calculateMissedWins(moveAnalysis, playerColor) {
  let missed = 0;
  for (const m of moveAnalysis) {
    if (isMissedWin(m.evalBefore, m.evalAfter, playerColor)) {
      missed++;
    }
  }
  return missed;
}

/**
 * Generate a WHY explanation for a move based on the actual position change
 */
function generateMoveExplanation(move, evalBefore, evalAfter, loss, phase, materialBefore, materialAfter) {
  const explanations = []
  const isCapture = move.includes("x")
  const isCheck = move.includes("+")
  const isPromotion = move.includes("=")
  const materialChange = materialAfter - materialBefore

  if (isPromotion) {
    explanations.push("Pawn promotion creates a powerful new piece.")
  }
  if (isCheck) {
    explanations.push("Delivers check, forcing the opponent to respond.")
  }
  if (isCapture && materialChange > 0) {
    explanations.push(`Wins material: ${materialChange / 100} pawns.`)
  }
  if (loss <= 10) {
    explanations.push("Maintains the best possible evaluation.")
  } else if (loss <= 60) {
    explanations.push("A strong move that keeps a favorable position.")
  } else if (loss <= 250) {
    explanations.push("The move allows the opponent to improve their position.")
  } else if (loss <= 500) {
    explanations.push("Significant evaluation drop — a better alternative existed.")
  } else {
    explanations.push("Major evaluation loss — the position deteriorates sharply.")
  }

  if (phase === "opening") {
    explanations.push("Opening phase: prioritize development and center control.")
  } else if (phase === "middlegame") {
    explanations.push("Middlegame: look for tactical opportunities and piece coordination.")
  } else {
    explanations.push("Endgame: king activity and pawn promotion are key.")
  }

  return explanations.slice(0, 3).join(" ")
}

/**
 * MAIN ANALYSIS FUNCTION
 */
function performAnalysis(moves, playerColor, stockfishEvals, ratingBefore, ratingAfter, duration, difficulty) {
  const chess = new Chess();
  const moveAnalysis = [];
  const evaluationData = [];
  const phaseMoves = { opening: [], middlegame: [], endgame: [] };

  let totalLoss = 0;
  let bestMoves = 0;
  let excellentMoves = 0;
  let goodMoves = 0;
  let inaccuracies = 0;
  let mistakes = 0;
  let blunders = 0;
  let brilliantMoves = 0;
  let missedWins = 0;

  let prevMaterial = calculateMaterialBalance(chess.fen())

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const phase = getGamePhase(i + 1, moves.length);

    let evalBefore = 0;
    let evalAfter = 0;
    let materialBefore = prevMaterial

    if (stockfishEvals && stockfishEvals[i] !== undefined) {
      evalBefore = stockfishEvals[i].before || 0;
      evalAfter = stockfishEvals[i].after || 0;
    }

    try {
      chess.move(move);
    } catch (e) {
      // Skip invalid moves
    }

    const materialAfter = calculateMaterialBalance(chess.fen())
    prevMaterial = materialAfter

    const loss = Math.abs(evalBefore - evalAfter);
    const classification = classifyMove(loss);

    totalLoss += loss;
    if (classification === "Best") bestMoves++;
    else if (classification === "Excellent") excellentMoves++;
    else if (classification === "Good") goodMoves++;
    else if (classification === "Inaccuracy") inaccuracies++;
    else if (classification === "Mistake") mistakes++;
    else if (classification === "Blunder") blunders++;

    if (isBrilliant(move, evalBefore, evalAfter, loss)) {
      brilliantMoves++;
    }
    if (isMissedWin(evalBefore, evalAfter, playerColor)) {
      missedWins++;
    }

    const why = generateMoveExplanation(move, evalBefore, evalAfter, loss, phase, materialBefore, materialAfter)

    const analysisEntry = {
      moveNumber: i + 1,
      move,
      classification,
      loss: Math.round(loss),
      evalBefore: Math.round(evalBefore),
      evalAfter: Math.round(evalAfter),
      phase,
      why,
    };

    moveAnalysis.push(analysisEntry);
    phaseMoves[phase].push(analysisEntry);

    evaluationData.push({
      moveNumber: i + 1,
      playerEval: Math.round(evalAfter),
      bestEval: Math.round(evalBefore),
      diff: Math.round(loss),
    });
  }

  const avgLoss = moves.length > 0 ? totalLoss / moves.length : 0;
  const accuracy = Math.max(0, Math.min(100, Math.round(100 - avgLoss / 2)));

  const openingScore = calculatePhaseScore(phaseMoves.opening);
  const middleGameScore = calculatePhaseScore(phaseMoves.middlegame);
  const endgameScore = calculatePhaseScore(phaseMoves.endgame);

  const finalFen = chess.fen();
  const materialBalance = calculateMaterialBalance(finalFen);
  const pieceActivity = calculatePieceActivity(finalFen);
  const kingSafetyWhite = calculateKingSafety(finalFen, true);
  const kingSafetyBlack = calculateKingSafety(finalFen, false);
  const endgameQuality = calculateEndgameQuality(finalFen);

  const tacticalAbility = calculateTacticalAbility(moveAnalysis, playerColor);
  const positionalPlay = calculatePositionalPlay(moveAnalysis);
  const decisionMaking = calculateDecisionMaking(moveAnalysis);
  const consistency = calculateConsistency(moveAnalysis);

  const playingStyle = determinePlayingStyle(moveAnalysis, materialBalance, pieceActivity);

  const performanceScore = Math.round(
    (accuracy * 0.3) +
    (tacticalAbility * 0.15) +
    (positionalPlay * 0.15) +
    (decisionMaking * 0.15) +
    (consistency * 0.15) +
    (endgameQuality * 0.1)
  );

  const averageCentipawnLoss = moves.length > 0 ? Math.round(totalLoss / moves.length) : 0;

  const metrics = {
    tacticalAbility,
    positionalPlay,
    kingSafety: playerColor === "white" ? kingSafetyWhite : kingSafetyBlack,
    pieceActivity,
    endgameQuality,
    decisionMaking,
    consistency,
    materialBalance
  };

  const phaseScores = {
    opening: openingScore,
    middlegame: middleGameScore,
    endgame: endgameScore
  };

  const strengths = generateStrengths(accuracy, moveAnalysis, phaseScores, metrics);
  const weaknesses = generateWeaknesses(accuracy, moveAnalysis, phaseScores, metrics);
  const coachRecommendations = generateCoachRecommendations(weaknesses, phaseScores, metrics);

  const ratingChange = ratingAfter - ratingBefore;

  const playerLevel = determinePlayerLevel(
    ratingAfter,
    ratingBefore > 0 ? 50 : 0,
    accuracy,
    consistency,
    moves.length
  );

  return {
    accuracy,
    totalMoves: moves.length,
    bestMoves,
    excellentMoves,
    goodMoves,
    inaccuracies,
    mistakes,
    blunders,
    brilliantMoves,
    missedWins,
    averageCentipawnLoss,
    materialBalance,
    pieceActivityScore: Math.round(pieceActivity),
    kingSafetyScore: playerColor === "white" ? Math.round(kingSafetyWhite) : Math.round(kingSafetyBlack),
    endgameQualityScore: Math.round(endgameQuality),
    tacticalAbilityScore: Math.round(tacticalAbility),
    positionalPlayScore: Math.round(positionalPlay),
    decisionMakingScore: Math.round(decisionMaking),
    consistencyScore: Math.round(consistency),
    playingStyle,
    performanceScore,
    openingScore,
    middleGameScore,
    endgameScore,
    strengths,
    weaknesses,
    coachRecommendations,
    ratingChange,
    ratingAfter,
    moveAnalysis,
    evaluationData,
    phaseMoves: {
      opening: phaseMoves.opening.length,
      middlegame: phaseMoves.middlegame.length,
      endgame: phaseMoves.endgame.length
    },
    playerLevel
  };
}

/**
 * Determine player level based on multiple factors
 */
function determinePlayerLevel(rating, winRate, avgAccuracy, consistency, totalGames) {
  let score = 0;

  if (rating >= 2400) score += 40;
  else if (rating >= 2000) score += 35;
  else if (rating >= 1600) score += 25;
  else if (rating >= 1200) score += 15;
  else if (rating >= 800) score += 8;
  else score += 3;

  if (winRate >= 80) score += 25;
  else if (winRate >= 65) score += 20;
  else if (winRate >= 50) score += 15;
  else if (winRate >= 35) score += 10;
  else if (winRate >= 20) score += 5;
  else score += 2;

  if (avgAccuracy >= 85) score += 20;
  else if (avgAccuracy >= 75) score += 15;
  else if (avgAccuracy >= 65) score += 10;
  else if (avgAccuracy >= 55) score += 5;
  else score += 2;

  if (consistency >= 80) score += 10;
  else if (consistency >= 60) score += 7;
  else if (consistency >= 40) score += 4;
  else score += 1;

  if (totalGames >= 100) score += 5;
  else if (totalGames >= 50) score += 4;
  else if (totalGames >= 20) score += 3;
  else if (totalGames >= 10) score += 2;
  else if (totalGames >= 5) score += 1;

  if (score >= 85) return "Master";
  if (score >= 70) return "Expert";
  if (score >= 55) return "Advanced";
  if (score >= 35) return "Intermediate";
  return "Beginner";
}

/**
 * Get rank from rating
 */
function getRankFromRating(rating) {
  if (rating < 800) return "Beginner";
  if (rating < 1200) return "Bronze";
  if (rating < 1600) return "Silver";
  if (rating < 2000) return "Gold";
  if (rating < 2400) return "Platinum";
  if (rating < 2700) return "Diamond";
  if (rating < 2900) return "Master";
  return "Grandmaster";
}

module.exports = {
  performAnalysis,
  determinePlayerLevel,
  getRankFromRating,
  classifyMove,
  calculateMaterialBalance,
  calculatePieceActivity,
  calculateKingSafety,
  calculateEndgameQuality,
  calculateTacticalAbility,
  calculatePositionalPlay,
  calculateDecisionMaking,
  calculateConsistency,
  determinePlayingStyle,
  generateStrengths,
  generateWeaknesses,
  generateCoachRecommendations,
};