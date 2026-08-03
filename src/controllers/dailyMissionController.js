const dailyMissionService = require("../services/dailyMissionService");

async function getMission(req, res) {
  try {
    const result = await dailyMissionService.getOrCreateTodayMission(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function refreshMission(req, res) {
  try {
    const result = await dailyMissionService.refreshMission(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProgress(req, res) {
  try {
    const result = await dailyMissionService.updateProgress(req.user.id, req.params.missionId, req.body.progress);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  getMission,
  refreshMission,
  updateProgress,
};