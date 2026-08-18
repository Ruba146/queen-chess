const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const jwtSecret = require("../config/jwt");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, jwtSecret);
      const user = await userRepository.getUserById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error("JWT VERIFY ERROR:", error);
      return res.status(401).json({
        message: "Not authorized",
        error: error.message,
      });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }
};

module.exports = protect;

// Authentication middleware