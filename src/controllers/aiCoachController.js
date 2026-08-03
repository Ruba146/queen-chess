const aiCoachService = require("../services/aiCoachService");

async function getContext(req, res) {
  try {
    const { page } = req.body;
    const result = await aiCoachService.getContext(req.user.id, req.user, page);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function chat(req, res) {
  try {
    const { message, page } = req.body;
    const result = await aiCoachService.chat(req.user.id, message, page);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  getContext,
  chat,
};