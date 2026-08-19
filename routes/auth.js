const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const protect = require("../middleware/authMiddleware");
const jwtSecret = require("../utils/jwtSecret");
const { registerUser, loginUser, getProfile, updateProfile, changePassword, updateProfilePicture, getExtendedStats, getRatingHistory } = require("../services/authService");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await registerUser(username, email, password);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
});

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const updatedUser = await updateProfile(req.user.id, req.body);
    res.json(updatedUser);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
});

router.put("/change-password", protect, async (req, res) => {
  try {
    const result = await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
});

router.put("/profile-picture", protect, async (req, res) => {
  try {
    const updatedUser = await updateProfilePicture(req.user.id, req.body.profilePicture);
    res.json(updatedUser);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
});

router.get("/extended-stats/:mode", protect, async (req, res) => {
  try {
    const stats = await getExtendedStats(req.user.id, req.params.mode);
    res.json(stats);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
});

router.get("/rating-history/:mode", protect, async (req, res) => {
  try {
    const result = await getRatingHistory(req.user.id, req.params.mode);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err || "Server error" });
  }
});

module.exports = router;
