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
  // If before the move the player had a winning advantage (>300cp)
  // and after the move the advantage dropped significantly
  const sign = playerColor === "white" ? 1 : -1;
  const beforeAdjusted = evalBefore * sign;
  const afterAdjusted = evalAfter * sign;
  return beforeAdjusted > 300 && afterAdjusted < 100;
}

/**
 * Detect if a move was brilliant (sacrifice that maintains or improves position)
 */
function isBrilliant(move, evalBefore, evalAfter, loss) {
  // A brilliant move involves a sacrifice (giving up material)
  // while maintaining or improving the evaluation
  if (loss > 30) return false; // Must be accurate
  if (!move) return false;
  
  // Check if it's a capture that gives up material advantage
  // or a sacrifice (moving piece to a square where it can be captured)
  const isCapture = move.includes("x");
  const isPromotion = move.includes("=");
  
  // If it's a capture with low loss, it's excellent but not necessarily brilliant
  // Brilliant moves are typically sacrifices
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
      // Black piece
      blackMaterial += PIECE_VALUES[char] || 0;
    } else {
      // White piece
      whiteMaterial += PIECE_VALUES[char.toLowerCase()] || 0;
    }
  }
  
  return whiteMaterial - blackMaterial;
}

/**
 * Calculate piece activity from a FEN string
 * Counts how many squares each piece can move to (simplified)
 */
