const express = require('express');
const router = express.Router();
const { Chess } = require('chess.js');

const {
  generateOpeningExplanation,
  generateTacticsExplanation,
  generateEndgameExplanation,
  generateCoachPlan,
  generateChatResponse,
  generateOpeningSearch,
  identifyOpeningAndExplain,
  generateOpeningExplorerList,
  generateEndgameExplorerList
} = require('../ai/aiExplanationService');

const { generateTrainingSession } = require('../services/trainingGeneratorService');
const { generateGameReview } = require('../services/gameReviewService');
const { generateQuiz } = require('../services/quizGeneratorService');
const { generateLearningPath } = require('../services/learningPathService');
const {
  getPuzzleRecommendations,
  getOpeningRecommendations,
  getEndgameRecommendations,
  getDailyTraining
} = require('../services/recommendationEngine');

// Opening Explanation
router.post('/explain/opening', async (req, res) => {
  try {
    const { name, eco, category, difficulty, moves, fen, evalBefore, evalAfter, metadata } = req.body;
    if (!name) return res.status(400).json({ error: 'Opening name is required' });
    const result = await generateOpeningExplanation({
      name: name || 'Unknown Opening',
      eco: eco || 'N/A',
      category: category || 'N/A',
      difficulty: difficulty || 'Beginner',
      moves: moves || [],
      fen: fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      evalBefore: evalBefore ? { score: evalBefore.score || 0, mate: evalBefore.mate || null } : { score: 0 },
      evalAfter: evalAfter ? { score: evalAfter.score || 0, mate: evalAfter.mate || null } : { score: 0 },
      metadata: metadata || {}
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Opening Explanation Error:', error);
    res.json({ success: true, data: { explanation: 'AI explanation is temporarily unavailable.' } });
  }
});

// Tactic/Puzzle Explanation
router.post('/explain/tactic', async (req, res) => {
  try {
    const { fen, solution, themes, rating, goal, evalBefore, evalAfter, materialBefore, materialAfter } = req.body;
    const result = await generateTacticsExplanation({
      fen: fen || 'start',
      solution: solution || [],
      themes: themes || [],
      rating: rating || 1200,
      goal: goal || 'Find the best move',
      evalBefore: evalBefore ? { score: evalBefore.score || 0 } : { score: 0 },
      evalAfter: evalAfter ? { score: evalAfter.score || 0 } : { score: 0 },
      materialBefore: materialBefore || 0,
      materialAfter: materialAfter || 0
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Tactics Explanation Error:', error);
    res.json({ success: true, data: { explanation: 'The solution works by exploiting tactical motifs in the position.', beginnerExplanation: 'Look for forcing moves: checks, captures, and threats.', intermediateExplanation: 'Calculate the forcing sequence and compare with alternatives.', advancedExplanation: 'Check defensive resources and sideline variations.', mainIdea: 'Identify and execute the tactical opportunity.', strategicConcepts: ['Piece coordination', 'King safety', 'Material balance'], tacticalThemes: req.body?.themes || ['Calculation', 'Pattern recognition'], commonMistakes: ['Not considering forcing moves', 'Stopping calculation too early', 'Missing defensive resources'], practicalAdvice: 'Train tactical patterns daily with focused practice.', trainingRecommendations: ['Practice thematic puzzles', 'Review master games', 'Use spaced repetition'] } });
  }
});

// Endgame Explanation
router.post('/explain/endgame', async (req, res) => {
  try {
    const { fen, name, difficulty, themes, solution, evalBefore, evalAfter } = req.body;
    const result = await generateEndgameExplanation({
      fen: fen || 'start',
      name: name || 'Endgame Position',
      difficulty: difficulty || 'Intermediate',
      themes: themes || [],
      solution: solution || [],
      evalBefore: evalBefore ? { score: evalBefore.score || 0 } : { score: 0 },
      evalAfter: evalAfter ? { score: evalAfter.score || 0 } : { score: 0 }
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Endgame Explanation Error:', error);
    res.json({ success: true, data: { explanation: 'Activate your king and restrict the opponent\'s. Apply correct endgame technique.', beginnerExplanation: 'King activity is crucial in endgames. Push passed pawns with king support.', intermediateExplanation: 'Apply technique: opposition, key squares, zugzwang.', advancedExplanation: 'Calculate precisely — tempi and pawn structure decisions are critical.', mainIdea: 'Improve king position while restricting opponent\'s options.', strategicConcepts: ['King activity', 'Pawn structure', 'Opposition', 'Zugzwang'], tacticalThemes: ['Key squares', 'King triangulation', 'Pawn breaks'], commonMistakes: ['Passive king', 'Premature pawn pushes', 'Missing zugzwang'], practicalAdvice: 'Practice this endgame against an engine from both sides.', trainingRecommendations: ['Study classic examples', 'Use tablebases', 'Practice conversion'], position: 'The king must be active and pawns should be pushed with support.', objective: 'Convert the material or positional advantage into a win.', winningMethod: 'Improve king position, create passed pawns, and use opposition.', keyIdeas: ['King activity', 'Pawn promotion', 'Opposition', 'Zugzwang'], commonMistakes: ['Passive king', 'Premature pawn pushes', 'Missing zugzwang'] } });
  }
});

// Coach Plan
router.post('/coach/plan', async (req, res) => {
  try {
    const { username, rating, avgAccuracy, consistencyScore, blunderRate, tacticalAbilityScore, positionalPlayScore, openingScore, endgameQualityScore, gamesPlayed, favoriteOpening, decisionMakingScore } = req.body;
    const result = await generateCoachPlan({
      username: username || 'Player',
      rating: rating || 1200,
      avgAccuracy: avgAccuracy || 0,
      consistencyScore: consistencyScore || 50,
      blunderRate: blunderRate || 0,
      tacticalAbilityScore: tacticalAbilityScore || 50,
      positionalPlayScore: positionalPlayScore || 50,
      openingScore: openingScore || 50,
      endgameQualityScore: endgameQualityScore || 50,
      gamesPlayed: gamesPlayed || 0,
      favoriteOpening: favoriteOpening || 'Unknown',
      decisionMakingScore: decisionMakingScore || 50
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Coach Plan Error:', error);
    res.json({ success: true, data: { summary: 'AI explanation is temporarily unavailable.', todayGoal: 'AI explanation is temporarily unavailable.', focus: 'AI explanation is temporarily unavailable.', strengths: [], weaknesses: [], recommendedOpening: 'AI explanation is temporarily unavailable.', recommendedEndgame: 'AI explanation is temporarily unavailable.', trainingPriority: 'AI explanation is temporarily unavailable.', ratingTarget: 'AI explanation is temporarily unavailable.', difficulty: 'N/A', studyTime: 0, openings: [], tactics: [], endgames: [], trainingRecommendations: [], strategicConcepts: [] } });
  }
});

// Opening Search
router.post('/search/opening', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Opening name is required' });
    const result = await generateOpeningSearch(name.trim());
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Opening Search Error:', error);
    res.json({ success: true, data: { openingName: req.body?.name || 'Unknown Opening', eco: 'N/A', mainMoves: 'N/A', mainIdea: 'AI explanation is temporarily unavailable.', advantages: ['AI explanation is temporarily unavailable.'], disadvantages: ['AI explanation is temporarily unavailable.'], commonPlans: ['AI explanation is temporarily unavailable.'], commonMistakes: ['AI explanation is temporarily unavailable.'] } });
  }
});

// AI Chat
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Messages array is required' });
    const result = await generateChatResponse(messages);
    res.json({ success: true, data: { response: result } });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.json({ success: true, data: { response: 'AI explanation is temporarily unavailable.' } });
  }
});

// Identify Opening
router.post('/identify-opening', async (req, res) => {
  try {
    const { moves } = req.body;
    if (!moves) return res.status(400).json({ error: 'Moves string is required' });
    const result = await identifyOpeningAndExplain(moves);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Identify Opening Error:', error);
    res.json({ success: true, data: { identifiedOpening: 'Unknown Opening', eco: 'N/A', explanation: 'AI explanation is temporarily unavailable.', difficulty: 'Beginner', strategicConcepts: ['AI explanation is temporarily unavailable.'], tacticalThemes: ['AI explanation is temporarily unavailable.'], commonMistakes: ['AI explanation is temporarily unavailable.'], pawnStructure: 'AI explanation is temporarily unavailable.', piecePlacement: 'AI explanation is temporarily unavailable.', typicalPlans: ['AI explanation is temporarily unavailable.'], advantages: ['AI explanation is temporarily unavailable.'], disadvantages: ['AI explanation is temporarily unavailable.'], famousPlayers: ['AI explanation is temporarily unavailable.'], similarOpenings: ['AI explanation is temporarily unavailable.'], practiceRecommendations: ['AI explanation is temporarily unavailable.'] } });
  }
});

// Daily Training
router.post('/training/daily', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: 'Player profile is required' });
    const session = await generateTrainingSession(profile);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Daily Training Error:', error);
    res.json({ success: true, data: { date: new Date().toISOString().split('T')[0], sessionSummary: 'Unable to generate training session. Please try again.', components: [], sessionDuration: 0, difficulty: 'intermediate', playerRating: req.body?.profile?.rating || 1200 } });
  }
});

