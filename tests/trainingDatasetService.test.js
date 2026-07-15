const test = require('node:test');
const assert = require('node:assert/strict');

const { buildTrainingDatasetPayload } = require('../utils/trainingDatasetService');

test('buildTrainingDatasetPayload creates export-ready training data', () => {
  const payload = buildTrainingDatasetPayload({
    userId: 'user-123',
    mode: 'rapid',
    result: 'White',
    moves: ['e4', 'e5'],
    pgn: '1. e4 e5',
    playerColor: 'white',
    accuracy: 78,
    opening: 'Sicilian Defense',
    difficulty: 'advanced',
    duration: 180,
    analysisResult: {
      accuracy: 78,
      performanceScore: 81,
      strengths: ['Solid opening'],
      weaknesses: ['Need better endgames'],
      openingScore: 70,
      middleGameScore: 65,
      endgameScore: 55,
      coachRecommendations: ['Practice endgames'],
      averageCentipawnLoss: 24,
      bestMoves: 3,
      excellentMoves: 2,
      goodMoves: 2,
      inaccuracies: 1,
      mistakes: 1,
      blunders: 0,
      brilliantMoves: 1,
      missedWins: 0,
      materialBalance: 1,
      moveAnalysis: [
        { classification: 'good', loss: 16, evalBefore: 0.1, evalAfter: 0.2, phase: 'opening' },
        { classification: 'mistake', loss: 42, evalBefore: 0.2, evalAfter: -0.1, phase: 'middlegame' }
      ]
    },
    ratingBefore: 1200,
    newRating: 1245,
    ratingChange: 45
  });

  assert.equal(payload.user, 'user-123');
  assert.equal(payload.totalMoves, 2);
  assert.equal(payload.moveRecords.length, 2);
  assert.equal(payload.moveRecords[0].classification, 'good');
  assert.equal(payload.metrics.bestMoves, 3);
  assert.equal(payload.labels.outcome, 'win');
  assert.equal(payload.ratingSnapshot.change, 45);
});
