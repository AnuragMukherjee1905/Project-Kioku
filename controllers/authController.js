// controllers/authController.js
// Handles registration, login, and token-based identity lookup.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ---- Helper: create and sign a JWT for a given user id ----
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ============================================================
// POST /api/auth/register
// Body: { username, email, password }
// ============================================================
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Basic presence check (Mongoose handles deeper validation)
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create the user — password hashing happens in the User pre-save hook
    const user = await User.create({ username, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
      },
    });
  } catch (err) {
    next(err); // Passes to errorMiddleware (handles duplicate key etc.)
  }
};

// ============================================================
// POST /api/auth/login
// Body: { email, password }
// ============================================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user and explicitly include the password field (it's hidden by default)
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      // Same message for both cases — don't reveal which field is wrong
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id:              user._id,
        username:        user.username,
        email:           user.email,
        bestScore:       user.bestScore,
        highestLevel:    user.highestLevel,
        gamesPlayed:     user.gamesPlayed,
        avgReactionTime: user.avgReactionTime,
        accuracy:        user.accuracy,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/auth/me   (protected)
// Returns the currently authenticated user's basic info.
// Used on page load when a token already exists in localStorage.
// ============================================================
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware
    const user = req.user;

    res.status(200).json({
      user: {
        id:              user._id,
        username:        user.username,
        email:           user.email,
        bestScore:       user.bestScore,
        highestLevel:    user.highestLevel,
        gamesPlayed:     user.gamesPlayed,
        avgReactionTime: user.avgReactionTime,
        accuracy:        user.accuracy,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