// Quiz Generate
router.post('/quiz/generate', async (req, res) => {
  try {
    const { categories, difficulty, count, userId } = req.body;
    const quiz = await generateQuiz({ categories: categories || ['mixed'], difficulty: difficulty || 'intermediate', count: count || 10, userId });
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.json({ success: true, data: { questionCount: 0, categories: req.body?.categories || ['mixed'], difficulty: req.body?.difficulty || 'intermediate', questions: [], description: 'Unable to generate quiz. Please try again.' } });
  }
});

// Game Review
router.post('/review/game', async (req, res) => {
  try {
    const { game, profile } = req.body;
    if (!game) return res.status(400).json({ error: 'Game data is required' });
    const review = await generateGameReview(game, profile || {});
    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Game Review Error:', error);
    res.json({ success: true, data: { gameId: req.body?.game?._id || null, summary: { result: req.body?.game?.result || 'unknown', accuracy: req.body?.game?.accuracy || 0 }, strengths: [], weaknesses: [], criticalMoments: [], trainingRecommendations: ['Unable to generate review. Please analyze the game directly.'], statistics: {} } });
  }
});

// Learning Path
router.post('/learning-path', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: 'Player profile is required' });
    const path = await generateLearningPath(profile);
    res.json({ success: true, data: path });
  } catch (error) {
    console.error('Learning Path Error:', error);
    res.json({ success: true, data: { currentRating: req.body?.profile?.rating || 1200, focusAreas: [], goals: { daily: [], weekly: [], monthly: [] }, dailyStudyMinutes: 30, studyPlan: { narrative: 'Unable to generate learning path. Please update your profile and try again.' } } });
  }
});

