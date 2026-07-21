const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      console.log("TOKEN:", token);
      console.log("JWT_SECRET:", process.env.JWT_SECRET);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("DECODED:", decoded);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        console.log("USER NOT FOUND");
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();

    } catch (error) {
      console.error("JWT VERIFY ERROR:", error);
      return res.status(401).json({
        message: "Not authorized",
        error: error.message
      });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }
};

module.exports = protect;