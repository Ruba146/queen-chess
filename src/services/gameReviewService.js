async function generateGameReview(game, profile) {
  return {
    gameId: game._id || game.id,
    summary: {
      result: game.result || 'unknown',
      accuracy: game.accuracy || 0,
    },
    strengths: [],
    weaknesses: [],
    criticalMoments: [],
    trainingRecommendations: ['Review the game to identify key learning points.'],
    statistics: {},
  };
}

module.exports = { generateGameReview };