const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const dailyMissionController = require("../controllers/dailyMissionController");

router.get("/", protect, dailyMissionController.getMission);
router.post("/refresh", protect, dailyMissionController.refreshMission);
router.post("/:missionId/progress", protect, dailyMissionController.updateProgress);

module.exports = router;