const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const aiCoachController = require("../controllers/aiCoachController");

router.post("/coach/context", protect, aiCoachController.getContext);
router.post("/coach/chat", protect, aiCoachController.chat);

module.exports = router;