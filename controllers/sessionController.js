// controllers/sessionController.js
// Saves completed game sessions and retrieves history.
// Also updates the User's aggregate stats after each game.

const GameSession = require("../models/GameSession");
const User = require("../models/User");

// ============================================================
// POST /api/sessions/save   (protected)
// Body: { score, levelReached, averageReactionTime, accuracy, sessionDuration, mode }
// Called automatically when a game ends.
// ============================================================
const saveSession = async (req, res, next) => {
  try {
    const {
      score = 0,
      levelReached = 1,
      averageReactionTime = 0,
      accuracy = 0,
      sessionDuration = 0,
      mode = "classic",
    } = req.body;

    const userId = req.user._id;

    // 1. Persist the session record
    const session = await GameSession.create({
      userId,
      score,
      levelReached,
      averageReactionTime,
      accuracy,
      sessionDuration,
      mode,
    });

    // 2. Update the User's aggregate stats
    const user = await User.findById(userId);

    // Increment games played counter
    const newGamesPlayed = user.gamesPlayed + 1;

    // Update best score if this game beat it
    const newBestScore = Math.max(user.bestScore, score);

    // Update highest level if this game beat it
    const newHighestLevel = Math.max(user.highestLevel, levelReached);

    // Rolling average for reaction time
    // Formula: newAvg = (oldAvg * oldCount + newValue) / newCount
    const newAvgReaction =
      (user.avgReactionTime * user.gamesPlayed + averageReactionTime) / newGamesPlayed;

    // Rolling average for accuracy
    const newAccuracy =
      (user.accuracy * user.gamesPlayed + accuracy) / newGamesPlayed;

    await User.findByIdAndUpdate(userId, {
      gamesPlayed:     newGamesPlayed,
      bestScore:       newBestScore,
      highestLevel:    newHighestLevel,
      avgReactionTime: Math.round(newAvgReaction),
      accuracy:        parseFloat(newAccuracy.toFixed(1)),
    });

    // 3. Determine if this is a new personal best (useful for the UI)
    const isNewBest = score > user.bestScore;

    // 4. Find the player's global leaderboard rank
    const rank = await User.countDocuments({ bestScore: { $gt: newBestScore } });
    const globalRank = rank + 1;

    res.status(201).json({
      message:    "Session saved",
      sessionId:  session._id,
      isNewBest,
      globalRank,
      updatedStats: {
        bestScore:       newBestScore,
        highestLevel:    newHighestLevel,
        gamesPlayed:     newGamesPlayed,
        avgReactionTime: Math.round(newAvgReaction),
        accuracy:        parseFloat(newAccuracy.toFixed(1)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/sessions/history   (protected)
// Returns the 10 most recent sessions for the logged-in player.
// ============================================================
const getHistory = async (req, res, next) => {
  try {
    const sessions = await GameSession.find({ userId: req.user._id })
      .sort({ playedAt: -1 })
      .limit(10)
      .select("score levelReached accuracy averageReactionTime sessionDuration mode playedAt");

    res.status(200).json({ sessions });
  } catch (err) {
    next(err);
  }
};

module.exports = { saveSession, getHistory };
