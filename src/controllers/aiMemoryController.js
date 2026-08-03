const aiMemoryService = require("../services/aiMemoryService");

async function getMemory(req, res) {
  try {
    const result = await aiMemoryService.getMemory(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function upsertMemory(req, res) {
  try {
    const result = await aiMemoryService.upsertMemory(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function deleteMemory(req, res) {
  try {
    const result = await aiMemoryService.deleteMemory(req.user.id, req.params.key);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  getMemory,
  upsertMemory,
  deleteMemory,
};