function buildTrainingDatasetPayload({
  userId,
  mode,
  result,
  moves,
  pgn,
  playerColor,
  accuracy,
  opening,
  difficulty,
  duration,
  analysisResult,
  ratingBefore,
  newRating,
  ratingChange
}) {
  const normalizedResult = String(result || '').toLowerCase();
  const normalizedPlayerColor = String(playerColor || '').toLowerCase();
  const outcome = normalizedResult === 'draw'
    ? 'draw'
    : normalizedResult === 'white' || normalizedResult === 'black'
      ? (normalizedResult === normalizedPlayerColor ? 'win' : 'loss')
      : 'unknown';

  const moveRecords = (moves || []).map((move, index) => ({
    moveNumber: index + 1,
    move,
    classification: analysisResult?.moveAnalysis?.[index]?.classification || 'unknown',
    loss: analysisResult?.moveAnalysis?.[index]?.loss || 0,
    evalBefore: analysisResult?.moveAnalysis?.[index]?.evalBefore || 0,
    evalAfter: analysisResult?.moveAnalysis?.[index]?.evalAfter || 0,
    phase: analysisResult?.moveAnalysis?.[index]?.phase || 'unknown'
  }));

  const metrics = {
    accuracy: analysisResult?.accuracy ?? accuracy,
    performanceScore: analysisResult?.performanceScore ?? 0,
    strengths: analysisResult?.strengths || [],
    weaknesses: analysisResult?.weaknesses || [],
    openingScore: analysisResult?.openingScore ?? 0,
    middleGameScore: analysisResult?.middleGameScore ?? 0,
    endgameScore: analysisResult?.endgameScore ?? 0,
    coachRecommendations: analysisResult?.coachRecommendations || [],
    averageCentipawnLoss: analysisResult?.averageCentipawnLoss ?? 0,
    bestMoves: analysisResult?.bestMoves ?? 0,
    excellentMoves: analysisResult?.excellentMoves ?? 0,
    goodMoves: analysisResult?.goodMoves ?? 0,
    inaccuracies: analysisResult?.inaccuracies ?? 0,
    mistakes: analysisResult?.mistakes ?? 0,
    blunders: analysisResult?.blunders ?? 0,
    brilliantMoves: analysisResult?.brilliantMoves ?? 0,
    missedWins: analysisResult?.missedWins ?? 0,
    materialBalance: analysisResult?.materialBalance ?? 0
  };

  return {
    user: userId,
    mode,
    result,
    pgn,
    moves,
    playerColor,
    opening,
    difficulty,
    duration,
    totalMoves: (moves || []).length,
    outcome,
    moveRecords,
    metrics,
    labels: {
      outcome,
      color: playerColor,
      opening,
      difficulty
    },
    ratingSnapshot: {
      before: ratingBefore,
      after: newRating,
      change: ratingChange
    },
    createdAt: new Date()
  };
}

module.exports = { buildTrainingDatasetPayload };
