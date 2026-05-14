// middleware/authMiddleware.js
// Protects routes that require a logged-in player.
// Usage: router.get("/profile", protect, handler)

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // JWT is sent in the Authorization header as: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized — no token provided" });
  }

  try {
    // Verify the token using our secret. This throws if expired or tampered.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user object to the request (minus the password field)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    next(); // All good — let the real route handler run
  } catch (err) {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
};

module.exports = { protect };
