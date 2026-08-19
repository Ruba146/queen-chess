const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const analysisController = require("../controllers/analysisController");

router.get("/:id", auth, analysisController.getAnalysis);
router.get("/legacy/:id", auth, analysisController.getLegacyAnalysis);
router.get("/profile", auth, analysisController.getPlayerProfile);

module.exports = router;
