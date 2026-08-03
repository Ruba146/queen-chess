const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const gameController = require("../controllers/gameController");

router.get("/stats/:mode", protect, gameController.getStats);
router.post("/save", protect, gameController.saveGame);
router.get("/my-games", protect, gameController.listMyGames);
router.get("/:id", protect, gameController.getGameById);

module.exports = router;