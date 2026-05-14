// controllers/userController.js
// Handles player profile retrieval and global leaderboard.

const User = require("../models/User");

// ============================================================
// GET /api/users/profile   (protected)
// Returns the full stats for the logged-in player.
// ============================================================
const getProfile = async (req, res, next) => {
  try {
    const user = req.user; // Attached by protect middleware

    res.status(200).json({
      profile: {
        id:              user._id,
        username:        user.username,
        email:           user.email,
        bestScore:       user.bestScore,
        highestLevel:    user.highestLevel,
        gamesPlayed:     user.gamesPlayed,
        avgReactionTime: Math.round(user.avgReactionTime),
        accuracy:        parseFloat(user.accuracy.toFixed(1)),
        memberSince:     user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/users/leaderboard   (public)
// Returns the top 20 players sorted by best score.
// ============================================================
const getLeaderboard = async (req, res, next) => {
  try {
    const players = await User.find({ gamesPlayed: { $gt: 0 } }) // Only players who've played
      .sort({ bestScore: -1 })
      .limit(20)
      .select("username bestScore highestLevel gamesPlayed");

    // Add rank numbers (1-based)
    const ranked = players.map((p, i) => ({
      rank:         i + 1,
      username:     p.username,
      bestScore:    p.bestScore,
      highestLevel: p.highestLevel,
      gamesPlayed:  p.gamesPlayed,
    }));

    res.status(200).json({ leaderboard: ranked });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, getLeaderboard };
