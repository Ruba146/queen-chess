const dashboardService = require("../services/dashboardService");

async function getDashboard(req, res) {
  try {
    const result = await dashboardService.getDashboard(req.user.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getDashboard,
};