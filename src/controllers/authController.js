const authService = require("../services/authService");

async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    const result = await authService.registerUser(username, email, password);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
}

async function getProfile(req, res) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
}

async function updateProfile(req, res) {
  try {
    const updatedUser = await authService.updateProfile(req.user.id, req.body);
    res.json(updatedUser);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
}

async function updateProfilePicture(req, res) {
  try {
    const updatedUser = await authService.updateProfilePicture(req.user.id, req.body.profilePicture);
    res.json(updatedUser);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
}

async function getExtendedStats(req, res) {
  try {
    const stats = await authService.getExtendedStats(req.user.id, req.params.mode);
    res.json(stats);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || err });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  updateProfilePicture,
  getExtendedStats,
};