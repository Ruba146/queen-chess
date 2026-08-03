const express = require('express');
const router = express.Router();
const { generateQuizSession, getClassicPositions } = require('../services/quizEngine');

router.post('/generate', async (req, res) => {
  try {
    const { category = 'mixed', count = 10, userId = null } = req.body;
    const session = await generateQuizSession({ category, count: Math.min(count, 20), userId });
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Quiz Generate Error:', error);
    try {
      const classic = getClassicPositions(req.body?.category || 'mixed', req.body?.count || 10);
      const session = {
        id: `session-fallback-${Date.now().toString(36)}`,
        category: req.body?.category || 'mixed',
        questionCount: classic.length,
        questions: classic.map((pos, i) => ({
          id: `quiz-${i + 1}`,
          fen: pos.fen,
          goal: pos.goal || 'Find the best move',
          category: pos.category || 'mixed',
          difficulty: pos.difficulty || 'intermediate',
          rating: pos.rating || 1000,
          source: 'classic',
          solution: pos.solution || []
        })),
        createdAt: new Date().toISOString(),
        description: 'Classic chess puzzles.',
        fallback: true
      };
      return res.json({ success: true, data: session });
    } catch (fallbackError) {
      return res.status(500).json({ success: false, error: 'Failed to generate quiz session.' });
    }
  }
});

router.post('/session', async (req, res) => {
  try {
    const { category = 'mixed', count = 10, userId = null } = req.body;
    const session = await generateQuizSession({ category, count: Math.min(count, 20), userId });
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Quiz Session Error:', error);
    try {
      const classic = getClassicPositions(req.body?.category || 'mixed', req.body?.count || 10);
      const session = {
        id: `session-fallback-${Date.now().toString(36)}`,
        category: req.body?.category || 'mixed',
        questionCount: classic.length,
        questions: classic.map((pos, i) => ({
          id: `quiz-${i + 1}`,
          fen: pos.fen,
          goal: pos.goal || 'Find the best move',
          category: pos.category || 'mixed',
          difficulty: pos.difficulty || 'intermediate',
          rating: pos.rating || 1000,
          source: 'classic',
          solution: pos.solution || []
        })),
        createdAt: new Date().toISOString(),
        description: 'Classic chess puzzles.',
        fallback: true
      };
      return res.json({ success: true, data: session });
    } catch (fallbackError) {
      return res.status(500).json({ success: false, error: 'Failed to generate quiz session.' });
    }
  }
});

router.post('/classic', (req, res) => {
  try {
    const { category = 'mixed', count = 10 } = req.body;
    const positions = getClassicPositions(category, Math.min(count, 20));
    res.json({
      success: true,
      data: {
        id: `session-classic-${Date.now().toString(36)}`,
        category,
        questionCount: positions.length,
        questions: positions.map((pos, i) => ({
          id: `quiz-${i + 1}`,
          fen: pos.fen,
          goal: pos.goal || 'Find the best move',
          category: pos.category || category,
          difficulty: pos.difficulty || 'intermediate',
          rating: pos.rating || 1000,
          source: 'classic'
        })),
        createdAt: new Date().toISOString(),
        description: 'Classic chess puzzles.',
        fallback: true
      }
    });
  } catch (error) {
    console.error('Classic Quiz Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate classic quiz.' });
  }
});

module.exports = router;