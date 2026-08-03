const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

const {
  explainMove,
  generateGameSummary,
  askAboutGame,
  getGameChatSessions,
  getGameChatMessages,
  MOVE_QUESTION_TYPES
} = require('../services/aiGameAnalysisService');

router.post('/game/explain-move', protect, async (req, res) => {
  try {
    const { gameId, moveNumber, questionType } = req.body;
    if (!gameId) return res.status(400).json({ success: false, error: 'gameId is required' });
    if (!moveNumber || moveNumber < 1) return res.status(400).json({ success: false, error: 'moveNumber must be a positive integer' });
    if (!questionType || !MOVE_QUESTION_TYPES[questionType]) return res.status(400).json({ success: false, error: `questionType must be one of: ${Object.keys(MOVE_QUESTION_TYPES).join(', ')}` });
    const result = await explainMove(gameId, moveNumber, questionType, req.user._id);
    res.json({ success: true, data: { explanation: result.explanation, moveData: result.moveData } });
  } catch (err) {
    console.error('[GameAnalysis] explain-move error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to analyze move.' });
  }
});

router.post('/game/summary', protect, async (req, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId) return res.status(400).json({ success: false, error: 'gameId is required' });
    const summary = await generateGameSummary(gameId, req.user._id);
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error('[GameAnalysis] game-summary error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate game summary.' });
  }
});

router.post('/game/ask', protect, async (req, res) => {
  try {
    const { gameId, question } = req.body;
    if (!gameId) return res.status(400).json({ success: false, error: 'gameId is required' });
    if (!question || !question.trim()) return res.status(400).json({ success: false, error: 'Question is required' });
    const result = await askAboutGame(gameId, question.trim(), req.user._id);
    res.json({ success: true, data: { response: result.response, chatId: result.chatId } });
  } catch (err) {
    console.error('[GameAnalysis] game-ask error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to answer question.' });
  }
});

router.get('/game/sessions', protect, async (req, res) => {
  try {
    const sessions = await getGameChatSessions(req.user._id);
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('[GameAnalysis] sessions error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load sessions.' });
  }
});

router.get('/game/sessions/:chatId', protect, async (req, res) => {
  try {
    const messages = await getGameChatMessages(req.params.chatId);
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('[GameAnalysis] session-messages error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load messages.' });
  }
});

module.exports = router;