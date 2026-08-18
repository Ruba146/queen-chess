const gameAnalysisService = require("../services/gameAnalysisService");
const playerProfileService = require("../services/playerProfileService");

async function getAnalysis(req, res) {
  try {
    const result = await gameAnalysisService.getFullAnalysis(req.params.id);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
}

async function getLegacyAnalysis(req, res) {
  try {
    const result = await gameAnalysisService.getLegacyAnalysis(req.params.id);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
}

async function getPlayerProfile(req, res) {
  try {
    const result = await playerProfileService.analyzePlayerProfile(req.user.id, 20);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
}

module.exports = {
  getAnalysis,
  getLegacyAnalysis,
  getPlayerProfile,
};