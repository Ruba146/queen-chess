const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const aiMemoryController = require("../controllers/aiMemoryController");

router.get("/", protect, aiMemoryController.getMemory);
router.post("/", protect, aiMemoryController.upsertMemory);
router.delete("/:key", protect, aiMemoryController.deleteMemory);

module.exports = router;