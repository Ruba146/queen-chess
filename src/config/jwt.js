const secret = process.env.JWT_SECRET && process.env.JWT_SECRET.trim();

if (!secret) {
  throw new Error("JWT_SECRET is required");
}

module.exports = secret;