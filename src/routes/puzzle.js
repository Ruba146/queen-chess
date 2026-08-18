const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const puzzleController = require("../controllers/puzzleController");

router.use(protect);

router.get("/collections", puzzleController.listCollections);
router.get("/collections/:category", puzzleController.getCollection);
router.get("/collections/:category/puzzles", puzzleController.getCollectionPuzzles);
router.get("/collections/:category/next", puzzleController.getNextPuzzle);
router.post("/collections/:category/submit", puzzleController.submitAnswer);
router.post("/collections/:category/reset", puzzleController.resetCategoryProgress);
router.get("/puzzles/:puzzleId", puzzleController.getPuzzle);
router.get("/puzzles/:puzzleId/hint", puzzleController.getHint);
router.post("/puzzles", puzzleController.createPuzzle);
router.post("/puzzles/generate", puzzleController.generateAIPuzzle);
router.get("/daily-challenge", puzzleController.getDailyChallenge);
router.get("/weekly-challenge", puzzleController.getWeeklyChallenge);
router.post("/challenge/submit", puzzleController.submitChallengeAnswer);
router.post("/survival/start", puzzleController.startSurvival);
router.post("/survival/submit", puzzleController.submitSurvivalAnswer);
router.get("/analytics", puzzleController.getAnalytics);
router.get("/rating", puzzleController.getUserPuzzleRating);
router.get("/rating/history", puzzleController.getUserPuzzleRatingHistory);
router.get("/adaptive/puzzles", puzzleController.getAdaptivePuzzles);
router.get("/weak-themes", puzzleController.getWeakThemes);

module.exports = router;