// Puzzle Recommendations
router.post('/recommend/puzzles', async (req, res) => {
  try {
    const { themes, rating, category, count } = req.body;
    const recommendations = await getPuzzleRecommendations({ themes: themes || [], rating: rating || 1200, category, count: count || 5 });
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Puzzle Recommendations Error:', error);
    res.json({ success: true, data: { themes: req.body?.themes || ['basic-tactics'], ratingRange: { min: 800, max: 1500 }, count: 5, difficulty: 'intermediate', instruction: 'Unable to generate recommendations.' } });
  }
});

// Opening Recommendations
router.post('/recommend/openings', async (req, res) => {
  try {
    const { profile } = req.body;
    const recommendations = await getOpeningRecommendations(profile || {});
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Opening Recommendations Error:', error);
    res.json({ success: true, data: { recommended: ['Italian Game', "Queen's Gambit", 'Caro-Kann Defense'], difficulty: 'intermediate', instruction: 'Study the recommended openings for your rating level.' } });
  }
});

// Endgame Recommendations
router.post('/recommend/endgames', async (req, res) => {
  try {
    const { profile } = req.body;
    const recommendations = await getEndgameRecommendations(profile || {});
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Endgame Recommendations Error:', error);
    res.json({ success: true, data: { themes: ['king-and-pawn', 'rook-endgame', 'opposition'], difficulty: 'intermediate', studyOrder: ['king-and-pawn', 'rook-endgame', 'opposition'], practiceInstruction: 'Practice basic endgame technique.' } });
  }
});

// Explore Openings
router.post('/explore/openings', async (req, res) => {
  try {
    const openings = await generateOpeningExplorerList();
    res.json({ success: true, data: openings });
  } catch (error) {
    console.error('Explore Openings Error:', error);
    res.json({ success: true, data: [] });
  }
});

// Explore Endgames
router.post('/explore/endgames', async (req, res) => {
  try {
    const endgames = await generateEndgameExplorerList();
    res.json({ success: true, data: endgames });
  } catch (error) {
    console.error('Explore Endgames Error:', error);
    res.json({ success: true, data: [] });
  }
});

module.exports = router;