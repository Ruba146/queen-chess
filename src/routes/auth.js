const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware.js");
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", protect, authController.getProfile);
router.put("/profile", protect, authController.updateProfile);
router.put("/change-password", protect, authController.changePassword);
router.put("/profile-picture", protect, authController.updateProfilePicture);
router.get("/extended-stats/:mode", protect, authController.getExtendedStats);
router.get("/rating-history/:mode", protect, authController.getRatingHistory);

module.exports = router;