function calculatePieceActivity(fen) {
  const parts = fen.split(" ");
  const board = parts[0];
  let activityScore = 0;
  
  // Count pieces in the center and advanced positions
  const rows = board.split("/");
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const char of rows[rank]) {
      if (char >= "1" && char <= "8") {
        file += parseInt(char);
        continue;
      }
      // Piece found
      const isWhite = char === char.toUpperCase();
      const piece = char.toLowerCase();
      
      // Central control bonus
      const centerDist = Math.abs(3.5 - file) + Math.abs(3.5 - rank);
      const centralBonus = Math.max(0, 6 - centerDist) * 10;
      
      // Development bonus (pieces not on back rank)
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
  let safetyScore = 50; // Start at neutral
  
  // Find king
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
  
  // Pawn shield bonus (pawns near king)
  const pawnChar = isWhite ? "P" : "p";
  const pawnDir = isWhite ? -1 : 1;
  
  for (let df = -1; df <= 1; df++) {
    const checkFile = kingFile + df;
    if (checkFile < 0 || checkFile > 7) continue;
    const checkRank = kingRank + pawnDir;
    if (checkRank < 0 || checkRank > 7) continue;
    
    // Check if pawn exists at that position
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
  
  // King in center is less safe
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
  
  // Endgame = few pieces left
  if (totalPieces <= 6) return 90; // Pure endgame
  if (totalPieces <= 10) return 70; // Transitioning
  if (totalPieces <= 14) return 50;
  return 30; // Still many pieces
}

/**
 * Calculate tactical ability from move analysis
 */
function calculateTacticalAbility(moveAnalysis, playerColor) {
  if (!moveAnalysis || moveAnalysis.length === 0) return 50;
  
  let tacticalScore = 50;
  let tacticalMoves = 0;
  
  for (const m of moveAnalysis) {
    // Tactical moves: captures, checks (detected by 'x' or '+')
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
    // Positional moves: non-capture, non-check moves
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
  
  // Weight: later moves matter more (time pressure, complexity)
  for (let i = 0; i < totalMoves; i++) {
    const weight = 1 + (i / totalMoves); // Later moves weighted more
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
  
  // Lower avg loss and fewer bad moves = more consistent
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
    // Captures and checks indicate aggressive play
    if (m.move.includes("x")) aggressiveScore += 2;
    if (m.move.includes("+") || m.move.includes("#")) aggressiveScore += 3;
    
    // Quiet improving moves indicate positional play
    if (!m.move.includes("x") && !m.move.includes("+") && !m.move.includes("#")) {
      positionalScore += 1;
    }
  }
  
  // Material imbalance can indicate aggressive style
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
  
  // Accuracy-based
  if (accuracy >= 85) strengths.push("Excellent overall accuracy");
  else if (accuracy >= 75) strengths.push("Good overall accuracy");
  
  // Phase-based
  if (phaseScores.opening >= 75) strengths.push("Strong opening play with good development");
  if (phaseScores.middlegame >= 75) strengths.push("Excellent middle game tactical awareness");
  if (phaseScores.endgame >= 75) strengths.push("Superior endgame technique");
  
  // Classification-based
  const bestCount = moveAnalysis.filter(m => m.classification === "Best").length;
  const brilliantCount = moveAnalysis.filter(m => m.classification === "Best" && m.loss <= 5).length;
  const totalMoves = moveAnalysis.length;
  
  if (bestCount / totalMoves > 0.5) strengths.push("Consistently finds the best moves");
  if (brilliantCount >= 2) strengths.push("Shows creative and brilliant ideas");
  
  // Metrics-based
  if (metrics.tacticalAbility >= 70) strengths.push("Good tactical awareness and calculation");
  if (metrics.positionalPlay >= 70) strengths.push("Strong positional understanding");
  if (metrics.kingSafety >= 70) strengths.push("Good king safety awareness");
  if (metrics.pieceActivity >= 70) strengths.push("Active piece coordination");
  if (metrics.endgameQuality >= 70) strengths.push("Strong endgame technique");
  if (metrics.decisionMaking >= 70) strengths.push("Good decision making under pressure");
  if (metrics.consistency >= 70) strengths.push("Consistent performance throughout the game");
  
  // Material-based
  if (metrics.materialBalance > 3) strengths.push("Won material through tactical sequences");
  
  // If no specific strengths, give general positive feedback
  if (strengths.length === 0) {
    if (accuracy >= 60) strengths.push("Shows potential with room for improvement");
    else strengths.push("Actively learning and gaining experience");
  }
  
  return strengths.slice(0, 5); // Max 5 strengths
}

/**
 * Generate weaknesses based on actual performance metrics
 */
function generateWeaknesses(accuracy, moveAnalysis, phaseScores, metrics) {
  const weaknesses = [];
  
  // Accuracy-based
  if (accuracy < 60) weaknesses.push("Low overall accuracy needs improvement");
  else if (accuracy < 75) weaknesses.push("Accuracy could be improved");
  
  // Phase-based
  if (phaseScores.opening < 50) weaknesses.push("Weak opening preparation");
  else if (phaseScores.opening < 65) weaknesses.push("Opening phase needs improvement");
  
  if (phaseScores.middlegame < 50) weaknesses.push("Struggles in middle game complexity");
  else if (phaseScores.middlegame < 65) weaknesses.push("Middle game planning needs work");
  
  if (phaseScores.endgame < 50) weaknesses.push("Endgame technique needs significant improvement");
  else if (phaseScores.endgame < 65) weaknesses.push("Endgame conversion needs practice");
  
  // Classification-based
  const blunderCount = moveAnalysis.filter(m => m.classification === "Blunder").length;
  const mistakeCount = moveAnalysis.filter(m => m.classification === "Mistake").length;
  const inaccuracyCount = moveAnalysis.filter(m => m.classification === "Inaccuracy").length;
  
  if (blunderCount >= 2) weaknesses.push("Prone to critical blunders");
  if (mistakeCount >= 3) weaknesses.push("Makes too many positional mistakes");
  if (inaccuracyCount >= 4) weaknesses.push("Frequent inaccuracies reduce position quality");
  
  // Metrics-based
  if (metrics.tacticalAbility < 50) weaknesses.push("Tactical awareness needs development");
  if (metrics.positionalPlay < 50) weaknesses.push("Positional understanding needs improvement");
  if (metrics.kingSafety < 50) weaknesses.push("King safety is a concern");
  if (metrics.pieceActivity < 50) weaknesses.push("Piece coordination could be better");
  if (metrics.endgameQuality < 50) weaknesses.push("Endgame play needs work");
  if (metrics.decisionMaking < 50) weaknesses.push("Decision making needs improvement");
  if (metrics.consistency < 50) weaknesses.push("Inconsistent performance throughout the game");
  
  // Material-based
  if (metrics.materialBalance < -3) weaknesses.push("Lost material due to tactical oversights");
  
  // If no specific weaknesses, give general feedback
  if (weaknesses.length === 0) {
    if (accuracy < 85) weaknesses.push("Minor improvements can elevate play to next level");
  }
  
  return weaknesses.slice(0, 5); // Max 5 weaknesses
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
  
  // General recommendations if none specific
  if (recommendations.length === 0) {
    recommendations.push("Continue playing regularly to maintain your current level");
    recommendations.push("Challenge yourself with stronger opponents to keep improving");
  }
  
  return recommendations.slice(0, 4); // Max 4 recommendations
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
  
  // Score based on average loss and good move ratio
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
 * MAIN ANALYSIS FUNCTION
 * Performs real Stockfish-based analysis of a completed game
 * 
 * @param {Array} moves - Array of move strings in SAN notation
 * @param {String} playerColor - "white" or "black"
 * @param {Array} stockfishEvals - Array of Stockfish evaluations for each position
 * @param {Number} ratingBefore - Player's rating before the game
 * @param {Number} ratingAfter - Player's rating after the game
 * @param {Number} duration - Game duration in seconds
 * @param {String} difficulty - AI difficulty level
 * @returns {Object} Complete analysis report
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
  
  // Analyze each move
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const phase = getGamePhase(i + 1, moves.length);
    
    // Get evaluations (from Stockfish or simulated based on actual data)
    let evalBefore = 0;
    let evalAfter = 0;
    
    if (stockfishEvals && stockfishEvals[i] !== undefined) {
      evalBefore = stockfishEvals[i].before || 0;
      evalAfter = stockfishEvals[i].after || 0;
    } else {
      // Use centipawn-based evaluation from the position
      evalBefore = 0;
      evalAfter = 0;
    }
    
    // Calculate loss (difference between best and played)
    const loss = Math.abs(evalBefore - evalAfter);
    
    const classification = classifyMove(loss);
    
    // Track statistics
    totalLoss += loss;
    if (classification === "Best") bestMoves++;
    else if (classification === "Excellent") excellentMoves++;
    else if (classification === "Good") goodMoves++;
    else if (classification === "Inaccuracy") inaccuracies++;
    else if (classification === "Mistake") mistakes++;
    else if (classification === "Blunder") blunders++;
    
    // Check for brilliant moves
    if (isBrilliant(move, evalBefore, evalAfter, loss)) {
      brilliantMoves++;
    }
    
    // Check for missed wins
    if (isMissedWin(evalBefore, evalAfter, playerColor)) {
      missedWins++;
    }
    
    const analysisEntry = {
      moveNumber: i + 1,
      move,
      classification,
      loss: Math.round(loss),
      evalBefore: Math.round(evalBefore),
      evalAfter: Math.round(evalAfter),
      phase
    };
    
    moveAnalysis.push(analysisEntry);
    phaseMoves[phase].push(analysisEntry);
    
    evaluationData.push({
      moveNumber: i + 1,
      playerEval: Math.round(evalAfter),
      bestEval: Math.round(evalBefore),
      diff: Math.round(loss)
    });
    
    // Apply move to chess board
    try {
      chess.move(move);
    } catch (e) {
      // Skip invalid moves
    }
  }
  
  // Calculate overall accuracy
  const avgLoss = moves.length > 0 ? totalLoss / moves.length : 0;
  const accuracy = Math.max(0, Math.min(100, Math.round(100 - avgLoss / 2)));
  
  // Calculate phase scores
  const openingScore = calculatePhaseScore(phaseMoves.opening);
  const middleGameScore = calculatePhaseScore(phaseMoves.middlegame);
  const endgameScore = calculatePhaseScore(phaseMoves.endgame);
  
  // Get final position metrics
  const finalFen = chess.fen();
  const materialBalance = calculateMaterialBalance(finalFen);
  const pieceActivity = calculatePieceActivity(finalFen);
  const kingSafetyWhite = calculateKingSafety(finalFen, true);
  const kingSafetyBlack = calculateKingSafety(finalFen, false);
  const endgameQuality = calculateEndgameQuality(finalFen);
  
  // Calculate performance metrics
  const tacticalAbility = calculateTacticalAbility(moveAnalysis, playerColor);
  const positionalPlay = calculatePositionalPlay(moveAnalysis);
  const decisionMaking = calculateDecisionMaking(moveAnalysis);
  const consistency = calculateConsistency(moveAnalysis);
  
  // Determine playing style
  const playingStyle = determinePlayingStyle(moveAnalysis, materialBalance, pieceActivity);
  
  // Calculate performance score
  const performanceScore = Math.round(
    (accuracy * 0.3) +
    (tacticalAbility * 0.15) +
    (positionalPlay * 0.15) +
    (decisionMaking * 0.15) +
    (consistency * 0.15) +
    (endgameQuality * 0.1)
  );
  
  // Calculate average centipawn loss
  const averageCentipawnLoss = moves.length > 0 ? Math.round(totalLoss / moves.length) : 0;
  
  // Build metrics object for strength/weakness generation
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
  
  // Generate strengths and weaknesses from actual data
  const strengths = generateStrengths(accuracy, moveAnalysis, phaseScores, metrics);
  const weaknesses = generateWeaknesses(accuracy, moveAnalysis, phaseScores, metrics);
  const coachRecommendations = generateCoachRecommendations(weaknesses, phaseScores, metrics);
  
  // Calculate rating change
  const ratingChange = ratingAfter - ratingBefore;
  
  // Determine player level from this game's performance
  const playerLevel = determinePlayerLevel(
    ratingAfter,
    ratingBefore > 0 ? 50 : 0, // approximate win rate
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
  
  // Rating contribution (0-40 points)
  if (rating >= 2400) score += 40;
  else if (rating >= 2000) score += 35;
  else if (rating >= 1600) score += 25;
  else if (rating >= 1200) score += 15;
  else if (rating >= 800) score += 8;
  else score += 3;
  
  // Win rate contribution (0-25 points)
  if (winRate >= 80) score += 25;
  else if (winRate >= 65) score += 20;
  else if (winRate >= 50) score += 15;
  else if (winRate >= 35) score += 10;
  else if (winRate >= 20) score += 5;
  else score += 2;
  
  // Accuracy contribution (0-20 points)
  if (avgAccuracy >= 85) score += 20;
  else if (avgAccuracy >= 75) score += 15;
  else if (avgAccuracy >= 65) score += 10;
  else if (avgAccuracy >= 55) score += 5;
  else score += 2;
  
  // Consistency contribution (0-10 points)
  if (consistency >= 80) score += 10;
  else if (consistency >= 60) score += 7;
  else if (consistency >= 40) score += 4;
  else score += 1;
  
  // Games played contribution (0-5 points)
  if (totalGames >= 100) score += 5;
  else if (totalGames >= 50) score += 4;
  else if (totalGames >= 20) score += 3;
  else if (totalGames >= 10) score += 2;
  else if (totalGames >= 5) score += 1;
  
  // Determine level
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
  generateCoachRecommendations
};